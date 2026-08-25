import ProductCard from '@/components/ProductCard'
import { getProducts } from '@/services/product.service'
import styles from './shop.module.css'

export default async function ShopPage() {
  const products = await getProducts()

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Shop</h1>

      {products.length === 0 ? (
        <p className={styles.empty}>No products available yet.</p>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => (
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
    </main>
  )
}
