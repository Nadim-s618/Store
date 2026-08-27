import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import { getHomepageCollections } from '@/services/product.service'
import Footer from '@/components/Footer'
import SignOutButton from '@/components/SignOutButton'
import { getCurrentUser } from '@/lib/auth'
import styles from './home.module.css'
import StackScrollFX from './StackScrollFX'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [{ topCollection, newArrivals }, user] = await Promise.all([
    getHomepageCollections().catch((error) => {
    console.error('Unable to load homepage products:', error)
    return { topCollection: [], newArrivals: [] }
    }),
    getCurrentUser(),
  ])

  return (
    <>
      <div className={styles.page}>
      <StackScrollFX />

      {/* 01 — Hero */}
      <section data-stack className={`${styles.stackSection} ${styles.hero}`}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.kicker}>Introducing NEMO</p>
          <h1 className={styles.heroTitle}>Quiet clothes for a loud world.</h1>
          <p className={styles.heroText}>
            Considered basics, cut clean and built to last — made for wherever the day takes you.
          </p>
          <Link href="/shop" className={`${styles.pillButton} ${styles.pillButtonOnDark}`}>
            <span>Shop the collection</span>
            <span className={styles.buttonArrow}>↗</span>
          </Link>
        </div>
        <p className={styles.heroNote}>NEMO — wear your story<br />01 — 04</p>
      </section>

      {/* 02 — Top collection (white) */}
      <section data-stack className={`${styles.stackSection} ${styles.collectionSection}`}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.kickerDark}>02 / Curated edit</p>
              <h2 className={styles.sectionTitle}>Top collection</h2>
            </div>
            <Link href="/shop" className={styles.textLink}>
              <span>View all</span>
              <span className={styles.linkArrow}>↗</span>
            </Link>
          </div>
          {topCollection.length === 0 ? <EmptyState /> : <ProductGrid products={topCollection} />}
        </div>
      </section>

      {/* 03 — New arrivals (lavender) */}
      <section data-stack className={`${styles.stackSection} ${styles.arrivalsSection}`}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.kickerDark}>03 / Just landed</p>
              <h2 className={styles.sectionTitle}>New arrivals</h2>
            </div>
            <Link href="/shop?sort=new" className={styles.textLink}>
              <span>Discover more</span>
              <span className={styles.linkArrow}>↗</span>
            </Link>
          </div>
          {newArrivals.length === 0 ? <EmptyState /> : <ProductGrid products={newArrivals} />}
        </div>
      </section>

      {/* 04 — Account (lightest blue) */}
      <section data-stack className={`${styles.stackSection} ${styles.accountSection}`}>
        <div className={styles.sectionInner}>
          <div className={styles.accountRow}>
            <div>
              <p className={styles.kickerDark}>04 / Your space</p>
              <h2 className={styles.accountTitle}>Make it yours.</h2>
              <p className={styles.accountText}>
                Sign in to save favorites, track orders, and pick up right where you left off.
              </p>
            </div>
            <div className={styles.accountActions}>
              {user ? <SignOutButton className={`${styles.pillButton} ${styles.pillButtonOnLight}`} /> : <>
                <Link href="/login" className={`${styles.pillButton} ${styles.pillButtonOnLight}`}>
                  <span>Log in</span>
                  <span className={styles.buttonArrow}>↗</span>
                </Link>
                <Link href="/signup" className={`${styles.pillButton} ${styles.pillButtonOnLight}`}>
                  <span>Sign up</span>
                  <span className={styles.buttonArrow}>↗</span>
                </Link>
              </>}
            </div>
          </div>
        </div>
      </section>
    </div>
      <Footer />
    </>
  )
}

function ProductGrid({ products }: { products: Awaited<ReturnType<typeof getHomepageCollections>>['topCollection'] }) {
  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <div key={product.id} className={styles.gridItem}>
          <ProductCard
            productId={product.id}
            variants={product.sizeStocks}
            slug={product.slug}
            name={product.name}
            price={Number(product.price)}
            imageUrl={product.imageUrl ?? undefined}
            stock={product.stock}
            showAvailability
          />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return <p className={styles.empty}>New pieces are arriving soon.</p>
}
