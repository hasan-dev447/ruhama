import { CircleCheck } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CIRCLE_TYPE_LABEL, FREQUENCY_LABEL, memberLabel } from '@/components/circles/circle-card'
import { CircleJoinCard, MeetupList } from '@/components/circles/circle-client'
import { JsonLd } from '@/components/seo/json-ld'
import { Badge } from '@/components/ui/badge'
import { Breadcrumbs, IconTile } from '@/components/ui/primitives'
import { UserAvatar } from '@/components/ui/user-avatar'
import { districtLabel } from '@/lib/districts'
import { bn } from '@/lib/format'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'
import { data } from '@/server/data'

export const revalidate = 21600

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  try {
    const list = await data.circles({})
    return list.docs.map((c) => ({ slug: c.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const res = await data.circle(slug)
  if (!res)
    return buildMetadata({
      title: 'সার্কেলটি পাওয়া যায়নি',
      path: `/circles/${slug}`,
      noIndex: true,
    })
  return buildMetadata({
    title: res.circle.name,
    description: res.circle.description,
    path: `/circles/${slug}`,
  })
}

export default async function CirclePage({ params }: Props) {
  const { slug } = await params
  const res = await data.circle(slug)
  if (!res) notFound()
  const { circle, meetups } = res

  const type = (circle.type ?? 'brothers') as keyof typeof CIRCLE_TYPE_LABEL
  const format = circle.format ?? []
  const rules = (circle.rules ?? []).map((r) => r.rule).filter(Boolean)
  const team = circle.team ?? []
  const path = `/circles/${circle.slug}`

  return (
    <main id="main">
      <section
        className="pattern-host"
        style={{
          background: 'var(--rh-band-bg)',
          color: 'var(--rh-band-ink)',
          padding: '48px 0 56px',
        }}
      >
        <div
          className="rh-pattern"
          aria-hidden="true"
          style={{ backgroundColor: '#F3E9D6', opacity: 0.08 }}
        />
        <div className="rh-container">
          <Breadcrumbs
            items={[
              { label: 'স্থানীয় সার্কেল', href: '/circles' },
              {
                label: districtLabel(circle.district),
                href: `/circles?district=${circle.district}`,
              },
            ]}
            style={{ color: 'var(--rh-band-muted)' }}
            linkStyle={{ color: 'var(--rh-band-muted)' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 22 }}>
            <Badge style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--rh-band-ink)' }}>
              {CIRCLE_TYPE_LABEL[type]} সার্কেল
            </Badge>
            <Badge style={{ background: 'rgba(212,169,92,0.22)', color: '#F3E2BE' }}>
              {FREQUENCY_LABEL[circle.frequency] ?? circle.frequency}
            </Badge>
          </div>
          <h1 className="t-h1" style={{ color: 'var(--rh-band-ink)', marginTop: 14 }}>
            {circle.name}
          </h1>
          <p style={{ color: 'var(--rh-band-muted)', maxWidth: 640, marginTop: 10 }}>
            {circle.description}
            {circle.sinceLabel ? ` ${circle.sinceLabel} থেকে চলছে।` : ''}
          </p>
          <div className="stat-line" style={{ color: 'var(--rh-band-muted)', marginTop: 18 }}>
            <span>
              {memberLabel(
                circle.memberCount ?? 0,
                circle.memberUnit === 'families' ? 'families' : 'people',
              )}
            </span>
            <span>{circle.scheduleLabel}</span>
            <span>
              {[circle.venue, circle.area, districtLabel(circle.district)]
                .filter(Boolean)
                .join(', ')}
            </span>
          </div>
        </div>
      </section>

      <section className="section-sm" style={{ paddingBottom: 96 }}>
        <div className="rh-container">
          <div className="layout-side">
            <div
              className="layout-side__main"
              style={{ display: 'flex', flexDirection: 'column', gap: 40 }}
            >
              <section aria-labelledby="cd-meet">
                <h2 id="cd-meet" className="t-h3">
                  আসন্ন বৈঠক
                </h2>
                <div className="card" style={{ padding: '4px 22px', marginTop: 16 }}>
                  <MeetupList
                    circleId={circle.id}
                    meetups={meetups.map((m) => ({
                      id: m.id,
                      startsAt: m.startsAt,
                      topic: m.topic,
                      meta: m.meta,
                      attendingCount: m.attendingCount,
                    }))}
                  />
                </div>
              </section>

              {format.length ? (
                <section aria-labelledby="cd-about">
                  <h2 id="cd-about" className="t-h3">
                    একটি বৈঠকে যা হয়
                  </h2>
                  <ol
                    className="list-reset"
                    style={{
                      marginTop: 16,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
                      gap: 14,
                    }}
                  >
                    {format.map((f, i) => (
                      <li
                        key={f.id ?? i}
                        className="card card-pad"
                        style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 6 }}
                      >
                        <IconTile size={36} style={{ fontWeight: 700 }}>
                          {bn(i + 1)}
                        </IconTile>
                        <strong>{f.title}</strong>
                        {f.detail ? <span className="t-small t-muted">{f.detail}</span> : null}
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}

              {rules.length ? (
                <section aria-labelledby="cd-rules">
                  <h2 id="cd-rules" className="t-h3">
                    সার্কেলের আদব
                  </h2>
                  <ul
                    className="list-reset"
                    style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}
                  >
                    {rules.map((r) => (
                      <li key={r} style={{ display: 'flex', gap: 12 }}>
                        <CircleCheck
                          className="ic"
                          aria-hidden="true"
                          style={{ color: 'var(--rh-primary)', flex: 'none', marginTop: 4 }}
                        />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            <aside
              id="join"
              className="layout-side__aside layout-side__aside--right sticky-col"
              aria-label="যুক্ত হোন"
              style={{ scrollMarginTop: 96 }}
            >
              <div className="card card-raised card-pad">
                <CircleJoinCard circleId={circle.id} />
                {team.length ? (
                  <div
                    style={{
                      borderTop: '1px solid var(--rh-border)',
                      marginTop: 20,
                      paddingTop: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                    }}
                  >
                    <strong className="t-small" style={{ color: 'var(--rh-muted)' }}>
                      সমন্বয়ক
                    </strong>
                    {team.map((t, i) => (
                      <div key={t.id ?? i} className="person-row">
                        <UserAvatar name={t.name} tone={i % 2 ? 'gold' : 'teal'} />
                        <div>
                          <strong>{t.name}</strong>
                          <span>{t.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      </section>
      <JsonLd
        data={breadcrumbLd([
          { name: 'স্থানীয় সার্কেল', path: '/circles' },
          { name: circle.name, path },
        ])}
      />
    </main>
  )
}
