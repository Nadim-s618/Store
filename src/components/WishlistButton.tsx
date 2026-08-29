'use client'

import { useState } from 'react'
import styles from './WishlistButton.module.css'

export default function WishlistButton({ productId, label = false, initialSaved = false, onChange }: { productId: string; label?: boolean; initialSaved?: boolean; onChange?: (saved: boolean) => void }) {
  const [saved, setSaved] = useState(initialSaved)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function toggle() {
    setBusy(true); setMessage('')
    try {
      const response = await fetch('/api/wishlist', { method: saved ? 'DELETE' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId }) })
      const result = await response.json() as { saved?: boolean; error?: string }
      if (!response.ok) throw new Error(result.error || 'Unable to update favorites.')
      setSaved(Boolean(result.saved)); onChange?.(Boolean(result.saved)); setMessage(result.saved ? 'Saved to favorites' : 'Removed from favorites'); window.setTimeout(() => setMessage(''), 1800)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to update favorites.') } finally { setBusy(false) }
  }

  return <span className={styles.wrap}><button type="button" className={`${styles.button} ${saved ? styles.saved : ''}`} onClick={toggle} disabled={busy} aria-label={saved ? 'Remove from favorites' : 'Save to favorites'} aria-pressed={saved}>{saved ? '♥' : '♡'}{label && <span>{saved ? 'Saved' : 'Save for later'}</span>}</button>{message && <span className={styles.message} role="status">{message}</span>}</span>
}
