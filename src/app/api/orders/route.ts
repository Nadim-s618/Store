import { OrderStatus, ProductSize } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { orderNumber } from '@/lib/order'

type SubmittedItem = { id: string; productId?: string; color?: string; size?: string; quantity: number }
type OrderRequest = { deliveryDetails: { name: string; email: string; phone?: string; address?: string; city?: string; postcode?: string; country?: string }; items: SubmittedItem[]; total: number; paymentMethod?: string }

type ValidatedItem = { productId: string; color: string; size: ProductSize; quantity: number }

function parseItem(item: SubmittedItem): ValidatedItem | null {
  const [productIdFromId, colorFromId, sizeFromId] = item.id.split(':')
  const productId = item.productId?.trim() || productIdFromId?.trim()
  const color = item.color?.trim() || colorFromId?.trim() || 'Default'
  const sizeValue = item.size?.trim() || sizeFromId?.trim() || 'M'
  const quantity = Number(item.quantity)
  if (!productId || !color || !Object.values(ProductSize).includes(sizeValue as ProductSize) || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) return null
  return { productId, color, size: sizeValue as ProductSize, quantity }
}

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
    const submittedItems = body.items ?? []
    if (!email || !body.deliveryDetails?.name?.trim() || submittedItems.length === 0) {
      return Response.json({ error: 'Order details are incomplete.' }, { status: 400 })
    }

    const parsedItems = submittedItems.map(parseItem)
    if (parsedItems.some((item): item is null => item === null)) {
      return Response.json({ error: 'One or more cart items are invalid.' }, { status: 400 })
    }
    const items = parsedItems as ValidatedItem[]

    const itemMap = new Map<string, ValidatedItem>()
    for (const item of items) {
      const key = `${item.productId}:${item.color}:${item.size}`
      const existing = itemMap.get(key)
      if (existing) existing.quantity += item.quantity
      else itemMap.set(key, { ...item })
    }
    const normalizedItems = [...itemMap.values()]

    const productIds = [...new Set(normalizedItems.map((item) => item.productId))]
    const products = await prisma.product.findMany({ where: { id: { in: productIds } }, include: { sizeStocks: true } })
    const productsById = new Map(products.map((product) => [product.id, product]))
    if (products.length !== productIds.length) {
      return Response.json({ error: 'One or more products are no longer available.' }, { status: 400 })
    }

    for (const item of normalizedItems) {
      const product = productsById.get(item.productId)!
      const variantStock = product.sizeStocks.find((stock) => stock.color === item.color && stock.size === item.size)
      const available = product.sizeStocks.length > 0 ? (variantStock?.quantity ?? 0) : product.stock
      if (item.quantity > available) {
        return Response.json({ error: `${product.name} (${item.color} / ${item.size}) does not have enough stock.` }, { status: 409 })
      }
    }

    const subtotalCents = normalizedItems.reduce((sum, item) => {
      const product = productsById.get(item.productId)!
      return sum + Math.round(Number(product.price) * 100) * item.quantity
    }, 0)
    const shippingCents = subtotalCents >= 15000 ? 0 : 1200
    const totalCents = subtotalCents + shippingCents
    const authenticatedUser = await getCurrentUser()
    const user = await prisma.user.upsert({
      where: { email },
      update: { name: body.deliveryDetails.name.trim() },
      create: { email, name: body.deliveryDetails.name.trim() },
    })
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        total: totalCents / 100,
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
          create: normalizedItems.map((item) => {
            const product = productsById.get(item.productId)!
            return { productId: item.productId, quantity: item.quantity, price: product.price, color: item.color, size: item.size }
          }),
        },
      },
    })
    return Response.json({ orderId: order.id, orderNumber: orderNumber(order.id), trackingCode: order.trackingCode, authenticated: Boolean(authenticatedUser) }, { status: 201 })
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
    const nextStatus = body.status as OrderStatus
    await prisma.$transaction(async (transaction) => {
      const order = await transaction.order.findUnique({ where: { id: body.orderId }, include: { items: true } })
      if (!order) throw new Error('ORDER_NOT_FOUND')

      if (nextStatus !== OrderStatus.PENDING && !order.inventoryDecremented) {
        for (const item of order.items) {
          const product = await transaction.product.findUnique({ where: { id: item.productId }, select: { stock: true, sizeStocks: { where: { color: item.color, size: item.size }, select: { id: true, quantity: true } } } })
          if (!product) throw new Error('PRODUCT_NOT_FOUND')

          if (product.sizeStocks.length > 0) {
            const result = await transaction.productSizeStock.updateMany({ where: { id: product.sizeStocks[0].id, quantity: { gte: item.quantity } }, data: { quantity: { decrement: item.quantity } } })
            if (result.count !== 1) throw new Error('INSUFFICIENT_STOCK')
            const aggregateResult = await transaction.product.updateMany({ where: { id: item.productId, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } })
            if (aggregateResult.count !== 1) throw new Error('INSUFFICIENT_STOCK')
            await transaction.inventoryAdjustment.create({ data: { productId: item.productId, color: item.color, size: item.size, quantityChange: -item.quantity, quantityAfter: product.sizeStocks[0].quantity - item.quantity, reason: 'Order fulfilled', actorEmail: admin?.email ?? null } })
          } else {
            const result = await transaction.product.updateMany({ where: { id: item.productId, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } })
            if (result.count !== 1) throw new Error('INSUFFICIENT_STOCK')
            const after = product.stock - item.quantity
            await transaction.inventoryAdjustment.create({ data: { productId: item.productId, color: item.color, size: item.size, quantityChange: -item.quantity, quantityAfter: after, reason: 'Order fulfilled', actorEmail: admin?.email ?? null } })
          }
        }
        await transaction.order.update({ where: { id: order.id }, data: { status: nextStatus, inventoryDecremented: true } })
      } else {
        await transaction.order.update({ where: { id: order.id }, data: { status: nextStatus } })
      }
    })
    return Response.json({ success: true })
  } catch (error) {
    console.error('Unable to update order status', error)
    if (error instanceof Error && error.message === 'ORDER_NOT_FOUND') return Response.json({ error: 'Order not found.' }, { status: 404 })
    if (error instanceof Error && error.message === 'INSUFFICIENT_STOCK') return Response.json({ error: 'There is not enough stock to move this order out of pending.' }, { status: 409 })
    return Response.json({ error: 'Unable to update order status.' }, { status: 500 })
  }
}
