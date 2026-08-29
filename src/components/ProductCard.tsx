'use client'

import Link from 'next/link'
import { useState } from 'react'
import styles from './ProductCard.module.css'
import WishlistButton from './WishlistButton'

type ProductVariant = { color: string; size: string; quantity: number }

type ProductCardProps = {
  slug: string
  name: string
  price: number
  imageUrl?: string
  stock?: number
  showAvailability?: boolean
  productId: string
  variants?: ProductVariant[]
  initialWishlistSaved?: boolean
  onWishlistChange?: (saved: boolean) => void
}

export default function ProductCard({ slug, name, price, imageUrl, stock, showAvailability = true, productId, variants = [], initialWishlistSaved = false, onWishlistChange }: ProductCardProps) {
  const [added, setAdded] = useState(false)
  const availableVariant = variants.find((variant) => variant.quantity > 0)
  const canAdd = Boolean(availableVariant || (variants.length === 0 && (stock ?? 0) > 0))

  function addToCart() {
    if (!canAdd) return
    const variant = availableVariant || { color: 'Default', size: 'S' }
    const itemId = `${productId}:${variant.color}:${variant.size}`
    const stored = window.localStorage.getItem('clothing-store-cart')
    const cart = stored ? JSON.parse(stored) as { id: string; productId?: string; name: string; price: number; imageUrl?: string; color: string; size: string; quantity: number }[] : []
    const existing = cart.find((item) => item.id === itemId)
    if (existing) existing.quantity += 1
    else cart.push({ id: itemId, productId, name, price, imageUrl, color: variant.color, size: variant.size, quantity: 1 })
    window.localStorage.setItem('clothing-store-cart', JSON.stringify(cart))
    window.dispatchEvent(new CustomEvent('cart-updated'))
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1400)
  }

  return <article className={styles.card}>
    <Link href={`/product/${slug}`} className={styles.link}>
      <div className={styles.imageBox}>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className={styles.image} />
        )}
      </div>
    </Link>
    <div className={styles.favorite}><WishlistButton productId={productId} initialSaved={initialWishlistSaved} onChange={onWishlistChange} /></div>
    <div className={styles.infoRow}>
      <Link href={`/product/${slug}`} className={styles.productInfo}><h3 className={styles.name}>{name}</h3><p className={styles.price}>${price.toFixed(2)}</p></Link>
      {showAvailability && <div className={styles.availabilityColumn}>
        {typeof stock === 'number' && <p className={`${styles.availability} ${stock === 0 ? styles.outOfStock : ''}`}>{stock === 0 ? 'Out of stock' : `${stock} ${stock === 1 ? 'item' : 'items'} left`}</p>}
        <button type="button" className={styles.cartLink} disabled={!canAdd} onClick={addToCart} aria-label={canAdd ? `Add ${name} to cart` : `${name} is out of stock`} title={canAdd ? 'Add to cart' : 'Out of stock'}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8.5V7a5 5 0 0 1 10 0v1.5" /><path d="M5.5 8.5h13l-1 11.5a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 0 1-1.5-1.5z" /></svg>
          {added && <span className={styles.addedLabel}>✓</span>}
        </button>
        <span className={`${styles.addedMessage} ${added ? styles.addedMessageVisible : ''}`} role="status" aria-live="polite">{added ? 'Added to cart' : ''}</span>
      </div>}
    </div>
  </article>
}
