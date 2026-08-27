import Link from 'next/link'
import { getCurrentUser, isAdminUser } from '@/lib/auth'
import AdminShopLink from './AdminShopLink'
import BrandLink from './BrandLink'
import SignOutButton from './SignOutButton'
import SearchButton from './SearchButton'
import styles from './Navbar.module.css'

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <circle cx="12" cy="7.5" r="3.25" />
      <path d="M4.75 19.5c1-3.6 3.6-5.5 7.25-5.5s6.25 1.9 7.25 5.5" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <path d="M7 8.5V7a5 5 0 0 1 10 0v1.5" />
      <path d="M5.5 8.5h13l-1 11.5a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 0 1-1.5-1.5z" />
    </svg>
  )
}

function TrackingIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}><path d="M3.5 6.5h11v10h-11z" /><path d="M14.5 10h3l3 3v3.5h-6z" /><circle cx="7.5" cy="18" r="1.5" /><circle cx="17.5" cy="18" r="1.5" /></svg>
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <path d="M14 4.5H6.75A1.75 1.75 0 0 0 5 6.25v11.5a1.75 1.75 0 0 0 1.75 1.75H14" />
      <path d="M11 12h8.5" />
      <path d="m16.5 8 4 4-4 4" />
    </svg>
  )
}

export default async function Navbar() {
  const user = await getCurrentUser()
  const isAdmin = isAdminUser(user)

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <BrandLink />

        <div className={styles.links}>
          <Link href="/shop" className={styles.link}>Shop All</Link>
          <Link href="/shop?sort=new" className={styles.link}>New Arrivals</Link>
          <Link href="/story" className={styles.link}>Story</Link>
        </div>

        <div className={styles.actions}>
          {isAdmin && <AdminShopLink />}
          <SearchButton />
          <Link href="/account" className={styles.iconButton} aria-label="Profile">
            <ProfileIcon />
          </Link>
          <Link href="/tracking" className={styles.iconButton} aria-label="Track order">
            <TrackingIcon />
          </Link>
          <Link href="/cart" className={styles.iconButton} aria-label="Cart">
            <CartIcon />
          </Link>
          {user && <SignOutButton className={styles.iconButton} ariaLabel="Sign out"><SignOutIcon /></SignOutButton>}
        </div>
      </nav>
    </header>
  )
}
