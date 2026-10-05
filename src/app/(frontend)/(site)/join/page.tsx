import { Gift, MapPin, Users } from 'lucide-react'
import type { Metadata } from 'next'
import { Suspense } from 'react'

import { AyahCard } from '@/components/content/scripture'
import { JoinFormWithParams } from '@/components/forms/join-form-params'
import { JsonLd } from '@/components/seo/json-ld'
import { Breadcrumbs, IconTile, Skeleton } from '@/components/ui/primitives'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'

export const revalidate = 86400

const LEAD =
  'আপনি যে দল বা ধারারই হোন, যদি বিশ্বাস করেন মুসলিম পরিচয় আগে, তাহলে এই কাজ আপনারও। নিজের সময় ও দক্ষতা অনুযায়ী অবদান রাখুন।'

export const metadata: Metadata = buildMetadata({
  title: 'যুক্ত হোন',
  description: LEAD,
  path: '/join',
})

const POINTS = [
  {
    icon: Gift,
    title: 'কোনো সদস্য ফি নেই',
    text: 'সব কাজ স্বেচ্ছাশ্রমে, আল্লাহর সন্তুষ্টির জন্য।',
  },
  {
    icon: Users,
    title: 'দলীয় পরিচয় ছাড়তে হবে না',
    text: 'শুধু ঘোষণাপত্রের আদব ও ইনসাফ মেনে চলার অঙ্গীকার।',
  },
  {
    icon: MapPin,
    title: 'নিজের জেলায় কাজের সুযোগ',
    text: 'মজলিস আয়োজন থেকে অনলাইন কনটেন্ট পর্যন্ত।',
  },
]

export default function JoinPage() {
  return (
    <main id="main" className="pattern-host">
      <div className="rh-pattern" aria-hidden="true" />
      <section className="section" style={{ paddingTop: 64 }}>
        <div className="rh-container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))',
              gap: 56,
              alignItems: 'start',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <Breadcrumbs items={[{ label: 'হোম', href: '/' }, { label: 'যুক্ত হোন' }]} />
              <span className="eyebrow">একসাথে কাজ করি</span>
              <h1 className="t-h1">আসুন, আগে আমরা কয়েকজন শুরু করি</h1>
              <p className="t-body-lg t-muted">{LEAD}</p>
              <ul
                className="list-reset"
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                {POINTS.map(({ icon: Icon, title, text }) => (
                  <li key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <IconTile size={40}>
                      <Icon className="ic" aria-hidden="true" />
                    </IconTile>
                    <div>
                      <strong>{title}</strong>
                      <p className="t-small t-muted">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <AyahCard
                compact
                arabic="وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ"
                translation="সৎকর্ম ও তাকওয়ার কাজে তোমরা পরস্পরকে সহযোগিতা করো।"
                reference="সূরা আল-মায়িদাহ : ২"
                style={{ marginTop: 12 }}
              />
            </div>
            <div
              id="volunteer"
              className="card card-raised"
              style={{ padding: 36, scrollMarginTop: 96 }}
            >
              <Suspense fallback={<Skeleton style={{ height: 640 }} />}>
                <JoinFormWithParams />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
      <JsonLd
        data={breadcrumbLd([
          { name: 'হোম', path: '/' },
          { name: 'যুক্ত হোন', path: '/join' },
        ])}
      />
    </main>
  )
}
