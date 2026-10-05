import { CalendarDays, MapPin, Users, Video } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ShareButton } from '@/components/actions/share-button'
import { PersonAvatar, personHref } from '@/components/content/cards'
import { RichText } from '@/components/content/rich-text'
import { RegistrationCard } from '@/components/events/registration-card'
import { PreviewBar } from '@/components/preview/preview-bar'
import { JsonLd } from '@/components/seo/json-ld'
import { Badge, ModeBadge } from '@/components/ui/badge'
import { Breadcrumbs, DateTile } from '@/components/ui/primitives'
import { districtLabel } from '@/lib/districts'
import { formatDay, formatLongDate, formatMonth, formatTime, formatWeekday } from '@/lib/format'
import { breadcrumbLd, buildMetadata, eventLd } from '@/lib/seo'
import { data } from '@/server/data'
import { getPayloadClient } from '@/server/payload'
import { previewUser } from '@/server/preview'
import { toCategory, toPerson } from '@/server/queries/articles'
import { getEvent } from '@/server/queries/events'

export const revalidate = 21600

type Props = { params: Promise<{ slug: string }> }

const hasEnded = (e: { startsAt: string; endsAt?: string | null }) =>
  new Date(e.endsAt ?? e.startsAt).getTime() < Date.now()

export async function generateStaticParams() {
  try {
    const list = await data.events({})
    return list.docs.map((e) => ({ slug: e.slug }))
  } catch {
    return []
  }
}

async function load(slug: string) {
  const user = await previewUser()
  if (user)
    return {
      doc: await getEvent(await getPayloadClient(), slug, { draft: true, user }),
      preview: true,
    }
  return { doc: await data.event(slug), preview: false }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const doc = await data.event(slug)
  if (!doc)
    return buildMetadata({ title: 'মজলিসটি পাওয়া যায়নি', path: `/events/${slug}`, noIndex: true })
  return buildMetadata({ title: doc.title, description: doc.summary, path: `/events/${slug}` })
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params
  const { doc, preview } = await load(slug)
  if (!doc) notFound()

  const category = toCategory(doc.category)
  const speakers = ((doc.speakers ?? []) as unknown[])
    .map((s) => ({ person: toPerson(s), raw: s as { specialty?: string | null } }))
    .filter((s) => s.person !== null)
  const notes = (doc.speakerNotes ?? []).map((n) => n.note ?? '')
  const agenda = doc.agenda ?? []
  const ended = hasEnded(doc)
  const online = doc.mode === 'online'
  const path = `/events/${doc.slug}`
  const timeText =
    doc.timeLabel ||
    [formatTime(doc.startsAt), doc.endsAt ? formatTime(doc.endsAt) : null]
      .filter(Boolean)
      .join(' থেকে ')
  const circle = doc.circle && typeof doc.circle === 'object' ? doc.circle : null

  return (
    <>
      {preview ? <PreviewBar /> : null}
      <main id="main">
        <section className="page-hero" aria-labelledby="ed-title" style={{ paddingBottom: 48 }}>
          <div className="rh-pattern" aria-hidden="true" />
          <div className="rh-container">
            <Breadcrumbs
              items={[
                { label: 'হোম', href: '/' },
                { label: 'মজলিস', href: '/events' },
                ...(category ? [{ label: category.name }] : []),
              ]}
            />
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 24,
                alignItems: 'flex-start',
                marginTop: 28,
              }}
            >
              <DateTile
                size="lg"
                day={formatDay(doc.startsAt)}
                month={formatMonth(doc.startsAt)}
                weekday={formatWeekday(doc.startsAt)}
              />
              <div style={{ flex: '1 1 480px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <ModeBadge mode={doc.mode} />
                  {category ? <Badge variant="cat">{category.name}</Badge> : null}
                  {doc.isFree ? <Badge variant="neutral">বিনামূল্যে</Badge> : null}
                  {ended ? <Badge variant="neutral">শেষ হয়েছে</Badge> : null}
                </div>
                <h1 id="ed-title" className="t-h1">
                  {doc.title}
                </h1>
                <p className="lead" style={{ marginTop: 0 }}>
                  {doc.summary}
                </p>
                <div>
                  <ShareButton title={doc.title} path={path} variant="ghost" label="শেয়ার করুন" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-sm">
          <div className="rh-container">
            <div className="layout-side">
              <div
                className="layout-side__main"
                style={{ display: 'flex', flexDirection: 'column', gap: 40 }}
              >
                <div
                  className="card card-pad info-list"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
                    gap: 20,
                  }}
                >
                  <div>
                    <CalendarDays className="ic" aria-hidden="true" />
                    <div>
                      <strong>তারিখ ও সময়</strong>
                      <span className="t-muted">
                        {formatLongDate(doc.startsAt)}
                        <br />
                        {timeText}
                      </span>
                    </div>
                  </div>
                  <div>
                    {online ? (
                      <Video className="ic" aria-hidden="true" />
                    ) : (
                      <MapPin className="ic" aria-hidden="true" />
                    )}
                    <div>
                      <strong>স্থান</strong>
                      <span className="t-muted">
                        {online ? (
                          <>
                            অনলাইন লাইভ সেশন
                            <br />
                            যোগ দেওয়ার লিংক রেজিস্ট্রেশনের পর ইমেইলে
                          </>
                        ) : (
                          <>
                            {[doc.venueName, doc.venueAddress].filter(Boolean).join(', ')}
                            <br />
                            {districtLabel(doc.district)}
                            {doc.mapUrl ? (
                              <>
                                {' · '}
                                <a
                                  href={doc.mapUrl}
                                  className="link"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  ম্যাপে দেখুন
                                </a>
                              </>
                            ) : null}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Users className="ic" aria-hidden="true" />
                    <div>
                      <strong>কাদের জন্য</strong>
                      <span className="t-muted" style={{ whiteSpace: 'pre-line' }}>
                        {doc.audience || 'সবার জন্য উন্মুক্ত'}
                        {doc.separateSeating ? '\nবোনদের জন্য আলাদা বসার ব্যবস্থা' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {doc.description ? (
                  <div>
                    <h2 className="t-h3">মজলিস সম্পর্কে</h2>
                    <RichText
                      data={doc.description}
                      className="prose-first"
                      style={{ marginTop: 14, fontSize: 17 }}
                    />
                  </div>
                ) : null}

                {agenda.length ? (
                  <div>
                    <h2 className="t-h3">সূচি</h2>
                    <ol
                      className="list-reset"
                      style={{ marginTop: 18, display: 'flex', flexDirection: 'column' }}
                    >
                      {agenda.map((a, i) => (
                        <li
                          key={a.id ?? i}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '120px 1fr',
                            gap: 16,
                            padding: '14px 0',
                            borderBottom:
                              i < agenda.length - 1 ? '1px solid var(--rh-border)' : undefined,
                          }}
                        >
                          <span
                            className="t-small"
                            style={{ fontWeight: 600, color: 'var(--rh-accent-ink)' }}
                          >
                            {a.time}
                          </span>
                          <span>{a.item}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}

                {speakers.length ? (
                  <div>
                    <h2 className="t-h3">আলোচক</h2>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
                        gap: 14,
                        marginTop: 18,
                      }}
                    >
                      {speakers.map(({ person, raw }, i) => (
                        <Link
                          key={person!.id}
                          href={personHref(person!)}
                          className="card card-hover"
                          style={{
                            padding: 18,
                            display: 'flex',
                            gap: 14,
                            alignItems: 'center',
                            textDecoration: 'none',
                            color: 'var(--rh-ink)',
                          }}
                        >
                          <PersonAvatar person={person} size="lg" />
                          <div>
                            <strong style={{ display: 'block' }}>{person!.name}</strong>
                            <span className="t-small t-muted">
                              {notes[i] || raw.specialty || person!.title}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}

                {circle ? (
                  <p className="t-small t-muted">
                    আয়োজনে:{' '}
                    <Link href={`/circles/${circle.slug}`} className="link">
                      {circle.name}
                    </Link>
                  </p>
                ) : null}
              </div>

              <aside
                id="register"
                className="layout-side__aside layout-side__aside--right sticky-col"
                aria-labelledby="reg-title"
                style={{ scrollMarginTop: 96 }}
              >
                <div className="card card-raised card-pad">
                  <RegistrationCard
                    event={{
                      id: doc.id,
                      slug: doc.slug ?? slug,
                      title: doc.title,
                      startsAt: doc.startsAt,
                      capacity: doc.capacity,
                      seatsTaken: doc.seatsTaken ?? 0,
                      open: Boolean(doc.registrationOpen),
                      ended,
                      separateSeating: Boolean(doc.separateSeating),
                      allowGuests: Boolean(doc.allowGuests),
                      mode: doc.mode,
                    }}
                  />
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <JsonLd
        data={[
          eventLd({
            title: doc.title,
            description: doc.summary,
            path,
            startsAt: doc.startsAt,
            endsAt: doc.endsAt,
            online,
            venueName: doc.venueName,
            address: [doc.venueAddress, districtLabel(doc.district)].filter(Boolean).join(', '),
            capacity: doc.capacity,
            remaining: doc.capacity - (doc.seatsTaken ?? 0),
            performers: speakers.map((s) => s.person!.name),
          }),
          breadcrumbLd([
            { name: 'হোম', path: '/' },
            { name: 'মজলিস', path: '/events' },
            { name: doc.title, path },
          ]),
        ]}
      />
    </>
  )
}
