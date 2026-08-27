import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

function configuredAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean)
}

export async function GET() {
  try {
    await requireAdmin()
    const supabase = createAdminClient()
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (error) return Response.json({ error: error.message }, { status: 500 })

    const configured = configuredAdminEmails()
    const admins = data.users
      .filter((user) => user.app_metadata?.role === 'admin' || (user.email && configured.includes(user.email.toLowerCase())))
      .map((user) => ({
        id: user.id,
        email: user.email ?? '',
        name: user.user_metadata?.name ?? '',
        createdAt: user.created_at,
        protected: Boolean(user.email && configured.includes(user.email.toLowerCase())),
      }))
    return Response.json({ admins })
  } catch {
    return Response.json({ error: 'Unauthorized.' }, { status: 403 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const body = await request.json() as { email?: string; password?: string; name?: string }
    const email = body.email?.trim().toLowerCase()
    const password = body.password ?? ''
    const name = body.name?.trim() ?? ''
    if (!email || !email.includes('@')) return Response.json({ error: 'Enter a valid email address.' }, { status: 400 })
    if (password.length < 6) return Response.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })

    const supabase = createAdminClient()
    const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name }, app_metadata: { role: 'admin' } })
    if (error) return Response.json({ error: error.message }, { status: 400 })
    return Response.json({ admin: { id: data.user.id, email: data.user.email, name, createdAt: data.user.created_at, protected: false } }, { status: 201 })
  } catch {
    return Response.json({ error: 'Unable to create admin.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const currentAdmin = await requireAdmin()
    if (!currentAdmin) return Response.json({ error: 'Unauthorized.' }, { status: 403 })
    const body = await request.json() as { userId?: string }
    if (!body.userId || body.userId === currentAdmin.id) return Response.json({ error: 'You cannot remove your own admin access.' }, { status: 400 })

    const supabase = createAdminClient()
    const { data: target, error: getError } = await supabase.auth.admin.getUserById(body.userId)
    if (getError || !target.user) return Response.json({ error: 'Admin account not found.' }, { status: 404 })
    const email = target.user.email?.toLowerCase() ?? ''
    if (configuredAdminEmails().includes(email)) return Response.json({ error: 'The configured owner admin cannot be removed here.' }, { status: 400 })

    const { error } = await supabase.auth.admin.updateUserById(body.userId, { app_metadata: { ...target.user.app_metadata, role: 'user' } })
    if (error) return Response.json({ error: error.message }, { status: 400 })
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Unable to remove admin access.' }, { status: 500 })
  }
}
