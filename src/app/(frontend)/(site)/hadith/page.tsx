import { BookOpen } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { SourceNote } from '@/components/scripture/source-note'
import { JsonLd } from '@/components/seo/json-ld'
import { IconTile, PageHero } from '@/components/ui/primitives'
import { bn, bnNumber } from '@/lib/format'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'
import { HADITH_SOURCE } from '@/lib/sources'
import { data } from '@/server/data'

export const revalidate = 86400

const LEAD =
  'প্রসিদ্ধ হাদিস গ্রন্থগুলো আরবি মূল পাঠ ও বাংলা অনুবাদসহ। প্রতিটি হাদিসের মান ও মূল্যায়নকারীর নাম উল্লেখ করা আছে।'

export const metadata: Metadata = buildMetadata({
  title: 'হাদিস গ্রন্থসমূহ',
  description: LEAD,
  path: '/hadith',
})

export default async function HadithIndexPage() {
  const books = await data.hadithBooks()
  const total = books.reduce((s, b) => s + b.hadithCount, 0)
  return (
    <main id="main">
      <PageHero
        crumbs={[{ label: 'হোম', href: '/' }, { label: 'হাদিস' }]}
        title="হাদিস গ্রন্থসমূহ"
        lead={LEAD}
        id="hadith-title"
        aside={
          total ? (
            <div className="stat-line">
              <span>
                <BookOpen className="ic" aria-hidden="true" />
                {bn(books.length)}টি গ্রন্থ · {bnNumber(total)}টি হাদিস
              </span>
            </div>
          ) : null
        }
      />
      <section className="section-sm">
        <div className="rh-container">
          {books.length ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
                gap: 16,
              }}
            >
              {books.map((b) => (
                <Link
                  key={b.slug}
                  href={`/hadith/${b.slug}`}
                  className="card card-hover"
                  style={{
                    padding: 22,
                    display: 'flex',
                    gap: 16,
                    textDecoration: 'none',
                    color: 'var(--rh-ink)',
                  }}
                >
                  <IconTile teal size={48}>
                    <BookOpen className="ic ic-lg" aria-hidden="true" />
                  </IconTile>
                  <span style={{ minWidth: 0 }}>
                    <strong
                      style={{
                        display: 'block',
                        fontFamily: 'var(--rh-font-heading)',
                        fontSize: 19,
                        lineHeight: 1.5,
                      }}
                    >
                      {b.name}
                    </strong>
                    {b.compiler ? (
                      <span className="t-small t-muted" style={{ display: 'block' }}>
                        {b.compiler}
                      </span>
                    ) : null}
                    <span
                      className="t-caption"
                      style={{ color: 'var(--rh-accent-ink)', fontWeight: 600 }}
                    >
                      {bnNumber(b.hadithCount)}টি হাদিস
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="t-muted">হাদিস গ্রন্থগুলো শিগগিরই যুক্ত হবে, ইনশাআল্লাহ।</p>
          )}
          <SourceNote items={[HADITH_SOURCE.dataset]} />
          <p className="t-small t-muted" style={{ marginTop: 12 }}>
            {HADITH_SOURCE.grading}
          </p>
        </div>
      </section>
      <JsonLd
        data={breadcrumbLd([
          { name: 'হোম', path: '/' },
          { name: 'হাদিস', path: '/hadith' },
        ])}
      />
    </main>
  )
}
