'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { PointerEvent } from 'react'
import styles from './ProductOptions.module.css'

type Variant = { color: string; size: string; quantity: number }
type ProductImage = { color: string; view: string; url: string }
type CartItem = { id: string; productId: string; name: string; price: number; imageUrl?: string; color: string; size: string; quantity: number; availableColors: string[]; variants: Variant[] }
const views = ['Front', 'Back', 'Right', 'Left']

export default function ProductOptions({ productId, productName, productPrice, variants, images, fallbackImage }: { productId: string; productName: string; productPrice: number; variants: Variant[]; images: ProductImage[]; fallbackImage?: string }) {
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
    if (goToCart) router.push('/cart')
    else setMessage('Added to cart')
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
    {message && <p role="status" className={styles.cartMessage}>{message}</p>}
  </>
}
