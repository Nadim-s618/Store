'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/browser'
import styles from './signup.module.css'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }
    if (!acceptedTerms) {
      setMessage('Please accept the terms to continue.')
      return
    }

    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (error) {
      setMessage(error.message)
      setIsLoading(false)
      return
    }

    router.push('/login?message=Check your email to confirm your account.')
  }

  async function handleSocialSignup(provider: 'google' | 'apple') {
    setMessage('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setMessage(error.message)
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.intro}>
          <p className={styles.kicker}>Welcome to NEMO</p>
          <h1>Create your account.</h1>
          <p>Join us for considered pieces, early access, and a wardrobe made to last.</p>
        </div>

        <div className={styles.formArea}>
          <div className={styles.socials}>
            <button type="button" onClick={() => handleSocialSignup('google')}>Continue with Google</button>
            <button type="button" onClick={() => handleSocialSignup('apple')}>Continue with Apple</button>
          </div>

          <div className={styles.divider}><span>or sign up with email</span></div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" /></label>
            <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
            <div className={styles.fieldRow}>
              <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete="new-password" /></label>
              <label>Confirm password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={6} autoComplete="new-password" /></label>
            </div>
            <label className={styles.checkbox}><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} /><span>I agree to the terms and privacy policy.</span></label>
            {message && <p className={styles.message} role="alert">{message}</p>}
            <button type="submit" className={styles.submit} disabled={isLoading}>{isLoading ? 'Creating account…' : 'Create account'} <span>↗</span></button>
          </form>

          <p className={styles.loginPrompt}>Already have an account? <Link href="/login">Log in</Link></p>
        </div>
      </section>
    </main>
  )
}
