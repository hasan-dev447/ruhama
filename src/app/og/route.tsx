import type { NextRequest } from 'next/server'

import { SITE } from '@/lib/site'
import { renderOgImage } from '@/server/og/render'

export const runtime = 'nodejs'

/**
 * Open Graph card, e.g. /og?title=…&kicker=… (1200×630 PNG).
 * Text goes through Pango (via sharp) so Bangla conjuncts are shaped correctly.
 */
export async function GET(req: NextRequest) {
  const title = (req.nextUrl.searchParams.get('title') || SITE.tagline).slice(0, 140)
  const kicker = (req.nextUrl.searchParams.get('kicker') || '').slice(0, 60)
  const png = await renderOgImage({ title, kicker })
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable',
    },
  })
}
