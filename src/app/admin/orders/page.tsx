import { prisma } from '@/lib/prisma'
import styles from '../admin.module.css'
import AdminOrdersTable from './AdminOrdersTable'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, include: { user: true, items: { include: { product: true } } } })

  return (
    <>
      <header className={styles.heading}>
        <p className={styles.kicker}>Fulfillment</p>
        <h1>Orders.</h1>
        <p>Keep track of every customer order from payment to delivery.</p>
      </header>
      <section className={styles.panel}>
        {orders.length === 0 ? <p className={styles.empty}>No orders have been placed yet.</p> : <AdminOrdersTable orders={orders.map((order) => ({
          id: order.id,
          customerName: order.customerName || order.user.name || 'Guest customer',
          customerEmail: order.customerEmail || order.user.email,
          status: order.status,
          createdAt: order.createdAt.toISOString(),
          total: Number(order.total),
          phone: order.phone,
          address: order.address,
          city: order.city,
          postcode: order.postcode,
          country: order.country,
          paymentMethod: order.paymentMethod,
          items: order.items.map((item) => ({ name: item.product.name, quantity: item.quantity, price: Number(item.price), color: item.color, size: item.size })),
        }))} />}
      </section>
    </>
  )
}
