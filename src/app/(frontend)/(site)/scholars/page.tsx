import { ArrowRight, BadgeCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import {
  ScholarControls,
  ScholarGridSkeleton,
  ScholarResults,
} from '@/components/people/scholar-browser'
import { JsonLd } from '@/components/seo/json-ld'
import { PageHero } from '@/components/ui/primitives'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'
import { data } from '@/server/data'

export const revalidate = 86400

const LEAD =
  'যাঁরা লেখেন, প্রশ্নের উত্তর দেন এবং প্রকাশের আগে প্রতিটি লেখা রিভিউ করেন। স্বচ্ছতার জন্য পরিচয়, ব্যক্তিপূজার জন্য নয়।'

export const metadata: Metadata = buildMetadata({
  title: 'আমাদের আলিম প্যানেল',
  description: LEAD,
  path: '/scholars',
})

export default async function ScholarsPage() {
  const [scholars, fields] = await Promise.all([data.scholars({}), data.scholarFields()])
  return (
    <main id="main">
      <PageHero
        crumbs={[
          { label: 'হোম', href: '/' },
          { label: 'আমাদের পরিচয়', href: '/about' },
          { label: 'স্কলার' },
        ]}
        title="আমাদের আলিম প্যানেল"
        lead={LEAD}
        id="sc-title"
      >
        <Suspense fallback={<div style={{ height: 54, marginTop: 28, maxWidth: 760 }} />}>
          <ScholarControls />
        </Suspense>
      </PageHero>
      <section className="section-sm">
        <div className="rh-container">
          <Suspense fallback={<ScholarGridSkeleton />}>
            <ScholarResults initial={scholars} fields={fields} />
          </Suspense>
          <div
            className="adab-strip"
            style={{ marginTop: 40, alignItems: 'center', flexWrap: 'wrap' }}
          >
            <BadgeCheck className="ic" aria-hidden="true" style={{ color: 'var(--rh-primary)' }} />
            <p className="t-small" style={{ flex: '1 1 320px' }}>
              <strong>“যাচাইকৃত” মানে কী?</strong> শূরা আলিমের শিক্ষাগত যোগ্যতা ও পরিচয় নিশ্চিত
              করেছে। এটি কোনো মতের শ্রেষ্ঠত্বের স্বীকৃতি নয়।
            </p>
            <Link href="/about#shura" className="link-arrow">
              যাচাই প্রক্রিয়া <ArrowRight className="ic" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
      <JsonLd
        data={breadcrumbLd([
          { name: 'হোম', path: '/' },
          { name: 'আমাদের পরিচয়', path: '/about' },
          { name: 'স্কলার', path: '/scholars' },
        ])}
      />
    </main>
  )
}
