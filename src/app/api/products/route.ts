import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams.get('search')?.trim() ?? ''
  if (search.length < 2) return Response.json([])
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { name: { contains: search, mode: 'insensitive' } } },
      ],
    },
    select: { slug: true, name: true, price: true, imageUrl: true },
    orderBy: { createdAt: 'desc' },
    take: 6,
  })
  return Response.json(products.map((product) => ({ ...product, price: Number(product.price) })))
}
