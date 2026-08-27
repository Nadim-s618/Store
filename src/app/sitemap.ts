import type { MetadataRoute } from 'next'
import { getShopCategories, getProducts } from '@/services/product.service'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nemo.store'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getProducts(), getShopCategories()])
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/shop`, changeFrequency: 'daily', priority: .9 },
    { url: `${siteUrl}/story`, changeFrequency: 'monthly', priority: .6 },
  ]
  const categoryPages = categories.map((category) => ({ url: `${siteUrl}/shop/category/${category.slug}`, changeFrequency: 'weekly' as const, priority: .7 }))
  const productPages = products.map((product) => ({ url: `${siteUrl}/product/${product.slug}`, lastModified: product.updatedAt, changeFrequency: 'weekly' as const, priority: .8 }))
  return [...staticPages, ...categoryPages, ...productPages]
}
