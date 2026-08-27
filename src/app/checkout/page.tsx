'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import styles from './checkout.module.css'

type CartItem = { id: string; name: string; price: number; imageUrl?: string; color: string; size: string; quantity: number }
type DeliveryDetails = { name: string; email: string; phone: string; address: string; city: string; postcode: string; country: string }
const storageKey = 'clothing-store-cart'

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [submitted, setSubmitted] = useState(false)
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({ name: '', email: '', phone: '', address: '', city: '', postcode: '', country: '' })
  const [orderNumber, setOrderNumber] = useState('')
  const [trackingCode, setTrackingCode] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [isPlacing, setIsPlacing] = useState(false)
  const [orderError, setOrderError] = useState('')

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey)
    if (!stored) return
    const frame = window.requestAnimationFrame(() => setItems(JSON.parse(stored)))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal >= 150 || subtotal === 0 ? 0 : 12
  const total = subtotal + shipping

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsPlacing(true)
    setOrderError('')
    const formData = new FormData(event.currentTarget)
    const details = { name: String(formData.get('name') || ''), email: String(formData.get('email') || ''), phone: String(formData.get('phone') || ''), address: String(formData.get('address') || ''), city: String(formData.get('city') || ''), postcode: String(formData.get('postcode') || ''), country: String(formData.get('country') || '') }
    try {
      const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deliveryDetails: details, items, total, paymentMethod }) })
      const result = await response.json() as { orderNumber?: string; trackingCode?: string; error?: string }
      if (!response.ok || !result.orderNumber) throw new Error(result.error || 'Unable to place the order right now.')
      setDeliveryDetails(details)
      setOrderNumber(result.orderNumber)
      setTrackingCode(result.trackingCode || '')
      window.localStorage.removeItem(storageKey)
      setSubmitted(true)
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : 'Unable to place the order right now.')
    } finally {
      setIsPlacing(false)
    }
  }

  async function downloadReceipt() {
    setIsDownloading(true)
    try {
      const response = await fetch('/api/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, trackingCode, deliveryDetails, items, subtotal, shipping, total }),
      })
      if (!response.ok) throw new Error('Receipt download failed')
      const receiptBlob = await response.blob()
      const url = URL.createObjectURL(receiptBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${orderNumber || 'nemo-order'}-receipt.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <Link href="/cart" className={styles.backLink}>← Back to cart</Link>
        <p className={styles.kicker}>Secure checkout</p>
        <h1>Make it yours.</h1>
        <p>Complete your details and we’ll get your order ready.</p>
      </header>

      {submitted ? (
        <section className={styles.confirmation}>
          <div className={styles.confirmationMark} aria-hidden="true">✓</div>
          <p className={styles.kicker}>Order received · {orderNumber}</p>
          <h2>We’re on our way.</h2>
          <p className={styles.confirmationText}>Thank you, {deliveryDetails.name}. Your order will be delivered to the address below.</p>
          <div className={styles.deliveryCard}>
            <div><span>Delivery address</span><strong>{deliveryDetails.address}<br />{deliveryDetails.city}</strong></div>
            <div><span>Payment method</span><strong>Cash on delivery</strong></div>
            <div><span>Estimated delivery</span><strong>3–5 business days</strong></div>
            <div><span>Tracking code</span><strong>{trackingCode}</strong></div>
          </div>
          <button type="button" className={styles.receiptButton} onClick={downloadReceipt} disabled={isDownloading}>{isDownloading ? 'Preparing receipt…' : 'Download receipt'} <span aria-hidden="true">↓</span></button>
          <Link href="/shop" className={styles.primaryButton}>Continue shopping <span aria-hidden="true">↗</span></Link>
        </section>
      ) : items.length === 0 ? (
        <section className={styles.emptyState}>
          <p className={styles.kicker}>Nothing to check out</p>
          <h2>Your cart is empty.</h2>
          <p>Add a few considered pieces before continuing.</p>
          <Link href="/shop" className={styles.primaryButton}>Browse the collection <span aria-hidden="true">↗</span></Link>
        </section>
      ) : (
        <div className={styles.layout}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <section className={styles.formSection}>
              <div className={styles.sectionHeading}><span>01</span><h2>Contact details</h2></div>
              <div className={styles.fieldGrid}>
                <label>Full name<input name="name" required autoComplete="name" placeholder="Your name" /></label>
                <label>Email address<input name="email" type="email" required autoComplete="email" placeholder="you@example.com" /></label>
                <label className={styles.fullWidth}>Phone number <span className={styles.optional}>(optional)</span><input name="phone" type="tel" autoComplete="tel" placeholder="+880 1XXX XXXXXX" /></label>
              </div>
            </section>

            <section className={styles.formSection}>
              <div className={styles.sectionHeading}><span>02</span><h2>Shipping address</h2></div>
              <div className={styles.fieldGrid}>
                <label className={styles.fullWidth}>Address<input name="address" required autoComplete="street-address" placeholder="Street address and apartment" /></label>
                <label>City<input name="city" required autoComplete="address-level2" placeholder="City" /></label>
                <label>Postcode<input name="postcode" required autoComplete="postal-code" placeholder="Postcode" /></label>
                <label className={styles.fullWidth}>Country<select name="country" defaultValue="Bangladesh"><option>Bangladesh</option><option>India</option><option>United States</option><option>United Kingdom</option></select></label>
              </div>
            </section>

            <section className={styles.formSection}>
              <div className={styles.sectionHeading}><span>03</span><h2>Payment</h2></div>
              <fieldset className={styles.paymentOptions}>
                <legend className={styles.srOnly}>Choose a payment method</legend>
                <label className={`${styles.paymentOption} ${styles.disabledOption}`}>
                  <input type="radio" name="paymentMethod" value="bkash" disabled />
                  <span className={styles.paymentIcon}>bK</span>
                  <span className={styles.paymentCopy}><strong>bKash</strong><small>Mobile payment</small></span>
                  <span className={styles.comingSoon}>Coming soon</span>
                </label>
                <label className={`${styles.paymentOption} ${styles.disabledOption}`}>
                  <input type="radio" name="paymentMethod" value="card" disabled />
                  <span className={styles.paymentIcon}>▱</span>
                  <span className={styles.paymentCopy}><strong>Card</strong><small>Visa, Mastercard</small></span>
                  <span className={styles.comingSoon}>Coming soon</span>
                </label>
                <label className={`${styles.paymentOption} ${styles.selectedOption}`}>
                  <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                  <span className={styles.paymentIcon}>৳</span>
                  <span className={styles.paymentCopy}><strong>Cash on delivery</strong><small>Pay when your order arrives</small></span>
                  <span className={styles.available}>Available</span>
                </label>
              </fieldset>
            </section>

            {orderError && <p className={styles.error} role="alert">{orderError}</p>}
            <button type="submit" className={styles.submitButton} disabled={isPlacing}>{isPlacing ? 'Placing order…' : 'Place order · Cash on delivery'} <span aria-hidden="true">↗</span></button>
          </form>

          <aside className={styles.summary}>
            <div className={styles.summaryHeader}><p className={styles.kicker}>Your order</p><span>{items.length} {items.length === 1 ? 'item' : 'items'}</span></div>
            <div className={styles.orderItems}>
              {items.map((item) => <div className={styles.orderItem} key={item.id}>
                <div className={styles.thumbnail}>{item.imageUrl ? <img src={item.imageUrl} alt="" /> : <span>—</span>}</div>
                <div><h2>{item.name}</h2><p>{item.color} / {item.size} · Qty {item.quantity}</p></div>
                <strong>${(item.price * item.quantity).toFixed(2)}</strong>
              </div>)}
            </div>
            <div className={styles.summaryRows}>
              <div><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>
              <div><span>Shipping</span><strong>{shipping === 0 ? 'Complimentary' : `$${shipping.toFixed(2)}`}</strong></div>
            </div>
            <div className={styles.totalRow}><span>Total</span><strong>${total.toFixed(2)}</strong></div>
            <p className={styles.secureNote}>Your information is encrypted and kept private.</p>
          </aside>
        </div>
      )}
    </main>
  )
}
