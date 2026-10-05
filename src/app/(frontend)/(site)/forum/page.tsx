import { ArrowRight, Check, HeartHandshake } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { ForumBrowser, NewThreadButton } from '@/components/forum/forum-browser'
import { JsonLd } from '@/components/seo/json-ld'
import { Breadcrumbs, IconTile, Skeleton } from '@/components/ui/primitives'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'
import { data } from '@/server/data'

export const revalidate = 21600

const LEAD = 'প্রশ্ন, অভিজ্ঞতা ও পারস্পরিক পরামর্শ। দ্বিমত থাকতে পারে, অসম্মান নয়।'

export const metadata: Metadata = buildMetadata({
  title: 'আলোচনা ফোরাম',
  description: LEAD,
  path: '/forum',
})

const RULES = [
  'দলিলসহ কথা বলুন',
  'ব্যক্তি নয়, বক্তব্য নিয়ে আলোচনা',
  'কোনো দল বা আলিমকে কটাক্ষ নয়',
  'ফতোয়ার প্রশ্ন “প্রশ্নোত্তর” বিভাগে',
]

export default async function ForumPage() {
  const [categories, initial] = await Promise.all([data.forumCategories(), data.forumThreads({})])
  return (
    <main id="main">
      <section className="page-hero" aria-labelledby="f-title" style={{ paddingBottom: 40 }}>
        <div className="rh-pattern" aria-hidden="true" />
        <div className="rh-container">
          <Breadcrumbs items={[{ label: 'হোম', href: '/' }, { label: 'আলোচনা ফোরাম' }]} />
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 20,
            }}
          >
            <div>
              <h1 id="f-title" className="t-h1">
                আলোচনা ফোরাম
              </h1>
              <p className="lead">{LEAD}</p>
            </div>
            <NewThreadButton categories={categories} />
          </div>
        </div>
      </section>
      <section className="section-sm">
        <div className="rh-container" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div className="adab-banner" role="note" aria-labelledby="adab-h">
            <IconTile size={44} style={{ background: 'var(--rh-surface)' }}>
              <HeartHandshake className="ic" aria-hidden="true" />
            </IconTile>
            <div style={{ flex: 1 }}>
              <strong id="adab-h" style={{ fontFamily: 'var(--rh-font-heading)', fontSize: 17 }}>
                আলোচনার আদব
              </strong>
              <ul>
                {RULES.map((r) => (
                  <li key={r}>
                    <Check className="ic" aria-hidden="true" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/adab" className="link-arrow" style={{ alignSelf: 'center' }}>
              পুরো নীতিমালা <ArrowRight className="ic" aria-hidden="true" />
            </Link>
          </div>
          <Suspense fallback={<Skeleton style={{ height: 520 }} />}>
            <ForumBrowser initial={initial} categories={categories} />
          </Suspense>
        </div>
      </section>
      <JsonLd
        data={breadcrumbLd([
          { name: 'হোম', path: '/' },
          { name: 'আলোচনা ফোরাম', path: '/forum' },
        ])}
      />
    </main>
  )
}
