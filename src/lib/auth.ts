import { createClient } from '@/lib/supabase/server'

type AuthUser = Awaited<ReturnType<typeof getCurrentUser>>

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export function isAdminUser(user: AuthUser) {
  const configuredAdminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
  const hasAdminRole = user?.app_metadata?.role === 'admin'
  const isConfiguredAdmin = user?.email && configuredAdminEmails.includes(user.email.toLowerCase())

  return Boolean(user && (hasAdminRole || isConfiguredAdmin))
}

export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!isAdminUser(user)) {
    throw new Error('Unauthorized')
  }
  return user
}
