import type { MetadataRoute } from 'next'

import { SITE } from '@/lib/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} · ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.description,
    lang: 'bn',
    dir: 'ltr',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FAF7F0',
    theme_color: '#0E4D45',
    categories: ['education', 'books', 'lifestyle'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    shortcuts: [
      { name: 'ইলম কেন্দ্র', url: '/ilm' },
      { name: 'প্রশ্নোত্তর', url: '/qa' },
      { name: 'মজলিস', url: '/events' },
      { name: 'ড্যাশবোর্ড', url: '/dashboard' },
    ],
  }
}
