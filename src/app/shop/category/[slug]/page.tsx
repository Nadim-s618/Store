import Link from 'next/link'
import { notFound } from 'next/navigation'

import ProductCard from '@/components/ProductCard'
import { getProducts, getShopCategories } from '@/services/product.service'
import styles from '../../shop.module.css'

type CategoryPageProps = { params: Promise<{ slug: string }> }

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const [categories, products] = await Promise.all([
    getShopCategories(),
    getProducts({ includeCategory: true }),
  ])
  const category = categories.find((item) => item.slug === slug)
  if (!category) notFound()

  const categoryProducts = products.filter((product) => product.category?.slug === slug)

  return <main className={styles.page}>
    <header className={styles.categoryPageHeading}>
      <Link href="/shop" className={styles.backLink}>← Shop all</Link>
      <p className={styles.kicker}>Collection / {category.slug}</p>
      <h1>{category.name}.</h1>
      <p>{category.description}</p>
    </header>
    <section className={styles.productSection} aria-label={`${category.name} products`}>
      <div className={styles.productHeader}>
        <div><p className={styles.kicker}>The edit</p><h2>{categoryProducts.length} {categoryProducts.length === 1 ? 'piece' : 'pieces'}.</h2></div>
      </div>
      {categoryProducts.length === 0 ? <p className={styles.empty}>No products have been added to this category yet.</p> : <div className={styles.productGrid}>{categoryProducts.map((product) => <ProductCard key={product.id} slug={product.slug} name={product.name} price={Number(product.price)} imageUrl={product.imageUrl ?? undefined} stock={product.stock} />)}</div>}
    </section>
  </main>
}
