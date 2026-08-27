import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nemo.store'

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/admin/', '/account/', '/orders/', '/wishlist/', '/cart', '/checkout', '/api/'] }, sitemap: `${siteUrl}/sitemap.xml` }
}
