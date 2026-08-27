'use client'

import { useState } from 'react'
import ProductCard from '@/components/ProductCard'
import styles from './shop.module.css'

type ShopProduct = { id: string; slug: string; name: string; price: number; imageUrl: string | null; stock: number; sizeStocks: { color: string; size: string; quantity: number }[] }

export default function ShopProductGrid({ initialProducts, initialHasMore, query }: { initialProducts: ShopProduct[]; initialHasMore: boolean; query: string }) {
  const [products, setProducts] = useState(initialProducts)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadMore() {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams(query); params.set('page', String(page)); params.set('limit', '12')
      const response = await fetch(`/api/products?${params.toString()}`)
      const result = await response.json() as { products?: ShopProduct[]; hasMore?: boolean; error?: string }
      if (!response.ok || !result.products) throw new Error(result.error || 'Unable to load more products.')
      setProducts((current) => [...current, ...result.products!]); setHasMore(Boolean(result.hasMore)); setPage((current) => current + 1)
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load more products.') } finally { setLoading(false) }
  }

  return <><div className={styles.productGrid}>{products.map((product) => <ProductCard key={product.id} productId={product.id} variants={product.sizeStocks} slug={product.slug} name={product.name} price={product.price} imageUrl={product.imageUrl ?? undefined} stock={product.stock} />)}</div>{hasMore && <div className={styles.loadMoreWrap}><button type="button" className={styles.loadMore} onClick={loadMore} disabled={loading}>{loading ? 'Loading…' : 'Load more pieces'} <span aria-hidden="true">↓</span></button></div>}{error && <p className={styles.loadMoreError} role="alert">{error}</p>}</>
}
