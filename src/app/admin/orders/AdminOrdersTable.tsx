'use client'

import { Fragment, useMemo, useState } from 'react'
import styles from '../admin.module.css'

type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
type Order = {
  id: string
  customerName: string
  customerEmail: string
  status: OrderStatus
  createdAt: string
  total: number
  phone: string | null
  address: string | null
  city: string | null
  postcode: string | null
  country: string | null
  paymentMethod: string
  items: { name: string; quantity: number; price: number; color: string; size: string }[]
}
const statuses: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Dhaka',
  }).format(new Date(value)).replace(',', ' ·')
}

export default function AdminOrdersTable({ orders: initialOrders }: { orders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL')
  const [sortBy, setSortBy] = useState('newest')

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesSearch = !query || [order.customerName, order.customerEmail, order.id].some((value) => value.toLowerCase().includes(query))
      return matchesSearch && (statusFilter === 'ALL' || order.status === statusFilter)
    }).sort((first, second) => {
      if (sortBy === 'oldest') return first.createdAt.localeCompare(second.createdAt)
      if (sortBy === 'highest') return second.total - first.total
      if (sortBy === 'lowest') return first.total - second.total
      if (sortBy === 'customer') return first.customerName.localeCompare(second.customerName)
      return second.createdAt.localeCompare(first.createdAt)
    })
  }, [orders, search, sortBy, statusFilter])

  async function changeStatus(orderId: string, status: OrderStatus) {
    setSavingId(orderId)
    setError('')
    try {
      const response = await fetch('/api/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, status }) })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error || 'Unable to update order status.')
      setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status } : order))
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Unable to update order status.')
    } finally {
      setSavingId(null)
    }
  }

  return <>
    {error && <p className={styles.formError} role="alert">{error}</p>}
    <div className={styles.orderToolbar}>
      <label>Search orders<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, or order ID" /></label>
      <label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'ALL' | OrderStatus)}><option value="ALL">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
      <label>Sort by<select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="highest">Highest total</option><option value="lowest">Lowest total</option><option value="customer">Customer name</option></select></label>
    </div>
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <thead><tr><th>Customer</th><th>Status</th><th>Placed</th><th>Total</th><th>Details</th></tr></thead>
        <tbody>{visibleOrders.length === 0 ? <tr><td colSpan={5} className={styles.empty}>No matching orders.</td></tr> : visibleOrders.map((order) => <Fragment key={order.id}>
          <tr key={order.id}>
            <td><strong>{order.customerName}</strong><br /><span className={styles.muted}>{order.customerEmail}</span></td>
            <td><select className={styles.statusSelect} value={order.status} disabled={savingId === order.id} onChange={(event) => changeStatus(order.id, event.target.value as OrderStatus)}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></td>
            <td>{formatOrderDate(order.createdAt)}</td>
            <td>${order.total.toFixed(2)}</td>
            <td><button type="button" className={styles.editButton} onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>{expandedId === order.id ? 'Hide' : 'View'}</button></td>
          </tr>
          {expandedId === order.id && <tr key={`${order.id}-details`}><td colSpan={5}><div className={styles.orderDetails}>
            <div><p className={styles.detailLabel}>Customer</p><p>{order.customerName}<br />{order.customerEmail}{order.phone && <><br />{order.phone}</>}</p></div>
            <div><p className={styles.detailLabel}>Delivery</p><p>{order.address || 'Address not recorded'}<br />{[order.city, order.postcode, order.country].filter(Boolean).join(', ')}</p></div>
            <div><p className={styles.detailLabel}>Payment</p><p>{order.paymentMethod === 'COD' ? 'Cash on delivery' : order.paymentMethod}</p></div>
            <div><p className={styles.detailLabel}>Items</p><p>{order.items.map((item) => <span className={styles.detailItem} key={`${order.id}-${item.name}-${item.color}-${item.size}`}>{item.name} · {item.color} / {item.size} × {item.quantity} · ${item.price.toFixed(2)}<br /></span>)}</p></div>
          </div></td></tr>}
        </Fragment>)}</tbody>
      </table>
    </div>
  </>
}
