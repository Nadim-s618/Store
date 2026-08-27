import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import WishlistGrid from './WishlistGrid'
import styles from './wishlist.module.css'

export default async function WishlistPage() {
  const user = await getCurrentUser()
  if (!user?.email) redirect('/login?message=Please log in to view your favorites.')
  const customer = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() }, select: { id: true } })
  const entries = customer ? await prisma.wishlist.findMany({ where: { userId: customer.id }, orderBy: { createdAt: 'desc' }, include: { product: { include: { sizeStocks: true } } } }) : []
  const products = entries.map(({ product }) => ({ ...product, price: Number(product.price) }))

  return <main className={styles.page}><header className={styles.heading}><Link href="/account" className={styles.backLink}>← Your account</Link><p className={styles.kicker}>Your edit</p><h1>Favorites.</h1><p>Pieces you’re considering, ready when you are.</p></header>{products.length === 0 ? <section className={styles.emptyState}><p className={styles.kicker}>Nothing saved yet</p><h2>Keep a few close.</h2><p>Tap the heart on any piece to save it here for later.</p><Link href="/shop" className={styles.primaryButton}>Browse the collection <span aria-hidden="true">↗</span></Link></section> : <WishlistGrid products={products} />}</main>
}
