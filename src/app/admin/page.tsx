import Link from 'next/link'

import { prisma } from '@/lib/prisma'
import styles from './admin.module.css'

export default async function AdminPage() {
  const [productCount, orderCount, revenue, recentOrders] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { user: true } }),
  ])

  return (
    <>
      <header className={styles.heading}>
        <p className={styles.kicker}>Store control</p>
        <h1>Good morning.</h1>
        <p>A clear view of what is happening across NEMO today.</p>
      </header>
      <section className={styles.stats}>
        <div className={styles.stat}><p className={styles.statLabel}>Products</p><p className={styles.statValue}>{productCount}</p></div>
        <div className={styles.stat}><p className={styles.statLabel}>Orders</p><p className={styles.statValue}>{orderCount}</p></div>
        <div className={styles.stat}><p className={styles.statLabel}>Revenue</p><p className={styles.statValue}>${Number(revenue._sum.total ?? 0).toFixed(2)}</p></div>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHeader}><h2>Recent orders</h2><Link href="/admin/orders">View all</Link></div>
        {recentOrders.length === 0 ? <p className={styles.empty}>No orders yet.</p> : (
          <table className={styles.table}><thead><tr><th>Customer</th><th>Status</th><th>Total</th></tr></thead><tbody>
            {recentOrders.map((order) => <tr key={order.id}><td>{order.user.name || order.user.email}</td><td className={styles.muted}>{order.status}</td><td>${Number(order.total).toFixed(2)}</td></tr>)}
          </tbody></table>
        )}
      </section>
    </>
  )
}
