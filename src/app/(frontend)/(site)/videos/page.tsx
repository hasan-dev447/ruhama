import type { Metadata } from 'next'
import { Suspense } from 'react'

import { JsonLd } from '@/components/seo/json-ld'
import { Breadcrumbs } from '@/components/ui/primitives'
import { UrlSearchBox } from '@/components/ui/url-search'
import { VideoBrowser, VideoGridSkeleton } from '@/components/videos/video-browser'
import { PlaylistCard } from '@/components/videos/video-card'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'
import { data } from '@/server/data'

export const revalidate = 86400

const LEAD = 'মজলিস ও ধারাবাহিক লেকচার, প্রতিটি রিভিউকৃত এবং অধ্যায়ে ভাগ করা।'

export const metadata: Metadata = buildMetadata({
  title: 'ভিডিও লাইব্রেরি',
  description: LEAD,
  path: '/videos',
})

export default async function VideosPage() {
  const [initial, playlists, categories, speakers] = await Promise.all([
    data.videos({ limit: 12 }),
    data.playlists(),
    data.categories('videos'),
    data.videoSpeakers(),
  ])
  return (
    <main id="main">
      <section className="page-hero" aria-labelledby="v-title">
        <div className="rh-pattern" aria-hidden="true" />
        <div className="rh-container">
          <Breadcrumbs items={[{ label: 'হোম', href: '/' }, { label: 'ভিডিও লাইব্রেরি' }]} />
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
              <h1 id="v-title" className="t-h1">
                ভিডিও লাইব্রেরি
              </h1>
              <p className="lead">{LEAD}</p>
            </div>
            <Suspense fallback={<div style={{ flex: '0 1 420px', height: 54 }} />}>
              <UrlSearchBox
                id="v-search"
                label="ভিডিও খুঁজুন"
                placeholder="বিষয় বা বক্তার নাম"
                wrapStyle={{ flex: '0 1 420px', width: '100%' }}
                inputStyle={{ minHeight: 54 }}
              />
            </Suspense>
          </div>
        </div>
      </section>

      {playlists.length ? (
        <section className="section-sm" style={{ paddingBottom: 24 }} aria-labelledby="pl-title">
          <div className="rh-container">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <h2 id="pl-title" className="t-h3">
                প্লেলিস্ট
              </h2>
              <span className="t-small t-muted">ধারাবাহিকভাবে দেখুন</span>
            </div>
            <div className="h-scroll" role="list">
              {playlists.map((p) => (
                <PlaylistCard key={p.id} playlist={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section-sm" style={{ paddingTop: 24 }}>
        <div className="rh-container">
          <Suspense fallback={<VideoGridSkeleton />}>
            <VideoBrowser
              initial={initial}
              categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
              speakers={speakers}
            />
          </Suspense>
        </div>
      </section>
      <JsonLd
        data={breadcrumbLd([
          { name: 'হোম', path: '/' },
          { name: 'ভিডিও লাইব্রেরি', path: '/videos' },
        ])}
      />
    </main>
  )
}
