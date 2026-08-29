import { prisma } from '@/lib/prisma'

export async function getWishlistProductIds(email?: string | null) {
  if (!email) return []

  const customer = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  })

  if (!customer) return []

  const entries = await prisma.wishlist.findMany({
    where: { userId: customer.id },
    select: { productId: true },
  })

  return entries.map((entry) => entry.productId)
}
