import { notFound } from 'next/navigation'

import { getProductBySlug } from '@/services/product.service'
import styles from './product.module.css'

const sizes = ['S', 'M', 'L', 'XL']
const colors = ['Black', 'White', 'Navy']

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
      <div className={styles.imageBox}>
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className={styles.image}
          />
        ) : (
          <div className={styles.noImage}>
            No image available
          </div>
        )}
      </div>

      <div>
        <p className={styles.category}>{product.category.name}</p>
        <h1 className={styles.title}>{product.name}</h1>
        <p className={styles.price}>
          ${Number(product.price).toFixed(2)}
        </p>
        <p className={styles.description}>
          {product.description ?? 'No description available.'}
        </p>

        <div className={styles.optionGroup}>
          <h2 className={styles.optionTitle}>Size</h2>
          <div className={styles.options}>
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                className={styles.option}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.optionGroup}>
          <h2 className={styles.optionTitle}>Color</h2>
          <div className={styles.options}>
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                className={styles.option}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled
          className={styles.cartButton}
        >
          Add to Cart
        </button>
      </div>
    </main>
  )
}
