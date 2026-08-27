import { getCurrentUser } from '@/lib/auth'
import { orderNumber } from '@/lib/order'
import { prisma } from '@/lib/prisma'
import { createReceiptPdf, receiptFilename } from '@/lib/receipt'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { orderId?: string; trackingCode?: string } | null
  if (!body?.orderId || !body.trackingCode) return Response.json({ error: 'Order credentials are required.' }, { status: 400 })

  const user = await getCurrentUser()
  const customer = user?.email ? await prisma.user.findUnique({ where: { email: user.email.toLowerCase() }, select: { id: true } }) : null
  const order = await prisma.order.findFirst({ where: customer ? { id: body.orderId, userId: customer.id } : { id: body.orderId, trackingCode: body.trackingCode }, include: { items: { include: { product: { select: { name: true } } } } } })
  if (!order || order.trackingCode !== body.trackingCode) return Response.json({ error: 'Order not found.' }, { status: 404 })

  const items = order.items.map((item) => ({ name: item.product.name, color: item.color, size: item.size, price: Number(item.price), quantity: item.quantity }))
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = Number(order.total)
  const shipping = Math.max(0, total - subtotal)
  const invoice = createReceiptPdf({ orderNumber: orderNumber(order.id), trackingCode: order.trackingCode ?? undefined, deliveryDetails: { name: order.customerName ?? 'Customer', address: order.address ?? '', city: order.city ?? '' }, items, subtotal, shipping, total })

  return new Response(invoice, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${receiptFilename(orderNumber(order.id))}"`, 'Cache-Control': 'no-store' } })
}
