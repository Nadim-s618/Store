'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { FormEvent, PointerEvent } from 'react'
import styles from './ProductOptions.module.css'
import relatedStyles from './related.module.css'
import ProductCard from '@/components/ProductCard'

type Variant = { color: string; size: string; quantity: number }
type ProductImage = { color: string; view: string; url: string }
type CartItem = { id: string; productId: string; name: string; price: number; imageUrl?: string; color: string; size: string; quantity: number; availableColors: string[]; variants: Variant[] }
type Review = { id: string; rating: number; comment: string | null; author: string; verifiedPurchase: boolean; createdAt: string }
type RelatedProduct = { id: string; slug: string; name: string; price: number; imageUrl: string | null; stock: number; sizeStocks: Variant[] }
const views = ['Front', 'Back', 'Right', 'Left']

export default function ProductOptions({ productId, productName, productPrice, variants, images, fallbackImage, reviews: initialReviews, relatedProducts }: { productId: string; productName: string; productPrice: number; variants: Variant[]; images: ProductImage[]; fallbackImage?: string; reviews: Review[]; relatedProducts: RelatedProduct[] }) {
  const router = useRouter()
  const colors = [...new Set(variants.map((variant) => variant.color))]
  const sizes = ['S', 'M', 'L', 'XL', 'XXL']
  const [selectedColor, setSelectedColor] = useState(colors[0] || 'Default')
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedView, setSelectedView] = useState('Front')
  const colorImages = images.filter((image) => image.color === selectedColor)
  const selectedImage = colorImages.find((image) => image.view.toLowerCase() === selectedView.toLowerCase())?.url ?? colorImages[0]?.url ?? fallbackImage
  const selectedVariant = (size: string) => variants.find((variant) => variant.color === selectedColor && variant.size === size)
  const currentViewIndex = views.indexOf(selectedView)
  const [message, setMessage] = useState('')
  const [reviews, setReviews] = useState(initialReviews)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  function changeView(direction: number) {
    setSelectedView(views[(currentViewIndex + direction + views.length) % views.length])
  }

  function trackZoomPoint(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * 100
    const y = ((event.clientY - bounds.top) / bounds.height) * 100
    event.currentTarget.style.setProperty('--zoom-x', `${x}%`)
    event.currentTarget.style.setProperty('--zoom-y', `${y}%`)
  }

  function addToCart(goToCart = false) {
    if (!selectedSize) return
    const storageKey = 'clothing-store-cart'
    const stored = window.localStorage.getItem(storageKey)
    const cart: CartItem[] = stored ? JSON.parse(stored) : []
    const itemId = `${productId}:${selectedColor}:${selectedSize}`
    const existing = cart.find((item) => item.id === itemId)
    if (existing) {
      existing.quantity += 1
      existing.availableColors = colors
      existing.variants = variants
    }
    else cart.push({ id: itemId, productId, name: productName, price: productPrice, imageUrl: selectedImage, color: selectedColor, size: selectedSize, quantity: 1, availableColors: colors, variants })
    window.localStorage.setItem(storageKey, JSON.stringify(cart))
    window.dispatchEvent(new CustomEvent('cart-updated'))
    if (goToCart) router.push('/cart')
    else setMessage('Added to cart')
    if (!goToCart) window.setTimeout(() => setMessage(''), 2200)
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!rating) { setReviewMessage('Choose a star rating first.'); return }
    setSubmittingReview(true); setReviewMessage('')
    try {
      const response = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, rating, comment }) })
      const result = await response.json() as { review?: Review; error?: string }
      if (!response.ok || !result.review) throw new Error(result.error || 'Unable to submit your review.')
      setReviews((current) => [result.review!, ...current.filter((review) => review.id !== result.review!.id)])
      setComment(''); setReviewMessage('Your review has been published.')
    } catch (error) { setReviewMessage(error instanceof Error ? error.message : 'Unable to submit your review.') } finally { setSubmittingReview(false) }
  }

  return <>
    <div className={styles.imageWithViews}>
      <div className={styles.imageViewer} onPointerMove={trackZoomPoint}>
        {selectedImage ? <img key={selectedView} src={selectedImage} alt={`${selectedColor} ${selectedView}`} className={styles.productImage} loading="lazy" /> : <div className={styles.noImage}>No image available</div>}
        <button type="button" className={`${styles.viewArrow} ${styles.arrowLeft}`} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); changeView(-1) }} aria-label="Previous product image"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg></button>
        <button type="button" className={`${styles.viewArrow} ${styles.arrowRight}`} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); changeView(1) }} aria-label="Next product image"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg></button>
      </div>
      <div className={styles.viewOptions} aria-label="Product views">{views.map((view) => <button key={view} type="button" className={styles.viewButton} onClick={() => setSelectedView(view)} aria-pressed={selectedView === view}>{view}</button>)}</div>
    </div>
    {colors.length > 0 && <div className={styles.optionGroup}><h2 className={styles.optionTitle}>Select color</h2><div className={styles.options}>{colors.map((color) => <button key={color} type="button" className={styles.option} onClick={() => { setSelectedColor(color); setSelectedSize(null); setSelectedView('Front') }} aria-pressed={selectedColor === color}><span className={styles.swatch} style={{ backgroundColor: color.toLowerCase() }} />{color}</button>)}</div></div>}
    <div className={styles.optionGroup}><h2 className={styles.optionTitle}>Select size</h2><div className={styles.options}>{sizes.map((size) => { const quantity = selectedVariant(size)?.quantity ?? 0; return <button key={size} type="button" className={styles.option} disabled={quantity === 0} onClick={() => setSelectedSize(size)} aria-pressed={selectedSize === size}>{size}{quantity === 0 ? ' · Sold out' : ''}</button> })}</div>{selectedSize && <p className={styles.stockMessage}>{selectedVariant(selectedSize)?.quantity ?? 0} {selectedVariant(selectedSize)?.quantity === 1 ? 'item' : 'items'} available</p>}</div>
    <div className={styles.buttonRow}><button type="button" disabled={!selectedSize} className={styles.cartButton} onClick={() => addToCart()}>Add to Cart</button><button type="button" disabled={!selectedSize} className={styles.buyNowButton} onClick={() => addToCart(true)}>Buy Now</button></div>
    {message && <p role="status" className={styles.cartMessage}><span aria-hidden="true">✓</span>{message}</p>}
    <section className={styles.reviews} aria-labelledby="reviews-title"><div className={styles.reviewsHeader}><div><p className={styles.reviewKicker}>Customer notes</p><h2 id="reviews-title">Reviews.</h2></div>{reviews.length > 0 && <div className={styles.ratingSummary}><strong>{averageRating.toFixed(1)}</strong><span className={styles.stars}>{'★'.repeat(Math.round(averageRating))}{'☆'.repeat(5 - Math.round(averageRating))}</span><small>{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</small></div>}</div>{reviews.length === 0 ? <p className={styles.noReviews}>No reviews yet. Be the first to share your experience after delivery.</p> : <div className={styles.reviewList}>{reviews.map((review) => <article className={styles.review} key={review.id}><div className={styles.reviewTop}><span className={styles.stars} aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span><span className={styles.reviewAuthor}>{review.author}{review.verifiedPurchase && <em>Verified purchase</em>}</span></div>{review.comment && <p>{review.comment}</p>}<time dateTime={review.createdAt}>{new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(review.createdAt))}</time></article>)}</div>}<form className={styles.reviewForm} onSubmit={submitReview}><h3>Share your experience</h3><div className={styles.starPicker} aria-label="Choose a rating">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} className={styles.starButton} onClick={() => setRating(value)} aria-label={`${value} star${value === 1 ? '' : 's'}`} aria-pressed={rating === value}>{value <= rating ? '★' : '☆'}</button>)}</div><textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} rows={3} placeholder="What did you think? (optional)" aria-label="Review comment" /><button type="submit" className={styles.reviewSubmit} disabled={submittingReview}>{submittingReview ? 'Publishing…' : 'Publish review'}</button>{reviewMessage && <p className={styles.reviewMessage} role="status">{reviewMessage}</p>}</form></section>
    {relatedProducts.length > 0 && <section className={relatedStyles.related} aria-labelledby="related-title"><p className={relatedStyles.kicker}>You may also like</p><h2 id="related-title">Related pieces.</h2><div className={relatedStyles.grid}>{relatedProducts.map((product) => <ProductCard key={product.id} productId={product.id} slug={product.slug} name={product.name} price={product.price} imageUrl={product.imageUrl ?? undefined} stock={product.stock} variants={product.sizeStocks} />)}</div></section>}
  </>
}
