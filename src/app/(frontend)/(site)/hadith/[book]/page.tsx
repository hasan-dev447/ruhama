import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { HadithBrowser } from '@/components/scripture/hadith-browser'
import { SourceNote } from '@/components/scripture/source-note'
import { JsonLd } from '@/components/seo/json-ld'
import { PageHero, Skeleton } from '@/components/ui/primitives'
import { bnNumber } from '@/lib/format'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'
import { HADITH_BOOKS, HADITH_SOURCE } from '@/lib/sources'
import { data } from '@/server/data'

export const revalidate = 86400

type Props = { params: Promise<{ book: string }> }

export function generateStaticParams() {
  return HADITH_BOOKS.map((b) => ({ book: b.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { book: slug } = await params
  const book = await data.hadithBook(slug)
  if (!book)
    return buildMetadata({
      title: 'গ্রন্থটি পাওয়া যায়নি',
      path: `/hadith/${slug}`,
      noIndex: true,
    })
  return buildMetadata({
    title: book.name,
    description: `${book.name}: ${bnNumber(book.hadithCount)}টি হাদিস, আরবি ও বাংলা অনুবাদসহ।`,
    path: `/hadith/${slug}`,
  })
}

export default async function HadithBookPage({ params }: Props) {
  const { book: slug } = await params
  const book = await data.hadithBook(slug)
  if (!book) notFound()
  const initial = await data.hadiths({ bookId: book.id, page: 1, limit: 20 })
  return (
    <main id="main">
      <PageHero
        crumbs={[
          { label: 'হোম', href: '/' },
          { label: 'হাদিস', href: '/hadith' },
          { label: book.name },
        ]}
        title={book.name}
        lead={[book.compiler, `${bnNumber(book.hadithCount)}টি হাদিস`].filter(Boolean).join(' · ')}
        id="book-title"
      />
      <section className="section-sm">
        <div className="rh-container-narrow">
          <Suspense fallback={<Skeleton style={{ height: 600 }} />}>
            <HadithBrowser book={book.slug} initial={initial} />
          </Suspense>
          <SourceNote items={[HADITH_SOURCE.dataset]} />
        </div>
      </section>
      <JsonLd
        data={breadcrumbLd([
          { name: 'হাদিস', path: '/hadith' },
          { name: book.name, path: `/hadith/${book.slug}` },
        ])}
      />
    </main>
  )
}
