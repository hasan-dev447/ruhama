import type { Metadata } from 'next'
import { Suspense } from 'react'

import { AskQuestionForm } from '@/components/qa/ask-form'
import {
  QuestionBrowser,
  QuestionListSkeleton,
  QuestionSearch,
} from '@/components/qa/question-browser'
import { JsonLd } from '@/components/seo/json-ld'
import { PageHero } from '@/components/ui/primitives'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'
import { data } from '@/server/data'

export const revalidate = 86400

const LEAD =
  'দ্বীনি জিজ্ঞাসার উত্তর দেন আমাদের আলিম প্যানেল; প্রকাশের আগে প্রতিটি উত্তর দ্বিতীয় একজন আলিম রিভিউ করেন।'

export const metadata: Metadata = buildMetadata({
  title: 'প্রশ্নোত্তর',
  description: LEAD,
  path: '/qa',
})

export default async function QaPage() {
  const [initial, categories] = await Promise.all([
    data.questions({ limit: 10 }),
    data.categories('questions'),
  ])
  return (
    <main id="main">
      <PageHero
        crumbs={[{ label: 'হোম', href: '/' }, { label: 'প্রশ্নোত্তর' }]}
        title="প্রশ্নোত্তর"
        lead={LEAD}
        id="qa-title"
      >
        <Suspense fallback={<div style={{ height: 56, maxWidth: 640, marginTop: 28 }} />}>
          <QuestionSearch />
        </Suspense>
      </PageHero>
      <section className="section-sm">
        <div className="rh-container">
          <div className="layout-side">
            <div className="layout-side__main">
              <Suspense fallback={<QuestionListSkeleton />}>
                <QuestionBrowser
                  initial={initial}
                  categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
                />
              </Suspense>
            </div>
            <aside
              id="ask"
              className="layout-side__aside layout-side__aside--right sticky-col"
              aria-labelledby="ask-title"
              style={{ scrollMarginTop: 96 }}
            >
              <div className="card card-raised card-pad">
                <AskQuestionForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
              </div>
            </aside>
          </div>
        </div>
      </section>
      <JsonLd
        data={breadcrumbLd([
          { name: 'হোম', path: '/' },
          { name: 'প্রশ্নোত্তর', path: '/qa' },
        ])}
      />
    </main>
  )
}
