'use client'

import { ReactNode, useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/browser'

export default function SignOutButton({ className, children, ariaLabel = 'Sign out' }: { className?: string; children?: ReactNode; ariaLabel?: string }) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleSignOut() {
    setIsSigningOut(true)
    const { error } = await createClient().auth.signOut()
    if (error) {
      setIsSigningOut(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return <button type="button" className={className} onClick={handleSignOut} disabled={isSigningOut} aria-label={ariaLabel} title={ariaLabel}>{isSigningOut ? '…' : children ?? 'Sign out'}</button>
}
