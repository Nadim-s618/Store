import Link from 'next/link'
import styles from './Footer.module.css'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.brandCol}>
          <Logo variant="onDark" />
          <p className={styles.tagline}>Quiet pieces for everyday living.</p>
        </div>

        <div className={styles.linkCol}>
          <h4 className={styles.colTitle}>Explore</h4>
          <Link href="/shop" className={styles.link}>Shop all</Link>
          <Link href="/shop?sort=new" className={styles.link}>New arrivals</Link>
          <Link href="/shop" className={styles.link}>Best sellers</Link>
          <Link href="/login" className={styles.link}>Account</Link>
        </div>

        <div className={styles.linkCol}>
          <h4 className={styles.colTitle}>Contact</h4>
          <a href="mailto:hello@nemo.com" className={styles.link}>hello@nemo.com</a>
          <a href="tel:+18005550142" className={styles.link}>+1 (800) 555‑0142</a>
          <span className={styles.linkMuted}>Mon–Fri, 9am–6pm</span>
        </div>

        <div className={styles.linkCol}>
          <h4 className={styles.colTitle}>Follow</h4>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.link}>Instagram</a>
          <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className={styles.link}>Pinterest</a>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className={styles.link}>TikTok</a>
          <a href="https://x.com" target="_blank" rel="noopener noreferrer" className={styles.link}>X</a>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} NEMO. All rights reserved.</span>
        <div className={styles.bottomLinks}>
          <Link href="/privacy" className={styles.bottomLink}>Privacy</Link>
          <Link href="/terms" className={styles.bottomLink}>Terms</Link>
        </div>
      </div>
    </footer>
  )
}