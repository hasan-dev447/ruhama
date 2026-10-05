import type { MetadataRoute } from 'next'

import { absoluteUrl } from '@/lib/utils'

export default function robots(): MetadataRoute.Robots {
  const production = process.env.VERCEL_ENV
    ? process.env.VERCEL_ENV === 'production'
    : process.env.NODE_ENV === 'production'
  if (!production) return { rules: [{ userAgent: '*', disallow: '/' }] }
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/dashboard',
          '/settings',
          '/notifications',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/search?',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  }
}
