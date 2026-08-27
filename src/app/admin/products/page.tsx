import Link from 'next/link'

import { prisma } from '@/lib/prisma'
import AddProductForm from './AddProductForm'
import AdminProductCuration from './AdminProductCuration'
import AdminProductList from './AdminProductList'
import styles from '../admin.module.css'

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ include: { category: true }, orderBy: { createdAt: 'desc' } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ])

  return (
    <>
      <header className={styles.heading}>
        <p className={styles.kicker}>Catalog</p>
        <h1>Products.</h1>
        <p>Review the pieces currently available in your store.</p>
      </header>
      <AddProductForm categories={categories.map((category) => ({ name: category.name, slug: category.slug }))} />
      <section className={styles.panel}>
        <div className={styles.panelHeader}><h2>Homepage sections</h2><Link href="/shop">View storefront</Link></div>
        <AdminProductCuration products={products.map((product) => ({
          id: product.id,
          name: product.name,
          categoryName: product.category.name,
          stock: product.stock,
          price: Number(product.price),
          isTopCollection: product.isTopCollection,
          topCollectionOrder: product.topCollectionOrder,
          isNewArrival: product.isNewArrival,
          newArrivalOrder: product.newArrivalOrder,
        }))} />
      </section>
      <section className={styles.panel}>
        <h2>Product listing</h2>
        <AdminProductList products={products.map((product) => ({
          id: product.id,
          name: product.name,
          categoryName: product.category.name,
          description: product.description ?? '',
          price: Number(product.price),
          stock: product.stock,
          isTopCollection: product.isTopCollection,
          topCollectionOrder: product.topCollectionOrder,
          isNewArrival: product.isNewArrival,
          newArrivalOrder: product.newArrivalOrder,
        }))} />
      </section>
    </>
  )
}
