import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { orderNumber } from '@/lib/order'
import { prisma } from '@/lib/prisma'
import styles from './orders.module.css'

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' }).format(value)
}

export default async function OrdersPage() {
  const user = await getCurrentUser()
  if (!user?.email) redirect('/login?message=Please log in to view your orders.')
  const customer = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() }, include: { orders: { orderBy: { createdAt: 'desc' }, include: { items: { select: { quantity: true } } } } } })
  const orders = customer?.orders ?? []

  return <main className={styles.page}>
    <header className={styles.heading}><Link href="/account" className={styles.backLink}>← Your account</Link><p className={styles.kicker}>Your account</p><h1>Orders.</h1><p>Every piece you’ve chosen, kept in one place.</p></header>
    {orders.length === 0 ? <section className={styles.emptyState}><p className={styles.kicker}>Nothing here yet</p><h2>Your order history is waiting.</h2><p>Once you place an order, its details and invoice will appear here.</p><Link href="/shop" className={styles.primaryButton}>Browse the collection <span aria-hidden="true">↗</span></Link></section> : <section className={styles.orderList} aria-label="Order history">{orders.map((order) => { const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0); return <Link href={`/orders/${order.id}`} className={styles.orderCard} key={order.id}><div><p className={styles.orderNumber}>{orderNumber(order.id)}</p><p className={styles.date}>{formatDate(order.createdAt)} · {itemCount} {itemCount === 1 ? 'item' : 'items'}</p></div><div className={styles.orderMeta}><span className={`${styles.status} ${styles[order.status.toLowerCase()]}`}>{order.status}</span><strong>${Number(order.total).toFixed(2)}</strong><span className={styles.arrow} aria-hidden="true">↗</span></div></Link> })}</section>}
  </main>
}
