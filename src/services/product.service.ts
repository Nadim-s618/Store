import { prisma } from '@/lib/prisma'

type GetProductsOptions = {
  includeCategory?: boolean
}

export async function getProducts({
  includeCategory = false,
}: GetProductsOptions = {}) {
  return prisma.product.findMany({
    include: includeCategory ? { category: true } : undefined,
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  })
}
