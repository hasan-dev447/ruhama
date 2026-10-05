import { BadgeCheck, BookOpen } from 'lucide-react'
import type { Metadata } from 'next'
import { Suspense } from 'react'

import { JsonLd } from '@/components/seo/json-ld'
import { ArticleBrowser, ArticleGridSkeleton } from '@/components/lists/article-browser'
import { PageHero } from '@/components/ui/primitives'
import { bn } from '@/lib/format'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'
import { data } from '@/server/data'

export const revalidate = 86400

const DESCRIPTION =
  'প্রতিটি লেখা দলিলসহ এবং আলিমদের রিভিউ শেষে প্রকাশিত। নিজের স্তর অনুযায়ী বিষয় বেছে নিন।'

export const metadata: Metadata = buildMetadata({
  title: 'ইলম কেন্দ্র',
  description: DESCRIPTION,
  path: '/ilm',
})

export default async function IlmCenterPage() {
  const [initial, categories, total] = await Promise.all([
    data.articles({ limit: 12 }),
    data.categories('articles'),
    data.articleCount(),
  ])

  return (
    <main id="main">
      <PageHero
        crumbs={[{ label: 'হোম', href: '/' }, { label: 'ইলম কেন্দ্র' }]}
        title="ইলম কেন্দ্র"
        lead={DESCRIPTION}
        id="ilm-title"
        aside={
          <div className="stat-line">
            <span>
              <BookOpen className="ic" aria-hidden="true" />
              {bn(total)}টি প্রবন্ধ
            </span>
            <span>
              <BadgeCheck className="ic" aria-hidden="true" />
              সবগুলো রিভিউকৃত
            </span>
          </div>
        }
      />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="rh-container">
          <Suspense fallback={<ArticleGridSkeleton />}>
            <ArticleBrowser initial={initial} categories={categories} />
          </Suspense>
        </div>
      </section>
      <JsonLd
        data={breadcrumbLd([
          { name: 'হোম', path: '/' },
          { name: 'ইলম কেন্দ্র', path: '/ilm' },
        ])}
      />
    </main>
  )
}
