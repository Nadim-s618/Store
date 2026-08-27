import { notFound } from 'next/navigation'

import { getProductBySlug } from '@/services/product.service'
import ProductOptions from './ProductOptions'
import styles from './product.module.css'

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
      </aside>
      <section className={styles.productMain}>
        <ProductOptions
          productId={product.id}
          productName={product.name}
          productPrice={Number(product.price)}
          variants={product.sizeStocks.map((variant) => ({ color: variant.color, size: variant.size, quantity: variant.quantity }))}
          images={product.images.map((image) => ({ color: image.color, view: image.view, url: image.url }))}
          fallbackImage={product.imageUrl ?? undefined}
        />
      </section>
      <aside className={styles.sizeChart}>
        <p className={styles.chartKicker}>Find your fit</p>
        <h2>Size chart.</h2>
        <table>
          <thead><tr><th>Size</th><th>Height</th><th>Width</th><th>Waist</th><th>Hip</th></tr></thead>
          <tbody>{(['S', 'M', 'L', 'XL', 'XXL'] as const).map((size) => {
            const measurement = product.sizeMeasurements.find((item) => item.size === size)
            return <tr key={size}><td>{size}</td><td>{measurement?.height != null ? `${measurement.height} cm` : '—'}</td><td>{measurement?.width != null ? `${measurement.width} cm` : '—'}</td><td>{measurement?.waist != null ? `${measurement.waist} cm` : '—'}</td><td>{measurement?.hip != null ? `${measurement.hip} cm` : '—'}</td></tr>
          })}</tbody>
        </table>
        <p className={styles.chartNote}>Choose your size below the product image.</p>
      </aside>
    </main>
  )
}
