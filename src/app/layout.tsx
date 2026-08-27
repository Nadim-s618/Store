import type { Metadata } from 'next'
import Navbar from '../components/Navbar'
import './mobile-safety.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://nemo.store'),
  title: { default: 'NEMO — Considered clothing', template: '%s | NEMO' },
  description: 'Considered everyday clothing, made to stay in rotation.',
  applicationName: 'NEMO',
  keywords: ['clothing', 'everyday wear', 'NEMO clothing'],
  openGraph: { type: 'website', siteName: 'NEMO', title: 'NEMO — Considered clothing', description: 'Considered everyday clothing, made to stay in rotation.', images: [{ url: '/feature.webp', width: 1200, height: 630, alt: 'NEMO clothing' }] },
  twitter: { card: 'summary_large_image', title: 'NEMO — Considered clothing', description: 'Considered everyday clothing, made to stay in rotation.', images: ['/feature.webp'] },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
