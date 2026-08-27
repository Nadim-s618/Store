'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import Logo from './Logo'
import styles from './Navbar.module.css'

export default function BrandLink() {
  const pathname = usePathname()
  const href = pathname.startsWith('/admin') ? '/admin' : '/'

  return <Link href={href} className={styles.brand} aria-label={href === '/admin' ? 'Admin overview' : 'Your Store home'}><Logo variant="onLight" /></Link>
}
