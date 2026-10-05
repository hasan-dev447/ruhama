import { absoluteUrl } from '@/lib/utils'
import { SITEMAP_TYPES } from '@/server/queries/sitemap'

export const revalidate = 86400

/** Sitemap index: one child sitemap per content type. */
export function GET() {
  const now = new Date().toISOString()
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITEMAP_TYPES.map((t) => `  <sitemap><loc>${absoluteUrl(`/sitemaps/${t}.xml`)}</loc><lastmod>${now}</lastmod></sitemap>`).join('\n')}
</sitemapindex>`
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
