import Link from 'next/link'

import ProductCard from '@/components/ProductCard'
import { getProducts } from '@/services/product.service'
import styles from './home.module.css'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const products = await getProducts()
  const featuredProducts = products.slice(0, 4)

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <p className={styles.eyebrow}>
              New season essentials
            </p>
            <h1 className={styles.heroTitle}>
              Style that feels like you.
            </h1>
            <p className={styles.heroText}>
              Discover thoughtfully designed clothing for everyday confidence,
              comfort, and expression.
            </p>
            <Link
              href="/shop"
              className={styles.primaryLink}
            >
              Shop the collection
            </Link>
          </div>

          <div className={styles.heroVisual}>
            <span>Featured collection</span>
          </div>
        </div>
      </section>

      <section className={styles.featured}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>
              Curated for you
            </p>
            <h2 className={styles.sectionTitle}>Featured products</h2>
          </div>
          <Link href="/shop" className={styles.sectionLink}>
            View all
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <p className={styles.empty}>Products will appear here soon.</p>
        ) : (
          <div className={styles.grid}>
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                slug={product.slug}
                name={product.name}
                price={Number(product.price)}
                imageUrl={product.imageUrl ?? undefined}
              />
            ))}
          </div>
        )}
      </section>

      <section className={styles.benefits}>
        <div className={styles.benefitsInner}>
          <div>
            <h2 className={styles.benefitTitle}>Quality first</h2>
            <p className={styles.benefitText}>
              Carefully selected pieces made for regular wear.
            </p>
          </div>
          <div>
            <h2 className={styles.benefitTitle}>Easy shopping</h2>
            <p className={styles.benefitText}>
              Browse simply and find your next favorite piece quickly.
            </p>
          </div>
          <div>
            <h2 className={styles.benefitTitle}>Made for you</h2>
            <p className={styles.benefitText}>
              A versatile collection that fits your everyday style.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
