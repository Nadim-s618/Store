import Link from 'next/link'
import { redirect } from 'next/navigation'

import { requireAdmin } from '@/lib/auth'
import styles from './admin.module.css'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin()
  } catch {
    redirect('/login?message=Admin access is required.')
  }

  return (
    <div className={styles.adminShell}>
      <aside className={styles.sidebar}>
        <p className={styles.eyebrow}>NEMO / Admin</p>
        <nav className={styles.nav}>
          <Link href="/admin">Overview</Link>
          <Link href="/admin/products">Products</Link>
          <Link href="/admin/categories">Categories</Link>
          <Link href="/admin/orders">Orders</Link>
        </nav>
        <Link href="/" className={styles.backLink}>← Go to shop</Link>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  )
}
