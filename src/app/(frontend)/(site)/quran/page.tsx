import type { Metadata } from 'next'
import { Suspense } from 'react'

import { SourceNote } from '@/components/scripture/source-note'
import { SurahBrowser } from '@/components/scripture/surah-browser'
import { JsonLd } from '@/components/seo/json-ld'
import { PageHero, Skeleton } from '@/components/ui/primitives'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'
import { QURAN_SOURCE } from '@/lib/sources'
import { data } from '@/server/data'

export const revalidate = 86400

const LEAD =
  'আরবি মূল পাঠ ও বাংলা অনুবাদসহ সম্পূর্ণ কুরআন। প্রতিটি আয়াতের আলাদা লিংক, সংরক্ষণ ও শেয়ারের সুবিধা।'

export const metadata: Metadata = buildMetadata({
  title: 'আল-কুরআন',
  description: LEAD,
  path: '/quran',
})

export default async function QuranIndexPage() {
  const surahs = await data.surahs()
  return (
    <main id="main">
      <PageHero
        crumbs={[{ label: 'হোম', href: '/' }, { label: 'আল-কুরআন' }]}
        title="আল-কুরআন"
        lead={LEAD}
        id="quran-title"
      >
        <p
          className="ar"
          lang="ar"
          dir="rtl"
          style={{
            marginTop: 20,
            color: 'var(--rh-primary)',
            fontSize: 'clamp(1.5rem, 1.2rem + 1vw, 2rem)',
          }}
        >
          إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ
        </p>
      </PageHero>
      <section className="section-sm">
        <div className="rh-container">
          {surahs.length ? (
            <Suspense fallback={<Skeleton style={{ height: 600 }} />}>
              <SurahBrowser surahs={surahs} />
            </Suspense>
          ) : (
            <p className="t-muted">কুরআনের পাঠ শিগগিরই যুক্ত হবে, ইনশাআল্লাহ।</p>
          )}
          <SourceNote
            items={[QURAN_SOURCE.arabic, QURAN_SOURCE.translation, QURAN_SOURCE.delivery]}
          />
        </div>
      </section>
      <JsonLd
        data={breadcrumbLd([
          { name: 'হোম', path: '/' },
          { name: 'আল-কুরআন', path: '/quran' },
        ])}
      />
    </main>
  )
}
