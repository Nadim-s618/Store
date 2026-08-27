import { OrderStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

type SubmittedItem = { id: string; productId?: string; quantity: number }
type OrderRequest = { deliveryDetails: { name: string; email: string; phone?: string; address?: string; city?: string; postcode?: string; country?: string }; items: SubmittedItem[]; total: number; paymentMethod?: string }

export async function GET(request: Request) {
  const trackingCode = new URL(request.url).searchParams.get('trackingCode')?.trim()
  if (!trackingCode) return Response.json({ message: 'Orders API' })
  const order = await prisma.order.findUnique({ where: { trackingCode }, select: { trackingCode: true, status: true, createdAt: true, updatedAt: true } })
  if (!order) return Response.json({ error: 'Tracking code not found.' }, { status: 404 })
  return Response.json(order)
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as OrderRequest
    const email = body.deliveryDetails?.email?.trim().toLowerCase()
    const items = body.items ?? []
    if (!email || !body.deliveryDetails?.name || items.length === 0) {
      return Response.json({ error: 'Order details are incomplete.' }, { status: 400 })
    }

    const productIds = [...new Set(items.map((item) => item.productId ?? item.id.split(':')[0]).filter(Boolean))]
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } })
    const productsById = new Map(products.map((product) => [product.id, product]))
    if (products.length !== productIds.length) {
      return Response.json({ error: 'One or more products are no longer available.' }, { status: 400 })
    }

    const authenticatedUser = await getCurrentUser()
    const user = await prisma.user.upsert({
      where: { email },
      update: { name: body.deliveryDetails.name.trim() },
      create: { email, name: body.deliveryDetails.name.trim() },
    })
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        total: Number(body.total || 0),
        customerName: body.deliveryDetails.name.trim(),
        customerEmail: email,
        phone: body.deliveryDetails.phone?.trim() || null,
        address: body.deliveryDetails.address?.trim() || null,
        city: body.deliveryDetails.city?.trim() || null,
        postcode: body.deliveryDetails.postcode?.trim() || null,
        country: body.deliveryDetails.country?.trim() || null,
        paymentMethod: body.paymentMethod === 'cod' ? 'COD' : 'COD',
        trackingCode: `NEMO-TRK-${crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`,
        items: {
          create: items.map((item) => {
            const productId = item.productId ?? item.id.split(':')[0]
            const product = productsById.get(productId)!
            return { productId, quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)), price: product.price }
          }),
        },
      },
    })
    const orderNumber = `NEMO-${order.id.slice(-6).toUpperCase()}`
    return Response.json({ orderId: order.id, orderNumber, trackingCode: order.trackingCode, authenticated: Boolean(authenticatedUser) }, { status: 201 })
  } catch (error) {
    console.error('Unable to create order', error)
    return Response.json({ error: 'Unable to place the order right now.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await getCurrentUser()
    const configuredAdminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean)
    const hasAdminRole = admin?.app_metadata?.role === 'admin'
    const isConfiguredAdmin = Boolean(admin?.email && configuredAdminEmails.includes(admin.email.toLowerCase()))
    if (!admin || (!hasAdminRole && !isConfiguredAdmin)) {
      return Response.json({ error: 'Unauthorized.' }, { status: 403 })
    }
    const body = await request.json() as { orderId?: string; status?: string }
    if (!body.orderId || !Object.values(OrderStatus).includes(body.status as OrderStatus)) return Response.json({ error: 'Invalid order status.' }, { status: 400 })
    await prisma.order.update({ where: { id: body.orderId }, data: { status: body.status as OrderStatus } })
    return Response.json({ success: true })
  } catch (error) {
    console.error('Unable to update order status', error)
    return Response.json({ error: 'Unable to update order status.' }, { status: 500 })
  }
}
