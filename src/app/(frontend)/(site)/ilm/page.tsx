import { IconBook, IconHadith, IconQuran, IconVerified } from '@/components/icons'
import type { Metadata } from 'next'
import Link from 'next/link'
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

const SCRIPTURE = [
  {
    href: '/quran',
    title: 'আল-কুরআন',
    text: '১১৪টি সূরা, আরবি পাঠ ও বাংলা অনুবাদসহ। পছন্দের আয়াত সংরক্ষণ করে রাখুন।',
    Icon: IconQuran,
  },
  {
    href: '/hadith',
    title: 'হাদিস ভান্ডার',
    text: 'বুখারী, মুসলিমসহ ৮টি গ্রন্থের ৩৫ হাজারের বেশি হাদিস, মান উল্লেখসহ।',
    Icon: IconHadith,
  },
]

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
              <IconBook className="ic" aria-hidden="true" />
              {bn(total)}টি প্রবন্ধ
            </span>
            <span>
              <IconVerified className="ic" aria-hidden="true" />
              সবগুলো রিভিউকৃত
            </span>
          </div>
        }
      />
      <section className="section-sm" aria-label="কুরআন ও হাদিস" style={{ paddingBottom: 0 }}>
        <div className="rh-container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
              gap: 16,
            }}
          >
            {SCRIPTURE.map(({ href, title, text, Icon }) => (
              <Link
                key={href}
                href={href}
                className="card card-hover"
                style={{
                  padding: 22,
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: 'var(--rh-ink)',
                }}
              >
                <span className="icon-tile" aria-hidden="true">
                  <Icon className="ic" />
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <strong className="t-h4">{title}</strong>
                  <span className="t-small t-muted">{text}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
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
