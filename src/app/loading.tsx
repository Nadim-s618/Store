import styles from './loading.module.css'

export default function Loading() {
  return (
    <main className={styles.loading} aria-live="polite" aria-label="Loading page">
      <span className={styles.spinner} aria-hidden="true" />
      <p>Loading</p>
    </main>
  )
}
