'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import styles from './Navbar.module.css'

const storageKey = 'clothing-store-cart'

function CartIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}><path d="M7 8.5V7a5 5 0 0 1 10 0v1.5" /><path d="M5.5 8.5h13l-1 11.5a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 0 1-1.5-1.5z" /></svg>
}

function readCartCount() {
  try {
    const stored = window.localStorage.getItem(storageKey)
    const items = stored ? JSON.parse(stored) as { quantity?: number }[] : []
    return items.reduce((count, item) => count + Math.max(0, Number(item.quantity) || 0), 0)
  } catch {
    return 0
  }
}

export default function CartButton() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const refreshCount = () => setCount(readCartCount())
    refreshCount()
    window.addEventListener('storage', refreshCount)
    window.addEventListener('cart-updated', refreshCount)
    return () => {
      window.removeEventListener('storage', refreshCount)
      window.removeEventListener('cart-updated', refreshCount)
    }
  }, [])

  return <Link href="/cart" className={`${styles.iconButton} ${styles.cartButton}`} aria-label={`Cart${count > 0 ? `, ${count} ${count === 1 ? 'item' : 'items'}` : ''}`}>
    <CartIcon />
    {count > 0 && <span className={styles.cartBadge}>{count > 99 ? '99+' : count}</span>}
  </Link>
}
