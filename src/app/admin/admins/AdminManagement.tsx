'use client'

import { FormEvent, useEffect, useState } from 'react'
import styles from '../admin.module.css'

type Admin = { id: string; email: string; name: string; createdAt: string; protected: boolean }

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchAdmins() {
      const response = await fetch('/api/admin/admins')
      const data = await response.json()
      if (cancelled) return
      if (response.ok) setAdmins(data.admins)
      else setError(data.error ?? 'Unable to load admins.')
      setLoading(false)
    }
    void fetchAdmins()
    return () => { cancelled = true }
  }, [])

  async function addAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage(''); setSaving(true)
    const response = await fetch('/api/admin/admins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) })
    const data = await response.json()
    if (!response.ok) setError(data.error ?? 'Unable to create admin.')
    else { setAdmins((current) => [...current, data.admin]); setName(''); setEmail(''); setPassword(''); setMessage('Admin account created.') }
    setSaving(false)
  }

  async function removeAdmin(admin: Admin) {
    if (!window.confirm(`Remove admin access from ${admin.email}?`)) return
    setError(''); setMessage('')
    const response = await fetch('/api/admin/admins', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: admin.id }) })
    const data = await response.json()
    if (!response.ok) setError(data.error ?? 'Unable to remove admin access.')
    else { setAdmins((current) => current.filter((item) => item.id !== admin.id)); setMessage('Admin access removed.') }
  }

  return <div className={styles.adminManagement}>
    <section className={styles.panel}><h2>Add administrator</h2><form className={styles.formGrid} onSubmit={addAdmin}><label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Optional" /></label><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required /></label><button className={styles.saveButton} type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add admin'}</button></form></section>
    {(error || message) && <p className={error ? styles.formError : styles.curationMessage} role="alert">{error || message}</p>}
    <section className={styles.panel}><div className={styles.panelHeader}><h2>Administrators</h2><span>{admins.length} accounts</span></div>{loading ? <p className={styles.empty}>Loading administrators…</p> : admins.length === 0 ? <p className={styles.empty}>No administrator accounts found.</p> : <div className={styles.adminList}>{admins.map((admin) => <div className={styles.adminRow} key={admin.id}><div><strong>{admin.name || admin.email}</strong>{admin.name && <span className={styles.muted}>{admin.email}</span>}<small>Added {new Date(admin.createdAt).toLocaleDateString('en-GB')}</small></div>{admin.protected ? <span className={styles.protectedLabel}>Owner</span> : <button className={styles.deleteButton} type="button" onClick={() => void removeAdmin(admin)}>Remove access</button>}</div>)}</div>}</section>
  </div>
}
