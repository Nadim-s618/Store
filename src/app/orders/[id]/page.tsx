import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { orderNumber } from '@/lib/order'
import { prisma } from '@/lib/prisma'
import styles from './order-detail.module.css'

function formatDate(value: Date) { return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Dhaka' }).format(value) }

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user?.email) redirect('/login?message=Please log in to view your order.')
  const { id } = await params
  const customer = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() }, select: { id: true } })
  if (!customer) notFound()
  const order = await prisma.order.findFirst({ where: { id, userId: customer.id }, include: { items: { include: { product: { select: { name: true, slug: true, imageUrl: true } } } } } })
  if (!order) notFound()
  const subtotal = order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
  const shipping = Math.max(0, Number(order.total) - subtotal)

  return <main className={styles.page}><header className={styles.heading}><Link href="/orders" className={styles.backLink}>← All orders</Link><p className={styles.kicker}>Order received · {formatDate(order.createdAt)}</p><h1>{orderNumber(order.id)}</h1><div className={styles.headingMeta}><span className={`${styles.status} ${styles[order.status.toLowerCase()]}`}>{order.status}</span>{order.trackingCode && <span>Tracking · {order.trackingCode}</span>}</div></header><div className={styles.layout}><section className={styles.panel}><p className={styles.sectionLabel}>Items</p>{order.items.map((item) => <article className={styles.item} key={item.id}><div className={styles.imageFrame}>{item.product.imageUrl ? <img src={item.product.imageUrl} alt="" /> : <span>—</span>}</div><div><Link href={`/product/${item.product.slug}`} className={styles.productName}>{item.product.name}</Link><p>{item.color} / {item.size} · Qty {item.quantity}</p></div><strong>${(Number(item.price) * item.quantity).toFixed(2)}</strong></article>)}</section><aside className={styles.side}><section className={styles.panel}><p className={styles.sectionLabel}>Delivery</p><p className={styles.address}>{order.customerName}<br />{order.address}<br />{[order.city, order.postcode, order.country].filter(Boolean).join(', ')}</p><p className={styles.muted}>{order.customerEmail}</p></section><section className={styles.panel}><p className={styles.sectionLabel}>Summary</p><div className={styles.row}><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div><div className={styles.row}><span>Shipping</span><strong>{shipping === 0 ? 'Complimentary' : `$${shipping.toFixed(2)}`}</strong></div><div className={styles.total}><span>Total</span><strong>${Number(order.total).toFixed(2)}</strong></div><p className={styles.payment}>Payment · {order.paymentMethod === 'COD' ? 'Cash on delivery' : order.paymentMethod}</p></section><a href={`/api/orders/${order.id}/receipt`} className={styles.invoiceButton}>Download invoice <span aria-hidden="true">↓</span></a></aside></div></main>
}
