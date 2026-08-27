import styles from './template.module.css'
import PageTransition from './PageTransition'

export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition className={styles.pageTransition}>{children}</PageTransition>
}
