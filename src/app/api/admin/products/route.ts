import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'
import { revalidateTag } from 'next/cache'

export const runtime = 'nodejs'

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function normalizeColor(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ')
}

function isValidColor(color: string) {
  return color.length > 0 && color.length <= 32 && /^[A-Za-z0-9][A-Za-z0-9 &'().\/-]*$/.test(color)
}

async function uniqueProductSlug(name: string) {
  const baseSlug = slugify(name) || 'product'
  const existing = await prisma.product.findUnique({ where: { slug: baseSlug }, select: { id: true } })
  return existing ? `${baseSlug}-${randomUUID().slice(0, 8)}` : baseSlug
}

function getCreateConflictMessage(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') return null
  const target = (Array.isArray(error.meta?.target) ? error.meta.target.join(' ') : String(error.meta?.target ?? '')).toLowerCase()
  if (target.includes('slug')) return 'A product with this URL already exists. Please try again.'
  if (target.includes('productid_color_size') || target.includes('sizestock')) return 'This color and size combination is duplicated.'
  if (target.includes('productid_size') || target.includes('measurement')) return 'This size has duplicate measurement rows.'
  if (target.includes('category')) return 'This category conflicts with an existing category. Please select it again.'
  return 'Product data contains a duplicate value. Please check the form.'
}

export async function POST(request: Request) {
  try {
    await requireAdmin()
  } catch {
    return Response.json({ error: 'Admin access is required.' }, { status: 403 })
  }

  const formData = await request.formData()
  const getText = (key: string) => {
    const value = formData.get(key)
    return typeof value === 'string' ? value : ''
  }
  const name = getText('name').trim()
  const category = getText('category').trim()
  const description = getText('description').trim()
  const price = Number(getText('price'))
  let variants: Array<{ color?: string; size?: string; quantity?: number }>
  try {
    variants = JSON.parse(getText('variants') || '[]') as Array<{ color?: string; size?: string; quantity?: number }>
  } catch {
    return Response.json({ error: 'Product variant data is invalid. Please try again.' }, { status: 400 })
  }
  let measurements: Array<{ size?: string; height?: number; width?: number; waist?: number; hip?: number }>
  try { measurements = JSON.parse(getText('measurements') || '[]') as Array<{ size?: string; height?: number; width?: number; waist?: number; hip?: number }> } catch {
    return Response.json({ error: 'Product measurement data is invalid. Please try again.' }, { status: 400 })
  }
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'] as const
  const viewOptions = ['Front', 'Back', 'Right', 'Left'] as const
  const validVariants = variants.map((variant) => ({ color: normalizeColor(variant.color), size: String(variant.size ?? ''), quantity: Number(variant.quantity) }))
  const validMeasurements = measurements.map((measurement) => ({ size: String(measurement.size ?? ''), height: Number(measurement.height), width: Number(measurement.width), waist: Number(measurement.waist), hip: Number(measurement.hip) })).filter((measurement) => measurement.size || Number.isFinite(measurement.height) || Number.isFinite(measurement.width) || Number.isFinite(measurement.waist) || Number.isFinite(measurement.hip))
  const variantKeys = validVariants.map((variant) => `${variant.color}:${variant.size}`)
  const measurementSizes = validMeasurements.map((measurement) => measurement.size)
  const stock = validVariants.reduce((total, variant) => total + variant.quantity, 0)
  const isTopCollection = getText('isTopCollection') === 'true'
  const topCollectionOrder = Number(getText('topCollectionOrder') || 0)
  const isNewArrival = getText('isNewArrival') === 'true'
  const newArrivalOrder = Number(getText('newArrivalOrder') || 0)
  const slug = await uniqueProductSlug(name)
  const categorySlug = slugify(category)
  const colors = [...new Set(validVariants.map((variant) => variant.color))]
  const filesByColor = new Map(colors.map((color) => [color, viewOptions.flatMap((view) => { const file = formData.get(`image-${color}-${view}`); return file instanceof File ? [{ file, view }] : [] })]))

  if (!name || !category || !slug || !categorySlug) return Response.json({ error: 'Product name and category are required.' }, { status: 400 })
  if (!Number.isFinite(price) || price < 0) return Response.json({ error: 'Enter a valid product price.' }, { status: 400 })
  if (!validVariants.length || validVariants.some((variant) => !isValidColor(variant.color) || !sizes.includes(variant.size as typeof sizes[number]) || !Number.isInteger(variant.quantity) || variant.quantity < 0)) return Response.json({ error: 'Add a valid color and stock quantity for at least one size.' }, { status: 400 })
  if (new Set(variantKeys).size !== variantKeys.length) return Response.json({ error: 'Each color and size combination can only be added once.' }, { status: 400 })
  if (validMeasurements.some((measurement) => !sizes.includes(measurement.size as typeof sizes[number]) || [measurement.height, measurement.width, measurement.waist, measurement.hip].some((value) => Number.isFinite(value) && value < 0))) return Response.json({ error: 'Enter valid non-negative measurements.' }, { status: 400 })
  if (new Set(measurementSizes).size !== measurementSizes.length) return Response.json({ error: 'Each size can only have one measurement row.' }, { status: 400 })
  if (colors.some((color) => (filesByColor.get(color) ?? []).length === 0)) return Response.json({ error: 'Add at least one image for every selected color.' }, { status: 400 })
  if ([...filesByColor.values()].some((files) => files.some(({ file }) => !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024))) return Response.json({ error: 'Every image must be under 5 MB and use an image format.' }, { status: 400 })
  if (!Number.isInteger(topCollectionOrder) || topCollectionOrder < 0 || !Number.isInteger(newArrivalOrder) || newArrivalOrder < 0) return Response.json({ error: 'Homepage order must be a whole number of 0 or higher.' }, { status: 400 })

  const admin = createAdminClient()
  const { error: bucketError } = await admin.storage.createBucket('product-images', { public: true })
  if (bucketError && !bucketError.message.toLowerCase().includes('already exists')) return Response.json({ error: `Image storage could not be prepared: ${bucketError.message}` }, { status: 500 })

  let createdProductId = ''
  const uploadedPaths: string[] = []
  try {
    // The form submits the category slug. Keep accepting a category name for
    // older clients, but always connect to the existing category first. This
    // avoids creating a duplicate name such as "Hoodies" when its slug is
    // "hoodie".
    const categoryRecord = await prisma.category.findUnique({ where: { slug: category } })
      ?? await prisma.category.findUnique({ where: { name: category } })
      ?? await prisma.category.create({ data: { name: category, slug: categorySlug } })
    const product = await prisma.product.create({
      data: {
        name, slug, description: description || null, price, stock, imageUrl: null,
        isTopCollection, topCollectionOrder, isNewArrival, newArrivalOrder,
        sizeStocks: { create: validVariants.map((variant) => ({ color: variant.color, size: variant.size as typeof sizes[number], quantity: variant.quantity })) },
        sizeMeasurements: { create: validMeasurements.map((measurement) => ({ size: measurement.size as typeof sizes[number], height: Number.isFinite(measurement.height) ? measurement.height : null, width: Number.isFinite(measurement.width) ? measurement.width : null, waist: Number.isFinite(measurement.waist) ? measurement.waist : null, hip: Number.isFinite(measurement.hip) ? measurement.hip : null })) },
        category: { connect: { id: categoryRecord.id } },
      },
    })
    createdProductId = product.id
    const uploadedImages: { color: string; view: string; url: string; sortOrder: number }[] = []
    for (const color of colors) {
      const files = filesByColor.get(color) ?? []
      for (let index = 0; index < files.length; index += 1) {
        const { file, view } = files[index]
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `${product.id}/${slugify(color)}-${view.toLowerCase()}-${Date.now()}.${extension}`
        const { error: uploadError } = await admin.storage.from('product-images').upload(path, file, { cacheControl: '3600', contentType: file.type, upsert: false })
        if (uploadError) throw new Error(uploadError.message)
        uploadedPaths.push(path)
        const { data } = admin.storage.from('product-images').getPublicUrl(path)
        uploadedImages.push({ color, view, url: data.publicUrl, sortOrder: index })
      }
    }
    await prisma.productImage.createMany({ data: uploadedImages.map((image) => ({ productId: product.id, ...image })) })
    await prisma.product.update({ where: { id: product.id }, data: { imageUrl: uploadedImages[0]?.url ?? null } })
    revalidateTag('homepage-products', 'max')
    return Response.json({ id: product.id }, { status: 201 })
  } catch (error) {
    if (createdProductId) await prisma.product.delete({ where: { id: createdProductId } }).catch(() => undefined)
    if (uploadedPaths.length > 0) await admin.storage.from('product-images').remove(uploadedPaths).catch(() => undefined)
    const conflictMessage = getCreateConflictMessage(error)
    const detail = process.env.NODE_ENV !== 'production' && error instanceof Error ? ` ${error.message}` : ''
    return Response.json({ error: conflictMessage || `Product could not be created.${detail}` }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  let admin: Awaited<ReturnType<typeof requireAdmin>>
  try { admin = await requireAdmin() } catch { return Response.json({ error: 'Admin access is required.' }, { status: 403 }) }
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const productId = typeof body?.id === 'string' ? body.id : ''
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const categoryName = typeof body?.categoryName === 'string' ? body.categoryName.trim() : ''
  const price = Number(body?.price)
  const stock = Number(body?.stock)
  const variants = Array.isArray(body?.variants) ? body.variants as Array<{ color?: unknown; size?: unknown; quantity?: unknown }> : null
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'] as const
  if (!productId || !name || !categoryName) return Response.json({ error: 'Name and category are required.' }, { status: 400 })
  if (!Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) return Response.json({ error: 'Enter valid price and stock values.' }, { status: 400 })
  if (variants && variants.some((variant) => !isValidColor(normalizeColor(variant.color)) || !sizes.includes(String(variant.size) as typeof sizes[number]) || !Number.isInteger(Number(variant.quantity)) || Number(variant.quantity) < 0)) return Response.json({ error: 'Enter valid color and size stock quantities.' }, { status: 400 })
  try {
    const updated = await prisma.$transaction(async (transaction) => {
      const current = variants ? await transaction.product.findUnique({ where: { id: productId }, include: { sizeStocks: true } }) : null
      if (variants && !current) throw new Error('PRODUCT_NOT_FOUND')
      if (variants) {
        for (const variant of variants) {
          const color = normalizeColor(variant.color)
          const size = String(variant.size) as typeof sizes[number]
          const quantity = Number(variant.quantity)
          const before = current!.sizeStocks.find((stockItem) => stockItem.color === color && stockItem.size === size)?.quantity ?? 0
          await transaction.productSizeStock.upsert({ where: { productId_color_size: { productId, color, size } }, update: { quantity }, create: { productId, color, size, quantity } })
          if (quantity !== before) await transaction.inventoryAdjustment.create({ data: { productId, color, size, quantityChange: quantity - before, quantityAfter: quantity, reason: 'Admin stock edit', actorEmail: admin?.email ?? null } })
        }
      }
      return transaction.product.update({ where: { id: productId }, data: { name, description: typeof body?.description === 'string' ? body.description.trim() || null : null, price, stock: variants ? variants.reduce((sum, variant) => sum + Number(variant.quantity), 0) : stock, category: { connectOrCreate: { where: { slug: slugify(categoryName) }, create: { name: categoryName, slug: slugify(categoryName) } } } } })
    })
    revalidateTag('homepage-products', 'max')
    return Response.json({ id: updated.id })
  } catch (error) {
    const isDuplicate = error instanceof Error && error.message.includes('Unique constraint')
    return Response.json({ error: isDuplicate ? 'A product with this name already exists.' : 'Product could not be updated.' }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  try { await requireAdmin() } catch { return Response.json({ error: 'Admin access is required.' }, { status: 403 }) }
  const body = await request.json().catch(() => null) as { productId?: unknown } | null
  const productId = typeof body?.productId === 'string' ? body.productId : ''
  if (!productId) return Response.json({ error: 'Product ID is required.' }, { status: 400 })
  try {
    await prisma.product.delete({ where: { id: productId } })
    revalidateTag('homepage-products', 'max')
    return Response.json({ deleted: true })
  } catch {
    return Response.json({ error: 'This product cannot be deleted because it is referenced by an order, cart, or review.' }, { status: 409 })
  }
}
