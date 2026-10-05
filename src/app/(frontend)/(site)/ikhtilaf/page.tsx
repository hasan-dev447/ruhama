import { Columns2, Info } from 'lucide-react'
import type { Metadata } from 'next'

import { IkhtilafList } from '@/components/lists/ikhtilaf-list'
import { JsonLd } from '@/components/seo/json-ld'
import { EmptyState, PageHero } from '@/components/ui/primitives'
import { bn } from '@/lib/format'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'
import { data } from '@/server/data'

export const revalidate = 86400

const LEAD =
  'যেসব বিষয়ে আলিমদের মধ্যে দলিলভিত্তিক ভিন্নমত রয়েছে, সেখানে প্রতিটি মত তার দলিলসহ পাশাপাশি তুলে ধরা হয়, সমান মর্যাদায়। উদ্দেশ্য বিতর্ক জেতা নয়, বোঝা ও সম্মান করা।'

export const metadata: Metadata = buildMetadata({
  title: 'মতপার্থক্যের আদব',
  description: LEAD,
  path: '/ikhtilaf',
})

export default async function IkhtilafIndexPage() {
  const initial = await data.ikhtilafList(20)
  return (
    <main id="main">
      <PageHero
        crumbs={[{ label: 'হোম', href: '/' }, { label: 'মতপার্থক্যের বিষয়' }]}
        title="মতপার্থক্যের আদব"
        lead={LEAD}
        id="ikh-index-title"
        aside={
          <div className="stat-line">
            <span>
              <Columns2 className="ic" aria-hidden="true" />
              {bn(initial.totalDocs)}টি বিষয়
            </span>
          </div>
        }
      />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="rh-container" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div className="adab-strip" role="note">
            <Info
              className="ic"
              aria-hidden="true"
              style={{ color: 'var(--rh-primary)', marginTop: 3 }}
            />
            <div>
              <strong>পড়ার আগে</strong>
              <p className="t-small t-muted" style={{ marginTop: 4 }}>
                এখানকার প্রতিটি মত ইজতিহাদের বৈধ পরিসরে। এই পাতাগুলো ফতোয়া নয়; নিজের আমলের জন্য
                আপনার আস্থাভাজন আলিমের পরামর্শ নিন।
              </p>
            </div>
          </div>
          {initial.docs.length ? (
            <IkhtilafList initial={initial} />
          ) : (
            <div className="card">
              <EmptyState
                icon={<Columns2 className="ic ic-xl" aria-hidden="true" />}
                title="এখনো কোনো বিষয় প্রকাশিত হয়নি"
                text="রিভিউ শেষ হলেই বিষয়গুলো এখানে দেখা যাবে।"
              />
            </div>
          )}
        </div>
      </section>
      <JsonLd
        data={breadcrumbLd([
          { name: 'হোম', path: '/' },
          { name: 'মতপার্থক্যের বিষয়', path: '/ikhtilaf' },
        ])}
      />
    </main>
  )
}
