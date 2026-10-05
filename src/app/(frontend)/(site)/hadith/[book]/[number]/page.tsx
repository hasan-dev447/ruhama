import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { BookmarkButton } from '@/components/actions/bookmark-button'
import { ShareButton } from '@/components/actions/share-button'
import { HadithCard } from '@/components/content/scripture'
import { SourceNote } from '@/components/scripture/source-note'
import { JsonLd } from '@/components/seo/json-ld'
import { Breadcrumbs } from '@/components/ui/primitives'
import { bn } from '@/lib/format'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'
import { HADITH_SOURCE } from '@/lib/sources'
import { data } from '@/server/data'

export const revalidate = 86400

type Props = { params: Promise<{ book: string; number: string }> }

/** Tens of thousands of hadith: each page is generated on first visit, then cached. */
export function generateStaticParams() {
  return []
}

const parse = (n: string) => (/^\d+(\.\d+)?$/.test(n) ? Number(n) : null)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { book, number } = await params
  const n = parse(number)
  const res = n === null ? null : await data.hadith(book, n)
  if (!res)
    return buildMetadata({
      title: 'হাদিসটি পাওয়া যায়নি',
      path: `/hadith/${book}/${number}`,
      noIndex: true,
    })
  const h = res.hadith
  return buildMetadata({
    title: `${h.book.name} : ${bn(h.numberLabel)}`,
    description: h.text.slice(0, 180),
    path: `/hadith/${book}/${h.numberLabel}`,
  })
}

export default async function HadithPage({ params }: Props) {
  const { book, number } = await params
  const n = parse(number)
  const res = n === null ? null : await data.hadith(book, n)
  if (!res) notFound()
  const { hadith: h, prev, next } = res
  const reference = `${h.book.name} : ${bn(h.numberLabel)}`
  const path = `/hadith/${book}/${h.numberLabel}`

  return (
    <main id="main">
      <section className="section-sm" style={{ paddingTop: 40 }}>
        <div
          className="rh-container-narrow"
          style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
        >
          <Breadcrumbs
            items={[
              { label: 'হাদিস', href: '/hadith' },
              { label: h.book.name, href: `/hadith/${book}` },
              { label: `হাদিস ${bn(h.numberLabel)}` },
            ]}
          />
          <div>
            <h1 className="t-h2">{reference}</h1>
            {h.chapter ? (
              <p className="t-muted" style={{ marginTop: 6 }}>
                অধ্যায়: {h.chapter}
              </p>
            ) : null}
          </div>
          <HadithCard
            arabic={h.arabic}
            text={h.text}
            narrator={h.narrator}
            source={reference}
            grade={h.grade}
            textStyle={{ whiteSpace: 'pre-line' }}
            arabicStyle={{ fontSize: 'clamp(1.4rem, 1.15rem + 1vw, 1.85rem)' }}
          />
          {h.gradeSource ? <p className="t-small t-muted">মান নির্ধারণ: {h.gradeSource}</p> : null}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <BookmarkButton target={{ collection: 'hadiths', id: h.id }} variant="ghost" />
            <ShareButton title={reference} path={path} variant="ghost" label="শেয়ার" />
          </div>
          <nav
            aria-label="হাদিস নেভিগেশন"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
              gap: 14,
            }}
          >
            {prev !== null ? (
              <Link
                href={`/hadith/${book}/${prev}`}
                className="card card-hover"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  textDecoration: 'none',
                  color: 'var(--rh-ink)',
                }}
              >
                <ChevronLeft className="ic" aria-hidden="true" />
                <span>
                  <span className="t-caption t-muted" style={{ display: 'block' }}>
                    আগের হাদিস
                  </span>
                  <strong style={{ fontWeight: 600 }}>
                    {h.book.shortName} : {bn(prev)}
                  </strong>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next !== null ? (
              <Link
                href={`/hadith/${book}/${next}`}
                className="card card-hover"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 12,
                  textDecoration: 'none',
                  color: 'var(--rh-ink)',
                  textAlign: 'right',
                }}
              >
                <span>
                  <span className="t-caption t-muted" style={{ display: 'block' }}>
                    পরের হাদিস
                  </span>
                  <strong style={{ fontWeight: 600 }}>
                    {h.book.shortName} : {bn(next)}
                  </strong>
                </span>
                <ChevronRight className="ic" aria-hidden="true" />
              </Link>
            ) : null}
          </nav>
          <SourceNote items={[HADITH_SOURCE.dataset]} />
        </div>
      </section>
      <JsonLd
        data={breadcrumbLd([
          { name: 'হাদিস', path: '/hadith' },
          { name: h.book.name, path: `/hadith/${book}` },
          { name: reference, path },
        ])}
      />
    </main>
  )
}
