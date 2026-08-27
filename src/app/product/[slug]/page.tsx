import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getMeasurementFields } from '@/lib/measurement-fields'
import { getProductBySlug, getRelatedProducts } from '@/services/product.service'
import ProductOptions from './ProductOptions'
import WishlistButton from '@/components/WishlistButton'
import styles from './product.module.css'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Product not found' }
  const description = product.description?.trim() || `Shop ${product.name} from NEMO's considered clothing collection.`
  const image = product.imageUrl || product.images[0]?.url
  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { type: 'website', title: product.name, description, url: `/product/${product.slug}`, images: image ? [{ url: image, alt: product.name }] : undefined },
    twitter: { card: 'summary_large_image', title: product.name, description, images: image ? [image] : undefined },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const measurementFields = getMeasurementFields(product.category.name)
  const relatedProducts = await getRelatedProducts(product.id, product.categoryId)

  return (
    <main className={styles.page}>
      <aside className={styles.productInfo}>
        <p className={styles.category}>{product.category.name}</p>
        <h1 className={styles.title}>{product.name}</h1>
        <p className={styles.price}>
          ${Number(product.price).toFixed(2)}
        </p>
        <p className={styles.description}>
          {product.description ?? 'No description available.'}
        </p>
        <WishlistButton productId={product.id} label />
      </aside>
      <section className={styles.productMain}>
        <ProductOptions
          productId={product.id}
          productName={product.name}
          productPrice={Number(product.price)}
          variants={product.sizeStocks.map((variant) => ({ color: variant.color, size: variant.size, quantity: variant.quantity }))}
          images={product.images.map((image) => ({ color: image.color, view: image.view, url: image.url }))}
          measurementFields={measurementFields}
          measurements={product.sizeMeasurements.map((measurement) => ({ size: measurement.size, height: measurement.height == null ? null : Number(measurement.height), width: measurement.width == null ? null : Number(measurement.width), waist: measurement.waist == null ? null : Number(measurement.waist), hip: measurement.hip == null ? null : Number(measurement.hip) }))}
          fallbackImage={product.imageUrl ?? undefined}
          reviews={product.reviews.map((review) => ({ id: review.id, rating: review.rating, comment: review.comment, author: review.user.name || 'Customer', verifiedPurchase: review.verifiedPurchase, createdAt: review.createdAt.toISOString() }))}
          relatedProducts={relatedProducts.map((related) => ({ id: related.id, slug: related.slug, name: related.name, price: Number(related.price), imageUrl: related.imageUrl, stock: related.stock, sizeStocks: related.sizeStocks }))}
        />
      </section>
      <aside className={styles.sizeChart}>
        <p className={styles.chartKicker}>Find your fit</p>
        <h2>Size chart.</h2>
        <div className={styles.chartTable}>
        <table>
          <thead><tr><th>Size</th>{measurementFields.map((field) => <th key={field.key}>{field.label}</th>)}</tr></thead>
          <tbody>{(['S', 'M', 'L', 'XL', 'XXL'] as const).map((size) => {
            const measurement = product.sizeMeasurements.find((item) => item.size === size)
            return <tr key={size}><td>{size}</td>{measurementFields.map((field) => { const value = measurement?.[field.key]; return <td key={field.key}>{value != null ? `${Number(value).toFixed(1)} cm` : '—'}</td> })}</tr>
          })}</tbody>
        </table>
        </div>
        <p className={styles.chartNote}>Choose your size below the product image.</p>
      </aside>
    </main>
  )
}
