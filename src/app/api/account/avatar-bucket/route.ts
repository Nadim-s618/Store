import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) return Response.json({ error: 'No image was provided.' }, { status: 400 })
  if (!file.type.startsWith('image/')) return Response.json({ error: 'Please choose an image file.' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return Response.json({ error: 'Profile photos must be smaller than 5 MB.' }, { status: 400 })

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is missing on the server.' }, { status: 500 })
  }

  const admin = createAdminClient()
  const { error: createError } = await admin.storage.createBucket('avatars', { public: true })
  if (createError && !createError.message.toLowerCase().includes('already exists')) {
    return Response.json({ error: `Could not create the avatars storage bucket: ${createError.message}` }, { status: 500 })
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${user.id}/profile-${Date.now()}.${extension}`
  const { error: uploadError } = await admin.storage.from('avatars').upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) return Response.json({ error: `Could not upload to the avatars storage bucket: ${uploadError.message}` }, { status: 500 })

  const { data } = admin.storage.from('avatars').getPublicUrl(path)
  return Response.json({ publicUrl: data.publicUrl })
}
