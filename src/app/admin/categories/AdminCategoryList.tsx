'use client'

import { ChangeEvent, FormEvent, useState } from 'react'
import styles from '../admin.module.css'

type Category = { id: string; name: string; slug: string; description: string; imageUrl: string | null }

export default function AdminCategoryList({ categories }: { categories: Category[] }) {
  const [items, setItems] = useState(categories)
  const [files, setFiles] = useState<Record<string, File | undefined>>({})
  const [savingId, setSavingId] = useState('')
  const [message, setMessage] = useState('')
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '' })
  const [newFile, setNewFile] = useState<File>()
  const [editingId, setEditingId] = useState('')

  function updateDescription(id: string, description: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, description } : item))
  }

  function chooseImage(id: string, event: ChangeEvent<HTMLInputElement>) {
    setFiles((current) => ({ ...current, [id]: event.target.files?.[0] }))
  }

  async function save(event: FormEvent, item: Category) {
    event.preventDefault()
    setSavingId(item.id)
    setMessage('')
    const formData = new FormData()
    formData.append('id', item.id)
    formData.append('name', item.name)
    formData.append('slug', item.slug)
    formData.append('description', item.description)
    if (files[item.id]) formData.append('image', files[item.id] as File)
    const response = await fetch('/api/admin/categories', { method: 'PATCH', body: formData })
    const result = await response.json().catch(() => null) as { error?: string; category?: Category } | null
    if (response.ok && result?.category) {
      setItems((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, name: result.category?.name ?? item.name, slug: result.category?.slug ?? item.slug, description: result.category?.description ?? '', imageUrl: result.category?.imageUrl ?? null } : currentItem))
      setFiles((current) => ({ ...current, [item.id]: undefined }))
      setEditingId('')
      setMessage('Category settings saved.')
    } else setMessage(result?.error || 'Unable to save category settings.')
    setSavingId('')
  }

  async function createCategory(event: FormEvent) {
    event.preventDefault()
    setSavingId('new')
    setMessage('')
    const formData = new FormData()
    formData.append('name', newCategory.name)
    formData.append('slug', newCategory.slug)
    formData.append('description', newCategory.description)
    if (newFile) formData.append('image', newFile)
    const response = await fetch('/api/admin/categories', { method: 'POST', body: formData })
    const result = await response.json().catch(() => null) as { error?: string; category?: Category } | null
    if (response.ok && result?.category) {
      setItems((current) => [...current, result.category as Category])
      setNewCategory({ name: '', slug: '', description: '' })
      setNewFile(undefined)
      setMessage('New category added.')
    } else setMessage(result?.error || 'Unable to add category.')
    setSavingId('')
  }

  async function deleteCategory(item: Category) {
    if (!window.confirm(`Delete the ${item.name} category?`)) return
    setSavingId(`delete-${item.id}`)
    setMessage('')
    const response = await fetch('/api/admin/categories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id }) })
    const result = await response.json().catch(() => null) as { error?: string } | null
    if (response.ok) {
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))
      setMessage(`${item.name} category deleted.`)
    } else setMessage(result?.error || 'Unable to delete category.')
    setSavingId('')
  }

  return <>
    <form className={`${styles.panel} ${styles.categoryCreatePanel}`} onSubmit={createCategory}>
      <h2>Add category</h2>
      <div className={styles.formGrid}>
        <label>Name<input required value={newCategory.name} onChange={(event) => setNewCategory({ ...newCategory, name: event.target.value })} placeholder="For example, Denim" /></label>
        <label>Slug <span className={styles.muted}>(optional)</span><input value={newCategory.slug} onChange={(event) => setNewCategory({ ...newCategory, slug: event.target.value })} placeholder="denim" /></label>
        <label className={styles.fullWidth}>Description<textarea rows={3} value={newCategory.description} onChange={(event) => setNewCategory({ ...newCategory, description: event.target.value })} placeholder="Describe this category..." /></label>
        <label>Background image <span className={styles.muted}>(optional)</span><input type="file" accept="image/*" onChange={(event) => setNewFile(event.target.files?.[0])} /></label>
      </div>
      <button className={styles.saveButton} type="submit" disabled={savingId === 'new'}>{savingId === 'new' ? 'Adding…' : 'Add category'}</button>
    </form>
    <section className={styles.categoryAdminGrid}>
    {items.map((item) => <form className={styles.categoryAdminCard} key={item.id} onSubmit={(event) => save(event, item)}>
      <div className={styles.categoryPreview} style={item.imageUrl ? { backgroundImage: `linear-gradient(180deg, transparent, rgba(10, 14, 12, .75)), url("${item.imageUrl}")` } : undefined}>
        <span>{item.name}</span>
      </div>
      <div className={styles.categoryAdminFields}>
        {editingId === item.id ? <>
          <label>Name<input value={item.name} onChange={(event) => setItems((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, name: event.target.value } : currentItem))} /></label>
          <label>Slug<input value={item.slug} onChange={(event) => setItems((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, slug: event.target.value } : currentItem))} /></label>
        </> : <p className={styles.muted}>/{item.slug}</p>}
        <label>Description<textarea rows={3} value={item.description} onChange={(event) => updateDescription(item.id, event.target.value)} placeholder="Describe this category..." /></label>
        <label>Background image<input type="file" accept="image/*" onChange={(event) => chooseImage(item.id, event)} /></label>
        {files[item.id] && <span className={styles.muted}>{files[item.id]?.name}</span>}
        <div className={styles.categoryActions}>
          {editingId !== item.id && <button className={styles.editButton} type="button" onClick={() => setEditingId(item.id)}>Edit</button>}
          <button className={styles.saveButton} type="submit" disabled={savingId === item.id || savingId === `delete-${item.id}`}>{savingId === item.id ? 'Saving…' : 'Save category'}</button>
          {editingId === item.id && <button className={styles.cancelButton} type="button" onClick={() => setEditingId('')}>Cancel</button>}
          <button className={styles.deleteButton} type="button" onClick={() => deleteCategory(item)} disabled={savingId === item.id || savingId === `delete-${item.id}`}>{savingId === `delete-${item.id}` ? 'Deleting…' : 'Delete'}</button>
        </div>
      </div>
    </form>)}
    </section>
    {message && <p className={styles.curationMessage} role="status">{message}</p>}
  </>
}
