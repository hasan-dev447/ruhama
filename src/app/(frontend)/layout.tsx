import type { Metadata, Viewport } from 'next'

import '@/styles/globals.css'

import { AppProviders } from '@/components/providers/app-providers'
import { fontVariables } from '@/lib/fonts'
import { SITE } from '@/lib/site'
import { absoluteUrl } from '@/lib/utils'

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl('/')),
  title: { default: `${SITE.name} · ${SITE.tagline}`, template: `%s` },
  description: SITE.description,
  applicationName: SITE.name,
  manifest: '/manifest.webmanifest',
  formatDetection: { telephone: false, email: false, address: false },
  appleWebApp: { capable: true, title: SITE.name, statusBarStyle: 'default' },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF7F0' },
    { media: '(prefers-color-scheme: dark)', color: '#0C1614' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" dir="ltr" className={`rh ${fontVariables}`} suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main">
          মূল বিষয়বস্তুতে যান
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
