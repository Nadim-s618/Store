import { Prisma } from '@prisma/client'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'

type StoredProductImage = { id: string; productId: string; color: string; view: string; url: string; sortOrder: number }

async function getStoredProductImages(productId: string): Promise<StoredProductImage[]> {
  try {
    const storage = createAdminClient().storage.from('product-images')
    const { data: files, error } = await storage.list(productId, { limit: 100 })
    if (error) return []

    return files.filter((file) => file.name).map((file, index) => {
      const match = file.name.match(/^([a-z0-9]+)-(front|back|right|left)-/i)
      const color = match?.[1] ? match[1][0].toUpperCase() + match[1].slice(1).toLowerCase() : 'Default'
      const view = match?.[2] ? match[2][0].toUpperCase() + match[2].slice(1).toLowerCase() : 'Front'
      return { id: `${productId}-${file.name}`, productId, color, view, url: storage.getPublicUrl(`${productId}/${file.name}`).data.publicUrl, sortOrder: index }
    })
  } catch {
    return []
  }
}

async function withImageFallback<T extends { id: string; imageUrl: string | null; images: StoredProductImage[] }>(product: T): Promise<T> {
  const images = product.images.length > 0 ? product.images : await getStoredProductImages(product.id)
  return { ...product, images, imageUrl: product.imageUrl ?? images[0]?.url ?? null }
}

type GetProductsOptions = {
  includeCategory?: boolean
}

type ProductWithCategory = Prisma.ProductGetPayload<{ include: { category: true; sizeStocks: true } }>

export const shopCategoryDefaults = [
  { name: 'Hoodies', slug: 'hoodie', description: 'Soft structure for slow mornings and late nights.', imageUrl: '/signup.webp' },
  { name: 'Shirts', slug: 'shirt', description: 'Clean layers, cut to stay in rotation.', imageUrl: '/feature.webp' },
  { name: 'Pants', slug: 'pants', description: 'A grounded foundation for every day.', imageUrl: '/background.webp' },
  { name: 'Jackets', slug: 'jacket', description: 'The final layer, considered from every angle.', imageUrl: "/f'.webp" },
  { name: 'Sweaters', slug: 'sweater', description: 'Warmth without the extra noise.', imageUrl: '/signup.webp' },
  { name: 'Accessories', slug: 'accessories', description: 'Quiet details that finish the look.', imageUrl: '/feature.webp' },
] as const

export async function getShopCategories() {
  const saved = await prisma.category.findMany({ orderBy: { createdAt: 'asc' } })
  const defaults = shopCategoryDefaults.map((fallback) => {
    const category = saved.find((item) => item.slug === fallback.slug)
    return { ...fallback, id: category?.id ?? fallback.slug, name: category?.name ?? fallback.name, description: category?.description || fallback.description, imageUrl: category?.imageUrl || fallback.imageUrl }
  })
  const defaultSlugs = new Set<string>(shopCategoryDefaults.map((category) => category.slug))
  return [...defaults, ...saved.filter((category) => !defaultSlugs.has(category.slug)).map((category) => ({ ...category, description: category.description || 'Explore the latest considered pieces.', imageUrl: category.imageUrl || '/background.webp' }))]
}

export function getProducts(options: { includeCategory: true }): Promise<ProductWithCategory[]>
export function getProducts(options?: { includeCategory?: false }): ReturnType<typeof prisma.product.findMany>
export async function getProducts({
  includeCategory = false,
}: GetProductsOptions = {}) {
  return prisma.product.findMany({
    include: includeCategory ? { category: true, sizeStocks: true } : undefined,
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true, sizeStocks: true, sizeMeasurements: true, images: { orderBy: { sortOrder: 'asc' } }, reviews: { orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } } },
  })
  return product ? withImageFallback(product) : null
}

export async function getRelatedProducts(productId: string, categoryId: string) {
  const products = await prisma.product.findMany({ where: { categoryId, id: { not: productId } }, include: { sizeStocks: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } }, orderBy: { createdAt: 'desc' }, take: 4 })
  return Promise.all(products.map(withImageFallback))
}

async function fetchHomepageCollections() {
  const [topCollection, newArrivals] = await Promise.all([
    prisma.product.findMany({
      where: { isTopCollection: true },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, sizeStocks: true },
      orderBy: [{ topCollectionOrder: 'asc' }, { createdAt: 'desc' }],
      take: 4,
    }),
    prisma.product.findMany({
      where: { isNewArrival: true },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, sizeStocks: true },
      orderBy: [{ newArrivalOrder: 'asc' }, { createdAt: 'desc' }],
      take: 4,
    }),
  ])

  return {
    topCollection: await Promise.all(topCollection.map(withImageFallback)),
    newArrivals: await Promise.all(newArrivals.map(withImageFallback)),
  }
}

export const getHomepageCollections = unstable_cache(
  fetchHomepageCollections,
  ['homepage-collections'],
  { revalidate: 60, tags: ['homepage-products'] },
)
