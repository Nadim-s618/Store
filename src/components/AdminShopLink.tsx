'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import styles from './Navbar.module.css'

export default function AdminShopLink() {
  const pathname = usePathname()
  const inAdminPanel = pathname.startsWith('/admin')

  return <Link href={inAdminPanel ? '/' : '/admin'} className={styles.adminLink}>{inAdminPanel ? 'Shop' : 'Admin panel'}</Link>
}
