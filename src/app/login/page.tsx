'use client'

import Link from 'next/link'
import { FormEvent, Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { createClient } from '@/lib/supabase/browser'
import styles from './login.module.css'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(() => searchParams.get('message') ?? '')
  const [canResendConfirmation, setCanResendConfirmation] = useState(false)
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setIsLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const isEmailNotConfirmed = error.code === 'email_not_confirmed'
        || error.message.toLowerCase().includes('email not confirmed')

      setCanResendConfirmation(isEmailNotConfirmed)
      setMessage(isEmailNotConfirmed
        ? 'Please confirm your email address before logging in.'
        : error.message)
      setIsLoading(false)
      return
    }

    setCanResendConfirmation(false)
    router.push('/account')
    router.refresh()
  }

  async function resendConfirmationEmail() {
    if (!email) {
      setMessage('Enter your email address first.')
      return
    }

    setIsResendingConfirmation(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email })

    setMessage(error
      ? error.message
      : 'A new confirmation email has been sent. Check your inbox.')
    setIsResendingConfirmation(false)
  }

  async function handleSocialLogin(provider: 'google' | 'apple') {
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
          <p className={styles.kicker}>Welcome back</p>
          <h1>Good to see you again.</h1>
          <p>Sign in to pick up where you left off and keep your everyday edit close.</p>
        </div>

        <div className={styles.formArea}>
          <div className={styles.socials}>
            <button type="button" onClick={() => handleSocialLogin('google')}>Continue with Google</button>
            <button type="button" onClick={() => handleSocialLogin('apple')}>Continue with Apple</button>
          </div>

          <div className={styles.divider}><span>or log in with email</span></div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
            <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>
            <div className={styles.formMeta}><Link href="/login">Forgot password?</Link></div>
            {message && <p className={styles.message} role="alert">{message}</p>}
            {canResendConfirmation && <button type="button" className={styles.resend} onClick={resendConfirmationEmail} disabled={isResendingConfirmation}>{isResendingConfirmation ? 'Sending…' : 'Resend confirmation email'}</button>}
            <button type="submit" className={styles.submit} disabled={isLoading}>{isLoading ? 'Signing in…' : 'Log in'} <span>↗</span></button>
          </form>

          <p className={styles.signupPrompt}>New to NEMO? <Link href="/signup">Create an account</Link></p>
        </div>
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
