import type { Metadata } from 'next'
import { Suspense } from 'react'

import { EventBrowser, EventGridSkeleton } from '@/components/events/event-browser'
import { JsonLd } from '@/components/seo/json-ld'
import { PageHero } from '@/components/ui/primitives'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'
import { data } from '@/server/data'

export const revalidate = 21600

const LEAD =
  'ইলম, তাযকিয়াহ ও ভ্রাতৃত্বের জন্য একসাথে বসা। অনলাইনে অথবা আপনার জেলায়, সবার জন্য উন্মুক্ত এবং বিনামূল্যে।'

export const metadata: Metadata = buildMetadata({
  title: 'মজলিস',
  description: LEAD,
  path: '/events',
})

export default async function EventsPage() {
  const [initial, upcomingDistricts, pastDistricts] = await Promise.all([
    data.events({}),
    data.eventDistricts('upcoming'),
    data.eventDistricts('past'),
  ])
  return (
    <main id="main">
      <PageHero
        crumbs={[{ label: 'হোম', href: '/' }, { label: 'মজলিস' }]}
        title="মজলিস"
        lead={LEAD}
        id="ev-title"
      />
      <section className="section-sm">
        <div className="rh-container">
          <Suspense fallback={<EventGridSkeleton />}>
            <EventBrowser
              initial={initial}
              districts={{ upcoming: upcomingDistricts, past: pastDistricts }}
            />
          </Suspense>
        </div>
      </section>
      <JsonLd
        data={breadcrumbLd([
          { name: 'হোম', path: '/' },
          { name: 'মজলিস', path: '/events' },
        ])}
      />
    </main>
  )
}
