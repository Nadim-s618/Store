import { prisma } from '@/lib/prisma'
import AdminCategoryList from './AdminCategoryList'
import styles from '../admin.module.css'

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { createdAt: 'asc' } })

  return <>
    <header className={styles.heading}>
      <p className={styles.kicker}>Shop layout</p>
      <h1>Categories.</h1>
      <p>Give each category its own background image and description.</p>
    </header>
    <AdminCategoryList categories={categories.map((category) => ({ id: category.id, name: category.name, slug: category.slug, description: category.description ?? '', imageUrl: category.imageUrl }))} />
  </>
}
