import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function uploadCategoryImage(file: File, slug: string) {
  const admin = createAdminClient()
  const { error: bucketError } = await admin.storage.createBucket('category-images', { public: true })
  if (bucketError && !bucketError.message.toLowerCase().includes('already exists')) throw new Error(bucketError.message)
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${slug}-${Date.now()}.${extension}`
  const { error: uploadError } = await admin.storage.from('category-images').upload(path, file, { cacheControl: '3600', contentType: file.type, upsert: true })
  if (uploadError) throw new Error(uploadError.message)
  return admin.storage.from('category-images').getPublicUrl(path).data.publicUrl
}

export async function POST(request: Request) {
  try { await requireAdmin() } catch { return Response.json({ error: 'Admin access is required.' }, { status: 403 }) }
  const formData = await request.formData()
  const name = typeof formData.get('name') === 'string' ? String(formData.get('name')).trim() : ''
  const slug = slugify(typeof formData.get('slug') === 'string' ? String(formData.get('slug')) : name)
  const description = typeof formData.get('description') === 'string' ? String(formData.get('description')).trim() : ''
  const file = formData.get('image')
  if (!name || !slug) return Response.json({ error: 'Category name is required.' }, { status: 400 })
  if (file instanceof File && file.size > 0 && (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024)) return Response.json({ error: 'Category image must be under 5 MB and use an image format.' }, { status: 400 })
  try {
    const imageUrl = file instanceof File && file.size > 0 ? await uploadCategoryImage(file, slug) : null
    const category = await prisma.category.create({ data: { name, slug, description: description || null, imageUrl } })
    return Response.json({ category }, { status: 201 })
  } catch (error) {
    const duplicate = error instanceof Error && error.message.includes('Unique constraint')
    const detail = process.env.NODE_ENV !== 'production' && error instanceof Error ? ` ${error.message}` : ''
    return Response.json({ error: duplicate ? 'A category with this name or slug already exists.' : `Category could not be created.${detail}` }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  try { await requireAdmin() } catch { return Response.json({ error: 'Admin access is required.' }, { status: 403 }) }

  const formData = await request.formData()
  const categoryId = typeof formData.get('id') === 'string' ? String(formData.get('id')) : ''
  const nameValue = formData.get('name')
  const slugValue = formData.get('slug')
  const description = typeof formData.get('description') === 'string' ? String(formData.get('description')).trim() : ''
  const file = formData.get('image')
  if (!categoryId) return Response.json({ error: 'Category ID is required.' }, { status: 400 })
  if (file instanceof File && (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024)) {
    return Response.json({ error: 'Category image must be under 5 MB and use an image format.' }, { status: 400 })
  }

  try {
    const category = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!category) return Response.json({ error: 'Category not found.' }, { status: 404 })
    const name = typeof nameValue === 'string' ? nameValue.trim() : category.name
    const slug = slugify(typeof slugValue === 'string' && slugValue.trim() ? slugValue : category.slug)
    if (!name || !slug) return Response.json({ error: 'Category name and slug are required.' }, { status: 400 })

    let imageUrl = category.imageUrl
    if (file instanceof File && file.size > 0) {
      imageUrl = await uploadCategoryImage(file, category.slug)
    }

    const updated = await prisma.category.update({ where: { id: categoryId }, data: { name, slug, description: description || null, imageUrl } })
    return Response.json({ category: updated })
  } catch (error) {
    const detail = process.env.NODE_ENV !== 'production' && error instanceof Error ? ` ${error.message}` : ''
    return Response.json({ error: `Category could not be updated.${detail}` }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  try { await requireAdmin() } catch { return Response.json({ error: 'Admin access is required.' }, { status: 403 }) }
  const body = await request.json().catch(() => null) as { id?: unknown } | null
  const categoryId = typeof body?.id === 'string' ? body.id : ''
  if (!categoryId) return Response.json({ error: 'Category ID is required.' }, { status: 400 })
  try {
    const category = await prisma.category.findUnique({ where: { id: categoryId }, include: { _count: { select: { products: true } } } })
    if (!category) return Response.json({ error: 'Category not found.' }, { status: 404 })
    if (category._count.products > 0) return Response.json({ error: 'This category has products. Move or delete those products before deleting the category.' }, { status: 409 })
    await prisma.category.delete({ where: { id: categoryId } })
    return Response.json({ deleted: true })
  } catch {
    return Response.json({ error: 'Category could not be deleted.' }, { status: 400 })
  }
}
