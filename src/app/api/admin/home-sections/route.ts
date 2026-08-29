import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidateTag } from 'next/cache'

export async function PATCH(request: Request) {
  try {
    await requireAdmin()
  } catch {
    return Response.json({ error: 'Admin access is required.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const productId = typeof body?.productId === 'string' ? body.productId : ''
  if (!productId) return Response.json({ error: 'Product ID is required.' }, { status: 400 })

  const topCollectionOrder = Number(body?.topCollectionOrder)
  const newArrivalOrder = Number(body?.newArrivalOrder)
  if (!Number.isInteger(topCollectionOrder) || topCollectionOrder < 0 || !Number.isInteger(newArrivalOrder) || newArrivalOrder < 0) {
    return Response.json({ error: 'Section order must be a whole number of 0 or higher.' }, { status: 400 })
  }

  try {
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        isTopCollection: body?.isTopCollection === true,
        topCollectionOrder,
        isNewArrival: body?.isNewArrival === true,
        newArrivalOrder,
      },
    })
    revalidateTag('homepage-products', 'max')
    return Response.json({ id: product.id })
  } catch {
    return Response.json({ error: 'Product could not be updated.' }, { status: 404 })
  }
}
