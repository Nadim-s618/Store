import Link from 'next/link'
import styles from './Navbar.module.css'

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.2 3.1-5 7-5s6.2 1.8 7 5" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <path d="M3.5 4h2l1.8 11h10.9l2.3-8H6.2" />
      <circle cx="9" cy="19" r="1.2" />
      <circle cx="17" cy="19" r="1.2" />
    </svg>
  )
}

export default function Navbar() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand} aria-label="Your Store home">
        </Link>

        <div className={styles.links}>
          <Link href="/shop" className={styles.link}>Shop All</Link>
          <Link href="/shop?sort=new" className={styles.link}>New Arrivals</Link>
          <Link href="/story" className={styles.link}>Story</Link>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.iconButton} aria-label="Search">
            <SearchIcon />
          </button>
          <Link href="/account" className={styles.iconButton} aria-label="Profile">
            <ProfileIcon />
          </Link>
          <Link href="/cart" className={styles.iconButton} aria-label="Cart">
            <CartIcon />
          </Link>
        </div>
      </nav>
    </header>
  )
}
