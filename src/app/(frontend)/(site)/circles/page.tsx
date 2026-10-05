import type { Metadata } from 'next'
import { Suspense } from 'react'

import {
  CircleFilters,
  CircleGridSkeleton,
  CircleResults,
} from '@/components/circles/circle-browser'
import { JsonLd } from '@/components/seo/json-ld'
import { PageHero } from '@/components/ui/primitives'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'
import { data } from '@/server/data'

export const revalidate = 21600

const LEAD =
  'নিজের এলাকায় কয়েকজন মিলে নিয়মিত বসা: কুরআন পাঠ, ইলম চর্চা আর একে অপরের খোঁজ রাখা। ভ্রাতৃত্ব শুরু হয় এখান থেকেই।'

export const metadata: Metadata = buildMetadata({
  title: 'স্থানীয় সার্কেল',
  description: LEAD,
  path: '/circles',
})

export default async function CirclesPage() {
  const initial = await data.circles({})
  return (
    <main id="main">
      <PageHero
        crumbs={[
          { label: 'হোম', href: '/' },
          { label: 'মজলিস', href: '/events' },
          { label: 'স্থানীয় সার্কেল' },
        ]}
        title="স্থানীয় সার্কেল"
        lead={LEAD}
        id="c-title"
      >
        <Suspense
          fallback={<div className="card" style={{ marginTop: 28, height: 86, maxWidth: 880 }} />}
        >
          <CircleFilters />
        </Suspense>
      </PageHero>
      <section className="section-sm">
        <div className="rh-container">
          <Suspense fallback={<CircleGridSkeleton />}>
            <CircleResults initial={initial} />
          </Suspense>
        </div>
      </section>
      <JsonLd
        data={breadcrumbLd([
          { name: 'হোম', path: '/' },
          { name: 'মজলিস', path: '/events' },
          { name: 'স্থানীয় সার্কেল', path: '/circles' },
        ])}
      />
    </main>
  )
}
