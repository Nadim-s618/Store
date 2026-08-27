'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import styles from './cart.module.css'

type Variant = { color: string; size: string; quantity: number }
type CartItem = { id: string; productId?: string; name: string; price: number; imageUrl?: string; color: string; size: string; quantity: number; availableColors?: string[]; variants?: Variant[] }
type CartEdit = { color: string; size: string; quantity: number }
const storageKey = 'clothing-store-cart'
const fallbackSizes = ['S', 'M', 'L', 'XL', 'XXL']

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [edit, setEdit] = useState<CartEdit>({ color: '', size: 'S', quantity: 1 })

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey)
    if (!stored) return
    const frame = window.requestAnimationFrame(() => setItems(JSON.parse(stored)))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  function updateQuantity(id: string, quantity: number) {
    const next = quantity > 0 ? items.map((item) => item.id === id ? { ...item, quantity } : item) : items.filter((item) => item.id !== id)
    setItems(next)
    window.localStorage.setItem(storageKey, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent('cart-updated'))
  }

  function startEditing(item: CartItem) {
    setEditingId(item.id)
    setEdit({ color: item.color, size: item.size, quantity: item.quantity })
  }

  function availableColors(item: CartItem) {
    return item.availableColors?.length ? item.availableColors : item.variants?.length ? [...new Set(item.variants.map((variant) => variant.color))] : [item.color]
  }

  function availableSizes(item: CartItem, color: string) {
    const sizes = item.variants?.filter((variant) => variant.color === color && variant.quantity > 0).map((variant) => variant.size)
    return sizes?.length ? sizes : item.variants?.length ? [] : fallbackSizes
  }

  function saveEdit(item: CartItem) {
    const color = edit.color.trim() || item.color
    const size = edit.size || item.size
    const quantity = Math.max(1, Math.floor(edit.quantity) || 1)
    const nextId = `${item.productId ?? item.id.split(':')[0]}:${color}:${size}`
    const duplicate = items.find((candidate) => candidate.id === nextId && candidate.id !== item.id)
    const next = duplicate
      ? items.filter((candidate) => candidate.id !== item.id).map((candidate) => candidate.id === duplicate.id ? { ...candidate, quantity: candidate.quantity + quantity } : candidate)
      : items.map((candidate) => candidate.id === item.id ? { ...candidate, id: nextId, color, size, quantity } : candidate)
    setItems(next)
    window.localStorage.setItem(storageKey, JSON.stringify(next))
    setEditingId(null)
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <p className={styles.kicker}>Your selections</p>
        <h1>Your cart</h1>
        <p className={styles.itemCount}>{items.length === 0 ? 'Nothing here yet' : `${items.length} ${items.length === 1 ? 'item' : 'items'}`}</p>
      </header>

      {items.length === 0 ? (
        <section className={styles.emptyState}>
          <div className={styles.emptyMark} aria-hidden="true">+</div>
          <p className={styles.kicker}>A considered wardrobe starts here</p>
          <h2>Your cart is waiting.</h2>
          <p>Explore the collection and find something made to stay in rotation.</p>
          <Link href="/shop" className={styles.primaryButton}>Continue shopping <span aria-hidden="true">↗</span></Link>
        </section>
      ) : (
        <div className={styles.cartLayout}>
          <section className={styles.itemsPanel} aria-label="Cart items">
            <div className={styles.panelLabel}><span>Product</span><span>Total</span></div>
            <div className={styles.itemList}>
              {items.map((item) => (
                <article key={item.id} className={styles.item}>
                  <div className={styles.imageFrame}>
                    {item.imageUrl ? <img src={item.imageUrl} alt="" className={styles.image} /> : <span className={styles.imageFallback}>No image</span>}
                  </div>
                  <div className={styles.itemDetails}>
                    <div>
                      <h2>{item.name}</h2>
                      <p className={styles.variant}>{item.color} <span>/</span> {item.size}</p>
                    </div>
                    <div className={styles.itemActions}>
                      <button type="button" className={styles.editButton} onClick={() => editingId === item.id ? setEditingId(null) : startEditing(item)}>{editingId === item.id ? 'Cancel' : 'Edit'}</button>
                      <button type="button" className={styles.removeButton} onClick={() => updateQuantity(item.id, 0)}>Remove</button>
                    </div>
                  </div>
                  <div className={styles.itemPurchase}>
                    <p className={styles.price}>${item.price.toFixed(2)}</p>
                    <div className={styles.quantityControl} aria-label={`Quantity for ${item.name}`}>
                      <button type="button" aria-label={`Decrease quantity of ${item.name}`} onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button type="button" aria-label={`Increase quantity of ${item.name}`} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <p className={styles.lineTotal}>${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  {editingId === item.id && <form className={styles.editPanel} onSubmit={(event) => { event.preventDefault(); saveEdit(item) }}>
                    <label>Color<select value={edit.color} onChange={(event) => { const color = event.target.value; const sizes = availableSizes(item, color); setEdit({ ...edit, color, size: sizes.includes(edit.size) ? edit.size : sizes[0] || edit.size }) }}>{availableColors(item).map((color) => <option key={color}>{color}</option>)}</select></label>
                    <label>Size<select value={edit.size} onChange={(event) => setEdit({ ...edit, size: event.target.value })}>{availableSizes(item, edit.color).map((size) => <option key={size}>{size}</option>)}</select></label>
                    <label>Quantity<input type="number" min="1" step="1" value={edit.quantity} onChange={(event) => setEdit({ ...edit, quantity: Number(event.target.value) })} /></label>
                    <button type="submit" className={styles.saveButton}>Save changes <span aria-hidden="true">↗</span></button>
                  </form>}
                </article>
              ))}
            </div>
            <Link href="/shop" className={styles.continueLink}>← Continue shopping</Link>
          </section>

          <aside className={styles.summary}>
            <p className={styles.kicker}>Order summary</p>
            <h2>Almost yours.</h2>
            <div className={styles.summaryRows}>
              <div><span>Subtotal</span><strong>${total.toFixed(2)}</strong></div>
              <div><span>Shipping</span><span className={styles.muted}>Calculated at checkout</span></div>
            </div>
            <div className={styles.totalRow}><span>Total</span><strong>${total.toFixed(2)}</strong></div>
            <Link href="/checkout" className={styles.checkoutButton}>Proceed to checkout <span aria-hidden="true">↗</span></Link>
            <p className={styles.note}>Complimentary shipping on orders over $150.</p>
          </aside>
        </div>
      )}
    </main>
  )
}
