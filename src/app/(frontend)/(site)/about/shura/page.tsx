import type { Metadata } from 'next'

import { ShuraGrid } from '@/components/content/shura-grid'
import { JsonLd } from '@/components/seo/json-ld'
import { PageHero } from '@/components/ui/primitives'
import { bn } from '@/lib/format'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'
import { data } from '@/server/data'
import { getAboutPage } from '@/server/queries/globals'

export const revalidate = 86400

export const metadata: Metadata = buildMetadata({
  title: 'শূরা',
  description: 'Ruhama-র সিদ্ধান্ত নেয় বিভিন্ন ধারার আলিম ও পেশাজীবীদের নিয়ে গঠিত শূরা।',
  path: '/about/shura',
})

/** Every শূরা member (the about page shows only the ones chosen in the admin). */
export default async function ShuraPage() {
  const [about, shura] = await Promise.all([getAboutPage(), data.shura()])
  return (
    <main id="main">
      <PageHero
        crumbs={[
          { label: 'হোম', href: '/' },
          { label: 'আমাদের পরিচয়', href: '/about' },
          { label: 'শূরা' },
        ]}
        title="শূরা"
        lead={about.shuraIntro}
        id="shura-title"
      />
      <section className="section-sm" aria-labelledby="shura-title">
        <div className="rh-container">
          <p className="t-small t-muted">মোট {bn(shura.length)} জন সদস্য</p>
          <ShuraGrid members={shura} />
        </div>
      </section>
      <JsonLd
        data={breadcrumbLd([
          { name: 'হোম', path: '/' },
          { name: 'আমাদের পরিচয়', path: '/about' },
          { name: 'শূরা', path: '/about/shura' },
        ])}
      />
    </main>
  )
}
