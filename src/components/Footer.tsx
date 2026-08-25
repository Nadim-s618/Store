import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        © {new Date().getFullYear()} Your Store. All rights reserved.
      </div>
    </footer>
  )
}
