import { IconLocation, IconMail, IconPhone, IconQuestion } from '@/components/icons'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { ContactForm } from '@/components/forms/contact-form'
import { JsonLd } from '@/components/seo/json-ld'
import { PageHero, Skeleton } from '@/components/ui/primitives'
import { bn } from '@/lib/format'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'
import { getSiteSettings } from '@/server/queries/globals'

export const revalidate = 86400

const LEAD =
  'পরামর্শ, সংশোধনী, অংশীদারিত্ব বা প্রযুক্তিগত সমস্যা: যেকোনো বিষয়ে লিখুন। দ্বীনি প্রশ্ন হলে প্রশ্নোত্তর বিভাগ ব্যবহার করুন।'

export const metadata: Metadata = buildMetadata({
  title: 'যোগাযোগ',
  description: LEAD,
  path: '/contact',
})

export default async function ContactPage() {
  const site = await getSiteSettings()
  return (
    <main id="main">
      <PageHero
        crumbs={[{ label: 'হোম', href: '/' }, { label: 'যোগাযোগ' }]}
        title="যোগাযোগ"
        lead={LEAD}
        id="contact-title"
      />
      <section className="section-sm" style={{ paddingBottom: 96 }}>
        <div className="rh-container">
          <div className="layout-side">
            <div className="layout-side__main">
              <div className="card card-raised" style={{ padding: 32 }}>
                <Suspense fallback={<Skeleton style={{ height: 560 }} />}>
                  <ContactForm />
                </Suspense>
              </div>
            </div>
            <aside
              className="layout-side__aside layout-side__aside--right"
              aria-label="যোগাযোগের তথ্য"
            >
              <div className="card card-pad info-list">
                {site.contactEmail ? (
                  <div>
                    <IconMail className="ic" aria-hidden="true" />
                    <div>
                      <strong>ইমেইল</strong>
                      <a href={`mailto:${site.contactEmail}`} className="link">
                        {site.contactEmail}
                      </a>
                    </div>
                  </div>
                ) : null}
                {site.contactPhone ? (
                  <div>
                    <IconPhone className="ic" aria-hidden="true" />
                    <div>
                      <strong>ফোন</strong>
                      <a href={`tel:${site.contactPhone.replace(/[^\d+]/g, '')}`} className="link">
                        {bn(site.contactPhone)}
                      </a>
                    </div>
                  </div>
                ) : null}
                {site.address ? (
                  <div>
                    <IconLocation className="ic" aria-hidden="true" />
                    <div>
                      <strong>ঠিকানা</strong>
                      <span className="t-muted" style={{ whiteSpace: 'pre-line' }}>
                        {site.address}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="adab-strip" style={{ alignItems: 'flex-start' }}>
                <IconQuestion
                  className="ic"
                  aria-hidden="true"
                  style={{ color: 'var(--rh-primary)', marginTop: 3 }}
                />
                <p className="t-small">
                  দ্বীনি প্রশ্নের উত্তর দেন আলিম প্যানেল।{' '}
                  <Link href="/qa#ask" className="link">
                    প্রশ্নোত্তর বিভাগে প্রশ্ন করুন
                  </Link>
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
      <JsonLd
        data={breadcrumbLd([
          { name: 'হোম', path: '/' },
          { name: 'যোগাযোগ', path: '/contact' },
        ])}
      />
    </main>
  )
}
