import styles from '../admin.module.css'
import AdminManagement from './AdminManagement'

export default function AdminsPage() {
  return <>
    <header className={styles.heading}><p className={styles.kicker}>Access control</p><h1>Admin management.</h1><p>Add trusted administrators or remove admin access from existing ones.</p></header>
    <AdminManagement />
  </>
}
