import { OrderStatus } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getCustomer() {
  const user = await getCurrentUser()
  if (!user?.email) return null
  return prisma.user.upsert({ where: { email: user.email.toLowerCase() }, update: {}, create: { email: user.email.toLowerCase(), name: typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : null }, select: { id: true } })
}

export async function GET(request: Request) {
  const productId = new URL(request.url).searchParams.get('productId')?.trim()
  if (!productId) return Response.json({ error: 'Product ID is required.' }, { status: 400 })
  const reviews = await prisma.review.findMany({ where: { productId }, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } })
  return Response.json({ reviews: reviews.map((review) => ({ id: review.id, rating: review.rating, comment: review.comment, author: review.user.name || 'Customer', verifiedPurchase: review.verifiedPurchase, createdAt: review.createdAt.toISOString() })) })
}

export async function POST(request: Request) {
  const customer = await getCustomer()
  if (!customer) return Response.json({ error: 'Please log in to write a review.' }, { status: 401 })
  const body = await request.json() as { productId?: string; rating?: number; comment?: string }
  const productId = body.productId?.trim()
  const rating = Number(body.rating)
  const comment = body.comment?.trim() || null
  if (!productId || !Number.isInteger(rating) || rating < 1 || rating > 5) return Response.json({ error: 'Choose a rating from 1 to 5 stars.' }, { status: 400 })
  if (comment && comment.length > 1000) return Response.json({ error: 'Reviews must be 1,000 characters or fewer.' }, { status: 400 })
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } })
  if (!product) return Response.json({ error: 'Product not found.' }, { status: 404 })
  const purchase = await prisma.order.findFirst({ where: { userId: customer.id, status: OrderStatus.DELIVERED, items: { some: { productId } } }, select: { id: true } })
  const verifiedPurchase = Boolean(purchase)
  const review = await prisma.review.upsert({ where: { userId_productId: { userId: customer.id, productId } }, update: { rating, comment, verifiedPurchase }, create: { userId: customer.id, productId, rating, comment, verifiedPurchase }, include: { user: { select: { name: true } } } })
  return Response.json({ review: { id: review.id, rating: review.rating, comment: review.comment, author: review.user.name || 'Customer', verifiedPurchase: review.verifiedPurchase, createdAt: review.createdAt.toISOString() } })
}
