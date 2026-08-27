'use client'

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/browser'
import SignOutButton from '@/components/SignOutButton'
import styles from './account.module.css'

type Profile = { name: string; email: string; phone: string; address: string; avatarUrl: string }
const emptyProfile: Profile = { name: '', email: '', phone: '', address: '', avatarUrl: '' }

export default function AccountPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    let isActive = true

    async function loadProfile() {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (!isActive) return
      if (userError || !user) {
        router.replace('/login?message=Please log in to view your account.')
        return
      }
      const metadata = user.user_metadata ?? {}
      setProfile({
        name: typeof metadata.name === 'string' ? metadata.name : '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        address: typeof metadata.address === 'string' ? metadata.address : '',
        avatarUrl: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : '',
      })
      setIsLoading(false)
    }

    void loadProfile()
    return () => { isActive = false }
  }, [router])

  function updateField(field: keyof Profile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }))
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    setMessage('')
    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Profile photos must be smaller than 5 MB.'); return }

    setAvatarPreview(URL.createObjectURL(file))
    setIsUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Your session has expired. Please log in again.')
      setIsUploading(false)
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    const bucketResponse = await fetch('/api/account/avatar-bucket', { method: 'POST', body: formData })
    if (!bucketResponse.ok) {
      const bucketError = await bucketResponse.json().catch(() => null) as { error?: string } | null
      setError(`Photo upload failed: ${bucketError?.error || 'Unable to prepare photo storage.'}`)
      setIsUploading(false)
      return
    }

    const uploadResult = await bucketResponse.json() as { publicUrl?: string }
    if (!uploadResult.publicUrl) {
      setError('Photo upload failed: no public image URL was returned.')
      setIsUploading(false)
      return
    }
    updateField('avatarUrl', uploadResult.publicUrl)
    setMessage('Profile photo uploaded. Save your profile to keep it.')
    setIsUploading(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (newPassword && newPassword !== confirmPassword) { setError('New passwords do not match.'); return }
    if (newPassword && newPassword.length < 6) { setError('New password must be at least 6 characters.'); return }

    setIsSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Your session has expired. Please log in again.')
      setIsSaving(false)
      return
    }

    const attributes: Parameters<typeof supabase.auth.updateUser>[0] = {
      data: { ...user.user_metadata, name: profile.name, address: profile.address, avatar_url: profile.avatarUrl },
    }
    if (profile.email !== user.email) attributes.email = profile.email
    if (profile.phone !== user.phone) attributes.phone = profile.phone || undefined
    if (newPassword) attributes.password = newPassword

    const { error: updateError } = await supabase.auth.updateUser(attributes)
    if (updateError) {
      setError(updateError.message)
      setIsSaving(false)
      return
    }
    setNewPassword('')
    setConfirmPassword('')
    setMessage(profile.email !== user.email ? 'Profile saved. Check your new email address to confirm the change.' : 'Profile saved successfully.')
    setIsSaving(false)
  }

  if (isLoading) return <main className={styles.page}><p className={styles.loading}>Loading your account…</p></main>

  const initials = profile.name.trim()
    ? profile.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    : profile.email.slice(0, 1).toUpperCase()

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.heading}>
          <p className={styles.kicker}>Your account</p>
          <h1>Make it yours.</h1>
          <p>Keep your details current for a more personal NEMO experience.</p>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.profileHeader}>
            <div className={styles.avatar}>{(avatarPreview || profile.avatarUrl) ? <Image src={avatarPreview || profile.avatarUrl} alt="Profile" fill sizes="96px" unoptimized /> : <span>{initials}</span>}</div>
            <div>
              <h2>Profile photo</h2>
              <p>JPG, PNG, or WEBP. Maximum 5 MB.</p>
              <input ref={fileInputRef} className={styles.fileInput} type="file" accept="image/*" onChange={handleAvatarChange} />
              <button type="button" className={styles.photoButton} onClick={() => fileInputRef.current?.click()} disabled={isUploading}>{isUploading ? 'Uploading…' : 'Choose a photo'}</button>
            </div>
          </div>
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Personal details</p>
            <div className={styles.fieldGrid}>
              <label>Full name<input value={profile.name} onChange={(event) => updateField('name', event.target.value)} required autoComplete="name" /></label>
              <label>Email address<input type="email" value={profile.email} onChange={(event) => updateField('email', event.target.value)} required autoComplete="email" /></label>
              <label>Phone number<input type="tel" value={profile.phone} onChange={(event) => updateField('phone', event.target.value)} autoComplete="tel" /></label>
              <label className={styles.fullWidth}>Address<textarea value={profile.address} onChange={(event) => updateField('address', event.target.value)} rows={3} autoComplete="street-address" /></label>
            </div>
          </div>
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Change password</p>
            <div className={styles.fieldGrid}>
              <label>New password<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={6} autoComplete="new-password" /></label>
              <label>Confirm new password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={6} autoComplete="new-password" /></label>
            </div>
            <p className={styles.hint}>Leave both fields blank to keep your current password.</p>
          </div>
          {(error || message) && <p className={error ? styles.error : styles.message} role="alert">{error || message}</p>}
          <div className={styles.actions}>
            <SignOutButton className={styles.signOut} />
            <button type="button" className={styles.cancel} onClick={() => router.push('/')}>Back to shop</button>
            <button type="submit" className={styles.submit} disabled={isSaving || isUploading}>{isSaving ? 'Saving…' : 'Save changes'} <span>↗</span></button>
          </div>
        </form>
      </section>
    </main>
  )
}
