'use client'

import { useState } from 'react'

import styles from '../admin.module.css'

type ProductCuration = {
  id: string
  name: string
  categoryName: string
  stock: number
  price: number
  isTopCollection: boolean
  topCollectionOrder: number
  isNewArrival: boolean
  newArrivalOrder: number
}

export default function AdminProductCuration({ products }: { products: ProductCuration[] }) {
  const [items, setItems] = useState(products)
  const [savingId, setSavingId] = useState('')
  const [message, setMessage] = useState('')

  function updateItem(id: string, field: keyof ProductCuration, value: boolean | number) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item))
  }

  async function saveItem(item: ProductCuration) {
    setSavingId(item.id)
    setMessage('')
    const response = await fetch('/api/admin/home-sections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: item.id,
        isTopCollection: item.isTopCollection,
        topCollectionOrder: item.topCollectionOrder,
        isNewArrival: item.isNewArrival,
        newArrivalOrder: item.newArrivalOrder,
      }),
    })
    const result = await response.json().catch(() => null) as { error?: string } | null
    setMessage(response.ok ? 'Homepage sections updated.' : result?.error || 'Unable to update homepage sections.')
    setSavingId('')
  }

  if (items.length === 0) return <p className={styles.empty}>No products have been added yet.</p>

  return (
    <>
      <p className={styles.curationHint}>Choose where each product appears on the homepage. Lower order numbers appear first.</p>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead><tr><th>Product</th><th>Stock</th><th>Top collection</th><th>New arrivals</th><th /></tr></thead>
          <tbody>
            {items.map((item) => <tr key={item.id}>
              <td><strong>{item.name}</strong><br /><span className={styles.muted}>{item.categoryName} · ${item.price.toFixed(2)}</span></td>
              <td>{item.stock}</td>
              <td><label className={styles.curationControl}><input type="checkbox" checked={item.isTopCollection} onChange={(event) => updateItem(item.id, 'isTopCollection', event.target.checked)} /><span>Show</span></label><input className={styles.orderInput} type="number" min="0" aria-label={`${item.name} top collection order`} value={item.topCollectionOrder} onChange={(event) => updateItem(item.id, 'topCollectionOrder', Number(event.target.value))} /></td>
              <td><label className={styles.curationControl}><input type="checkbox" checked={item.isNewArrival} onChange={(event) => updateItem(item.id, 'isNewArrival', event.target.checked)} /><span>Show</span></label><input className={styles.orderInput} type="number" min="0" aria-label={`${item.name} new arrivals order`} value={item.newArrivalOrder} onChange={(event) => updateItem(item.id, 'newArrivalOrder', Number(event.target.value))} /></td>
              <td><button type="button" className={styles.saveButton} onClick={() => saveItem(item)} disabled={savingId === item.id}>{savingId === item.id ? 'Saving…' : 'Save'}</button></td>
            </tr>)}
          </tbody>
        </table>
      </div>
      {message && <p className={styles.curationMessage} role="status">{message}</p>}
    </>
  )
}
