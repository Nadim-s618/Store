import styles from './Logo.module.css'

type LogoProps = {
  variant?: 'onDark' | 'onLight' | 'onLavender' | 'onBlue'
}

export default function Logo({ variant = 'onLight' }: LogoProps) {
  return (
    <span className={`${styles.logo} ${styles[variant]}`}>
      <span className={styles.letters}>NEM</span>
      <span className={styles.ring} />
    </span>
  )
}
