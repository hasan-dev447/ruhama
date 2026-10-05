import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { DocumentPage } from '@/components/content/document-page'
import { JsonLd } from '@/components/seo/json-ld'
import { formatDate } from '@/lib/format'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'
import { data } from '@/server/data'

/** Pages edited in the CMS "পাতা" collection (privacy, terms, sources). */
export async function cmsPageMetadata(slug: string): Promise<Metadata> {
  const page = await data.page(slug)
  if (!page)
    return buildMetadata({ title: 'পাতাটি পাওয়া যায়নি', path: `/${slug}`, noIndex: true })
  return buildMetadata({
    title: page.meta?.title || page.title,
    description: page.meta?.description || page.lead || undefined,
    path: `/${slug}`,
  })
}

export async function CmsPage({ slug }: { slug: string }) {
  const page = await data.page(slug)
  if (!page) notFound()
  return (
    <>
      <DocumentPage
        crumbs={[{ label: 'হোম', href: '/' }, { label: page.title }]}
        title={page.title}
        lead={page.lead}
        content={page.content}
        meta={<span>সর্বশেষ হালনাগাদ: {formatDate(page.updatedAt)}</span>}
      />
      <JsonLd
        data={breadcrumbLd([
          { name: 'হোম', path: '/' },
          { name: page.title, path: `/${slug}` },
        ])}
      />
    </>
  )
}
