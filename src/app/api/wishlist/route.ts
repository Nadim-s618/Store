import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getCustomer() {
  const user = await getCurrentUser()
  if (!user?.email) return null
  return prisma.user.upsert({ where: { email: user.email.toLowerCase() }, update: {}, create: { email: user.email.toLowerCase(), name: typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : null }, select: { id: true } })
}

export async function GET(request: Request) {
  const customer = await getCustomer()
  if (!customer) return Response.json({ error: 'Unauthorized.' }, { status: 401 })
  const productId = new URL(request.url).searchParams.get('productId')?.trim()
  const entries = await prisma.wishlist.findMany({ where: { userId: customer.id, ...(productId ? { productId } : {}) }, select: { productId: true } })
  return Response.json({ productIds: entries.map((entry) => entry.productId) })
}

export async function POST(request: Request) {
  const customer = await getCustomer()
  if (!customer) return Response.json({ error: 'Please log in to save favorites.' }, { status: 401 })
  const body = await request.json() as { productId?: string }
  const productId = body.productId?.trim()
  if (!productId) return Response.json({ error: 'Product ID is required.' }, { status: 400 })
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } })
  if (!product) return Response.json({ error: 'Product not found.' }, { status: 404 })
  await prisma.wishlist.upsert({ where: { userId_productId: { userId: customer.id, productId } }, update: {}, create: { userId: customer.id, productId } })
  return Response.json({ saved: true })
}

export async function DELETE(request: Request) {
  const customer = await getCustomer()
  if (!customer) return Response.json({ error: 'Unauthorized.' }, { status: 401 })
  const body = await request.json() as { productId?: string }
  const productId = body.productId?.trim()
  if (!productId) return Response.json({ error: 'Product ID is required.' }, { status: 400 })
  await prisma.wishlist.deleteMany({ where: { userId: customer.id, productId } })
  return Response.json({ saved: false })
}
