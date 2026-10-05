import { unstable_cache } from 'next/cache'

import { absoluteUrl } from '@/lib/utils'
import { TAGS } from '@/server/cache/tags'
import { getPayloadClient } from '@/server/payload'
import { SITEMAP_TYPES, sitemapEntries, type SitemapType } from '@/server/queries/sitemap'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const entries = (type: SitemapType) =>
  unstable_cache(async () => sitemapEntries(await getPayloadClient(), type), ['sitemap', type], {
    tags: [TAGS.sitemap],
    revalidate: 86400,
  })()

export function generateStaticParams() {
  return SITEMAP_TYPES.map((type) => ({ type: `${type}.xml` }))
}

/** `/sitemaps/articles.xml` and friends. Refreshed whenever published content changes. */
export async function GET(_req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type: file } = await params
  const type = file.replace(/\.xml$/, '') as SitemapType
  if (!SITEMAP_TYPES.includes(type)) return new Response('Not found', { status: 404 })
  let list: Awaited<ReturnType<typeof sitemapEntries>> = []
  try {
    list = await entries(type)
  } catch {
    // database unavailable during a static build; the route regenerates on first request
    list = []
  }
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${list
  .map(
    (e) =>
      `  <url><loc>${esc(absoluteUrl(e.path))}</loc>${e.lastModified ? `<lastmod>${new Date(e.lastModified).toISOString()}</lastmod>` : ''}${e.changeFrequency ? `<changefreq>${e.changeFrequency}</changefreq>` : ''}${e.priority ? `<priority>${e.priority.toFixed(1)}</priority>` : ''}</url>`,
  )
  .join('\n')}
</urlset>`
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
