import Link from 'next/link'

import { prisma } from '@/lib/prisma'
import AddProductForm from './AddProductForm'
import AdminProductCuration from './AdminProductCuration'
import AdminProductList from './AdminProductList'
import styles from '../admin.module.css'

export default async function AdminProductsPage() {
  const [products, categories, history] = await Promise.all([
    prisma.product.findMany({ include: { category: true, sizeStocks: true }, orderBy: { createdAt: 'desc' } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.inventoryAdjustment.findMany({ orderBy: { createdAt: 'desc' }, take: 40, include: { product: { select: { name: true } } } }),
  ])

  return (
    <>
      <header className={styles.heading}>
        <p className={styles.kicker}>Catalog</p>
        <h1>Products.</h1>
        <p>Review the pieces currently available in your store.</p>
      </header>
      <AddProductForm categories={categories.map((category) => ({ name: category.name, slug: category.slug }))} />
      <details className={`${styles.panel} ${styles.collapsiblePanel}`}>
        <summary className={styles.collapsibleSummary}><h2>Homepage sections</h2><span>Expand</span></summary>
        <div className={styles.panelHeader}><Link href="/shop">View storefront</Link></div>
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
          sizeStocks: product.sizeStocks,
        }))} />
      </details>
      <section className={styles.panel}><div className={styles.panelHeader}><h2>Stock history</h2><span className={styles.muted}>Latest 40 adjustments</span></div>{history.length === 0 ? <p className={styles.empty}>No inventory changes have been recorded yet.</p> : <div className={styles.tableScroll}><table className={styles.table}><thead><tr><th>Product</th><th>Variant</th><th>Change</th><th>Reason</th><th>When</th></tr></thead><tbody>{history.map((item) => <tr key={item.id}><td>{item.product.name}</td><td className={styles.muted}>{item.color} / {item.size}</td><td className={item.quantityChange < 0 ? styles.lowStockCritical : styles.lowStockWarning}>{item.quantityChange > 0 ? '+' : ''}{item.quantityChange} → {item.quantityAfter}</td><td className={styles.muted}>{item.reason}</td><td className={styles.muted}>{item.createdAt.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dhaka' })}</td></tr>)}</tbody></table></div>}</section>
      <details className={`${styles.panel} ${styles.collapsiblePanel}`}>
        <summary className={styles.collapsibleSummary}><h2>Product listing</h2><span>Expand</span></summary>
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
          sizeStocks: product.sizeStocks,
        }))} />
      </details>
    </>
  )
}
