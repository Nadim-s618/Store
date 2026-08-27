import { createReceiptPdf, receiptFilename } from '@/lib/receipt'
import { getCurrentUser } from '@/lib/auth'
import { orderNumber } from '@/lib/order'
import { prisma } from '@/lib/prisma'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user?.email) return Response.json({ error: 'You must be signed in to download this invoice.' }, { status: 401 })

  const { id } = await params
  const customer = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() }, select: { id: true } })
  if (!customer) return Response.json({ error: 'Order not found.' }, { status: 404 })
  const order = await prisma.order.findFirst({ where: { id, userId: customer.id }, include: { items: { include: { product: { select: { name: true } } } } } })
  if (!order) return Response.json({ error: 'Order not found.' }, { status: 404 })

  const items = order.items.map((item) => ({ name: item.product.name, color: item.color, size: item.size, price: Number(item.price), quantity: item.quantity }))
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = Number(order.total)
  const shipping = Math.max(0, total - subtotal)
  const invoice = createReceiptPdf({ orderNumber: orderNumber(order.id), trackingCode: order.trackingCode ?? undefined, deliveryDetails: { name: order.customerName ?? user.user_metadata?.name ?? 'Customer', address: order.address ?? '', city: order.city ?? '' }, items, subtotal, shipping, total })

  return new Response(invoice, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${receiptFilename(orderNumber(order.id))}"`, 'Cache-Control': 'no-store' } })
}
