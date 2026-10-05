import { Flag } from 'lucide-react'
import type { Metadata } from 'next'

import { DocumentPage } from '@/components/content/document-page'
import { JsonLd } from '@/components/seo/json-ld'
import { ButtonLink } from '@/components/ui/button'
import { bn } from '@/lib/format'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'
import { getAdabPolicy } from '@/server/queries/globals'

export const revalidate = 86400

export async function generateMetadata(): Promise<Metadata> {
  const policy = await getAdabPolicy()
  return buildMetadata({ title: policy.title, description: policy.lead, path: '/adab' })
}

export default async function AdabPolicyPage() {
  const policy = await getAdabPolicy()
  const steps = policy.enforcement ?? []
  return (
    <>
      <DocumentPage
        crumbs={[
          { label: 'হোম', href: '/' },
          { label: 'আমাদের পরিচয়', href: '/about' },
          { label: 'আদব নীতিমালা' },
        ]}
        title={policy.title}
        lead={policy.lead}
        content={policy.content}
        meta={policy.updatedLabel ? <span>সর্বশেষ হালনাগাদ: {policy.updatedLabel}</span> : null}
      >
        {steps.length ? (
          <section aria-labelledby="enf-title" style={{ marginTop: 48 }}>
            <h2 id="enf-title" className="t-h3">
              নীতি ভঙ্গ হলে
            </h2>
            <ol
              className="list-reset"
              style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {steps.map((s, i) => (
                <li
                  key={s.id ?? i}
                  className="card"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    className="icon-tile"
                    style={{ width: 36, height: 36, fontWeight: 700, flex: 'none' }}
                  >
                    {bn(i + 1)}
                  </span>
                  <div>
                    <strong style={{ display: 'block' }}>{s.step}</strong>
                    {s.detail ? <span className="t-small t-muted">{s.detail}</span> : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        <div
          className="adab-strip"
          style={{ marginTop: 32, alignItems: 'center', flexWrap: 'wrap' }}
        >
          <Flag className="ic" aria-hidden="true" style={{ color: 'var(--rh-primary)' }} />
          <p className="t-small" style={{ flex: '1 1 260px' }}>
            কোনো পোস্ট বা মন্তব্য নীতিমালার পরিপন্থী মনে হলে “রিপোর্ট” বাটন ব্যবহার করুন। মডারেটররা
            দ্রুত দেখবেন, ইনশাআল্লাহ।
          </p>
          <ButtonLink href="/forum" variant="secondary" size="sm">
            আলোচনা ফোরাম
          </ButtonLink>
        </div>
      </DocumentPage>
      <JsonLd
        data={breadcrumbLd([
          { name: 'হোম', path: '/' },
          { name: 'আমাদের পরিচয়', path: '/about' },
          { name: 'আদব নীতিমালা', path: '/adab' },
        ])}
      />
    </>
  )
}
