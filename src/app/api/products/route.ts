import { ProductSize, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const search = params.get('search')?.trim() ?? ''
  const category = params.get('category')?.trim() ?? ''
  const color = params.get('color')?.trim() ?? ''
  const sizeValue = params.get('size')?.trim() ?? ''
  const minPriceValue = params.get('minPrice')
  const maxPriceValue = params.get('maxPrice')
  const minPrice = minPriceValue ? Number(minPriceValue) : Number.NaN
  const maxPrice = maxPriceValue ? Number(maxPriceValue) : Number.NaN
  const page = Math.max(0, Number.parseInt(params.get('page') || '0', 10) || 0)
  const limit = Math.min(24, Math.max(1, Number.parseInt(params.get('limit') || '12', 10) || 12))
  const size = Object.values(ProductSize).includes(sizeValue as ProductSize) ? sizeValue as ProductSize : undefined
  const where: Prisma.ProductWhereInput = {
    ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }, { category: { name: { contains: search, mode: 'insensitive' } } }] } : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(color || size ? { sizeStocks: { some: { ...(color ? { color } : {}), ...(size ? { size } : {}), quantity: { gt: 0 } } } } : {}),
    ...(Number.isFinite(minPrice) ? { price: { gte: minPrice } } : {}),
    ...(Number.isFinite(maxPrice) ? { price: { lte: maxPrice } } : {}),
  }
  const products = await prisma.product.findMany({ where, include: { sizeStocks: true }, orderBy: { createdAt: 'desc' }, skip: page * limit, take: limit + 1 })
  return Response.json({ products: products.slice(0, limit).map((product) => ({ ...product, price: Number(product.price) })), hasMore: products.length > limit })
}
