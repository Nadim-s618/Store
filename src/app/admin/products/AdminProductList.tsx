'use client'

import { useState } from 'react'

import styles from '../admin.module.css'

type Product = {
  id: string
  name: string
  categoryName: string
  description: string
  price: number
  stock: number
  isTopCollection: boolean
  topCollectionOrder: number
  isNewArrival: boolean
  newArrivalOrder: number
}

export default function AdminProductList({ products }: { products: Product[] }) {
  const [items, setItems] = useState(products)
  const [editingId, setEditingId] = useState('')
  const [draft, setDraft] = useState<Product | null>(null)
  const [busyId, setBusyId] = useState('')
  const [message, setMessage] = useState('')

  function startEditing(item: Product) {
    setEditingId(item.id)
    setDraft({ ...item })
    setMessage('')
  }

  function updateDraft(field: keyof Product, value: string | number | boolean) {
    setDraft((current) => current ? { ...current, [field]: value } : current)
  }

  async function saveDraft() {
    if (!draft) return
    setBusyId(draft.id)
    const response = await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    })
    const result = await response.json().catch(() => null) as { error?: string } | null
    if (!response.ok) {
      setMessage(result?.error || 'Product could not be updated.')
    } else {
      setItems((current) => current.map((item) => item.id === draft.id ? draft : item))
      setEditingId('')
      setDraft(null)
      setMessage('Product updated successfully.')
    }
    setBusyId('')
  }

  async function deleteProduct(item: Product) {
    if (!window.confirm(`Delete “${item.name}”? This cannot be undone.`)) return
    setBusyId(item.id)
    const response = await fetch('/api/admin/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: item.id }),
    })
    const result = await response.json().catch(() => null) as { error?: string } | null
    if (!response.ok) setMessage(result?.error || 'Product could not be deleted.')
    else { setItems((current) => current.filter((product) => product.id !== item.id)); setMessage('Product deleted successfully.') }
    setBusyId('')
  }

  if (items.length === 0) return <p className={styles.empty}>No products have been added yet.</p>

  return (
    <>
      <div className={styles.tableScroll}>
        <table className={styles.table}><thead><tr><th>Name</th><th>Category</th><th>Stock</th><th>Price</th><th>Actions</th></tr></thead><tbody>
          {items.map((item) => editingId === item.id && draft ? <tr key={item.id}>
            <td><input className={styles.inlineInput} value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} /></td>
            <td><input className={styles.inlineInput} value={draft.categoryName} onChange={(event) => updateDraft('categoryName', event.target.value)} /></td>
            <td><input className={styles.inlineNumber} type="number" min="0" value={draft.stock} onChange={(event) => updateDraft('stock', Number(event.target.value))} /></td>
            <td><input className={styles.inlineNumber} type="number" min="0" step=".01" value={draft.price} onChange={(event) => updateDraft('price', Number(event.target.value))} /></td>
            <td><button type="button" className={styles.saveButton} onClick={saveDraft} disabled={busyId === item.id}>Save</button><button type="button" className={styles.cancelButton} onClick={() => { setEditingId(''); setDraft(null) }}>Cancel</button></td>
          </tr> : <tr key={item.id}>
            <td><strong>{item.name}</strong></td><td className={styles.muted}>{item.categoryName}</td><td>{item.stock}</td><td>${item.price.toFixed(2)}</td>
            <td><button type="button" className={styles.editButton} onClick={() => startEditing(item)}>Edit</button><button type="button" className={styles.deleteButton} onClick={() => deleteProduct(item)} disabled={busyId === item.id}>{busyId === item.id ? 'Deleting…' : 'Delete'}</button></td>
          </tr>)}
        </tbody></table>
      </div>
      {message && <p className={styles.curationMessage} role="status">{message}</p>}
    </>
  )
}
