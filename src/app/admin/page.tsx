import Link from 'next/link'

import { prisma } from '@/lib/prisma'
import styles from './admin.module.css'

export default async function AdminPage() {
  const [productCount, notDeliveredOrderCount, notDeliveredProductCount, deliveredOrderCount, deliveredProductCount, revenue, recentOrders, lowStock] = await Promise.all([
    prisma.product.count(),
    prisma.order.count({ where: { status: { notIn: ['DELIVERED', 'CANCELLED'] } } }),
    prisma.orderItem.aggregate({ where: { order: { status: { notIn: ['DELIVERED', 'CANCELLED'] } } }, _sum: { quantity: true } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.orderItem.aggregate({ where: { order: { status: 'DELIVERED' } }, _sum: { quantity: true } }),
    prisma.order.aggregate({ where: { status: 'DELIVERED' }, _sum: { total: true } }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { user: true } }),
    prisma.productSizeStock.findMany({ where: { quantity: { lte: 5 } }, orderBy: { quantity: 'asc' }, take: 12, include: { product: { select: { name: true } } } }),
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
        <div className={styles.stat}><p className={styles.statLabel}>Orders</p><p className={styles.statValue}>{notDeliveredOrderCount}</p><p className={styles.statHint}>{notDeliveredProductCount._sum.quantity ?? 0} products</p></div>
        <div className={styles.stat}><p className={styles.statLabel}>Fulfilled</p><p className={styles.statValue}>{deliveredOrderCount}</p><p className={styles.statHint}>{deliveredProductCount._sum.quantity ?? 0} products</p></div>
        <div className={styles.stat}><p className={styles.statLabel}>Revenue</p><p className={styles.statValue}>${Number(revenue._sum.total ?? 0).toFixed(2)}</p></div>
      </section>
      <section className={styles.panel}><div className={styles.panelHeader}><h2>Low stock alerts</h2><Link href="/admin/products">Manage inventory</Link></div>{lowStock.length === 0 ? <p className={styles.empty}>All variants have more than five items available.</p> : <table className={styles.table}><thead><tr><th>Product</th><th>Variant</th><th>Remaining</th></tr></thead><tbody>{lowStock.map((item) => <tr key={item.id}><td>{item.product.name}</td><td className={styles.muted}>{item.color} / {item.size}</td><td className={item.quantity === 0 ? styles.lowStockCritical : styles.lowStockWarning}>{item.quantity === 0 ? 'Sold out' : `${item.quantity} left`}</td></tr>)}</tbody></table>}</section>
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
