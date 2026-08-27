'use client'

import { useState } from 'react'
import ProductCard from '@/components/ProductCard'

type WishlistProduct = { id: string; slug: string; name: string; price: number; imageUrl: string | null; stock: number; sizeStocks: { color: string; size: string; quantity: number }[] }

export default function WishlistGrid({ products }: { products: WishlistProduct[] }) {
  const [items, setItems] = useState(products)
  return <div className="wishlistGrid">{items.map((product) => <ProductCard key={product.id} productId={product.id} slug={product.slug} name={product.name} price={product.price} imageUrl={product.imageUrl ?? undefined} stock={product.stock} variants={product.sizeStocks} onWishlistChange={(saved) => { if (!saved) setItems((current) => current.filter((item) => item.id !== product.id)) }} />)}</div>
}
