'use client'
import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import styles from './tracking.module.css'

type TrackingResult = { trackingCode: string; status: string; createdAt: string; updatedAt: string }

const ROUTE_STEPS = ['Ordered', 'Packed', 'In transit', 'Delivered']

// One glyph per waypoint, drawn to match — a receipt, a sealed box, a wake, a flag.
// currentColor-driven so state (done / current / upcoming) is handled entirely by CSS.
const ROUTE_ICONS: Record<string, ReactNode> = {
  Ordered: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 3h12l-1 15.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.5L6 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 7V6a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 11h6M9 14.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Packed: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M4 8.5 12 13l8-4.5M12 13v7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  'In transit': (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 16V7.5A1.5 1.5 0 0 1 4.5 6H14v10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M14 9.5h3.6a1 1 0 0 1 .82.43L20.5 13V16H14" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="7.5" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16.5" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 10.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Delivered: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 3v18l6-4 6 4V3H6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9.5 10.5 11.5 12.5 15 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

// Maps a free-text status from the API onto the fixed waypoint sequence.
// Falls back to the first step so an unrecognized status still renders a sane route.
function routeIndexForStatus(status: string) {
  const normalized = status.trim().toLowerCase()
  const index = ROUTE_STEPS.findIndex((step) => step.toLowerCase() === normalized)
  if (index !== -1) return index
  if (/deliver/.test(normalized)) return 3
  if (/transit|shipped|out for/.test(normalized)) return 2
  if (/pack/.test(normalized)) return 1
  return 0
}

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

  const activeStep = result ? routeIndexForStatus(result.status) : 0
  const fillPercent = activeStep === 0 ? 0 : (activeStep / (ROUTE_STEPS.length - 1)) * 100

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.kicker}>Delivery, considered</p>
        <h1>Track your order.</h1>
        <p>Enter the tracking code from your receipt to see the latest delivery status.</p>
        <form className={styles.form} onSubmit={trackOrder}>
          <label>
            <span className={styles.srOnly}>Tracking code</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
              placeholder="NEMO-TRK-XXXXXXXXXX"
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Checking…' : 'Track order'} <span aria-hidden="true">↗</span>
          </button>
        </form>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </section>

      {result && (
        <section className={styles.result}>
          <p className={styles.kicker}>Tracking code</p>
          <h2>{result.trackingCode}</h2>

          <div className={styles.status}>
            <span>Status</span>
            <strong>{result.status}</strong>
          </div>

          <div className={styles.route} aria-hidden="true">
            <div className={styles.routeTrack}>
              <div className={styles.routeFill} style={{ width: `${fillPercent}%` }} />
            </div>
            <div className={styles.routeSteps}>
              {ROUTE_STEPS.map((step, index) => (
                <div
                  key={step}
                  className={[
                    styles.routeStep,
                    index < activeStep ? styles.done : '',
                    index === activeStep ? styles.current : '',
                  ].filter(Boolean).join(' ')}
                >
                  <div className={styles.routeIcon}>{ROUTE_ICONS[step]}</div>
                  <span className={styles.srOnly}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <p className={styles.resultNote}>
            Your order is being prepared for delivery. We&rsquo;ll keep this status updated.
          </p>
        </section>
      )}
    </main>
  )
}
