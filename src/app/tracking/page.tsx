'use client'

import { FormEvent, useState } from 'react'
import styles from './tracking.module.css'

type TrackingResult = { trackingCode: string; status: string; createdAt: string; updatedAt: string }

export default function TrackingPage() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function trackOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const response = await fetch(`/api/orders?trackingCode=${encodeURIComponent(code.trim())}`)
      const data = await response.json() as TrackingResult & { error?: string }
      if (!response.ok) throw new Error(data.error || 'Tracking code not found.')
      setResult(data)
    } catch (trackingError) {
      setError(trackingError instanceof Error ? trackingError.message : 'Unable to find this order.')
    } finally {
      setLoading(false)
    }
  }

  return <main className={styles.page}>
    <section className={styles.hero}>
      <p className={styles.kicker}>Delivery, considered</p>
      <h1>Track your order.</h1>
      <p>Enter the tracking code from your receipt to see the latest delivery status.</p>
      <form className={styles.form} onSubmit={trackOrder}>
        <label><span className={styles.srOnly}>Tracking code</span><input value={code} onChange={(event) => setCode(event.target.value)} required placeholder="NEMO-TRK-XXXXXXXXXX" /></label>
        <button type="submit" disabled={loading}>{loading ? 'Checking…' : 'Track order'} <span aria-hidden="true">↗</span></button>
      </form>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </section>
    {result && <section className={styles.result}>
      <div><p className={styles.kicker}>Tracking code</p><h2>{result.trackingCode}</h2></div>
      <div className={styles.status}><span>Status</span><strong>{result.status}</strong></div>
      <p className={styles.resultNote}>Your order is being prepared for delivery. We’ll keep this status updated.</p>
    </section>}
  </main>
}
