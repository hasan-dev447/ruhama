import {
  BookOpen,
  CalendarDays,
  Info,
  Lock,
  MapPin,
  MessagesSquare,
  ThumbsUp,
  Users,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { JourneyProgress } from '@/components/dashboard/journey-progress'
import { OwnerEditButton } from '@/components/members/owner-edit'
import { Badge } from '@/components/ui/badge'
import { IconTile } from '@/components/ui/primitives'
import { districtLabel } from '@/lib/districts'
import { bn, formatDate, formatRelative, initials } from '@/lib/format'
import { journeyIndex, journeyLabel, JOURNEY_STAGES } from '@/lib/journey'
import { ROLE_LABELS, type Role } from '@/lib/roles'
import { buildMetadata } from '@/lib/seo'
import { cn } from '@/lib/utils'
import { data } from '@/server/data'

export const revalidate = 3600

type Props = { params: Promise<{ username: string }> }

/** Generated on first visit and cached; privacy changes refresh it immediately. */
export function generateStaticParams() {
  return []
}

const ACTIVITY_ICON = { thread: MessagesSquare, helpful: ThumbsUp, circle: Users } as const
const monthYear = (iso: string) => formatDate(iso).split(' ').slice(1).join(' ')

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const member = await data.member(username)
  if (!member)
    return buildMetadata({
      title: 'প্রোফাইল পাওয়া যায়নি',
      path: `/members/${username}`,
      noIndex: true,
    })
  // member pages are for the community, not search engines
  return buildMetadata({
    title: member.name,
    path: `/members/${username}`,
    type: 'profile',
    noIndex: true,
  })
}

export default async function MemberProfilePage({ params }: Props) {
  const { username } = await params
  const member = await data.member(username)
  if (!member) notFound()
  const role = member.roles.find((r) => r !== 'member') as Role | undefined
  const stage = member.journeyStage ? journeyIndex(member.journeyStage) : null

  return (
    <main id="main">
      <div className="cover-band" aria-hidden="true" style={{ height: 160 }}>
        <div className="rh-pattern" />
      </div>
      <div className="rh-container" style={{ paddingBottom: 96 }}>
        <div className="profile-head">
          <span
            className={cn('avatar-hero', member.avatarColor === 'teal' && 'avatar-hero--teal')}
            aria-hidden="true"
          >
            {initials(member.name)}
          </span>
          <div
            style={{
              flex: '1 1 380px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              paddingBottom: 4,
            }}
          >
            <h1 className="t-h2">{member.name}</h1>
            <div className="stat-line">
              {member.district ? (
                <span>
                  <MapPin className="ic" aria-hidden="true" />
                  {districtLabel(member.district)}
                </span>
              ) : null}
              <span>
                <CalendarDays className="ic" aria-hidden="true" />
                যোগদান: {monthYear(member.joinedAt)}
              </span>
              <Badge variant="cat">{role ? ROLE_LABELS[role] : 'সদস্য'}</Badge>
            </div>
            {member.bio ? (
              <p className="t-muted" style={{ marginTop: 6, maxWidth: '60ch' }}>
                {member.bio}
              </p>
            ) : null}
          </div>
          <OwnerEditButton username={member.username} />
        </div>

        {member.isPublic ? (
          <>
            {stage !== null ? (
              <section
                className="card card-pad"
                aria-labelledby="mp-journey"
                style={{ marginTop: 36 }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 8,
                    marginBottom: 18,
                  }}
                >
                  <h2 id="mp-journey" className="t-h4">
                    যাত্রার ধাপ
                  </h2>
                  <span
                    className="t-small"
                    style={{ color: 'var(--rh-accent-ink)', fontWeight: 600 }}
                  >
                    {bn(JOURNEY_STAGES.length)} ধাপের {bn(stage + 1)}ম:{' '}
                    {journeyLabel(member.journeyStage)}
                  </span>
                </div>
                <JourneyProgress current={stage} />
              </section>
            ) : null}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))',
                gap: 24,
                marginTop: 24,
                alignItems: 'start',
              }}
            >
              <section className="card card-pad" aria-labelledby="mp-done">
                <h2 id="mp-done" className="t-h4" style={{ marginBottom: 12 }}>
                  সম্পন্ন কোর্স
                </h2>
                {member.completedCourses.length ? (
                  <ul className="list-reset">
                    {member.completedCourses.map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={`/courses/${c.slug}`}
                          className="row-link"
                          style={{ padding: '12px 0' }}
                        >
                          <IconTile size={40}>
                            <BookOpen className="ic" aria-hidden="true" />
                          </IconTile>
                          <span style={{ flex: 1 }}>
                            <span className="row-link__title" style={{ display: 'block' }}>
                              {c.title}
                            </span>
                            <span className="t-small t-muted">
                              সম্পন্ন: {monthYear(c.completedAt)}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="t-small t-muted">
                    এখনো কোনো কোর্স সম্পন্ন হয়নি, বা সদস্য এটি পাবলিক রাখেননি।
                  </p>
                )}
              </section>
              <section className="card card-pad" aria-labelledby="mp-act">
                <h2 id="mp-act" className="t-h4" style={{ marginBottom: 12 }}>
                  সাম্প্রতিক পাবলিক কার্যক্রম
                </h2>
                {member.activity.length ? (
                  <ul className="list-reset">
                    {member.activity.map((a, i) => {
                      const Icon = ACTIVITY_ICON[a.kind]
                      return (
                        <li key={`${a.kind}-${i}`}>
                          <Link href={a.href} className="row-link" style={{ padding: '12px 0' }}>
                            <Icon
                              className="ic"
                              aria-hidden="true"
                              style={{ color: 'var(--rh-primary)' }}
                            />
                            <span style={{ flex: 1 }}>
                              <span className="row-link__title" style={{ display: 'block' }}>
                                {a.text}
                              </span>
                              <span className="t-small t-muted">
                                {a.kind === 'circle'
                                  ? `${monthYear(a.at)} থেকে`
                                  : formatRelative(a.at)}
                              </span>
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="t-small t-muted">দেখানোর মতো কোনো পাবলিক কার্যক্রম নেই।</p>
                )}
              </section>
            </div>
          </>
        ) : (
          <div className="card" style={{ marginTop: 36 }}>
            <div className="empty">
              <span className="empty__icon">
                <Lock className="ic ic-lg" aria-hidden="true" />
              </span>
              <h2 className="t-h4">এই প্রোফাইলটি প্রাইভেট</h2>
              <p className="t-small t-muted" style={{ maxWidth: 380 }}>
                সদস্য তাঁর কার্যক্রম শুধু নিজের জন্য রেখেছেন। নাম ও জেলা ছাড়া আর কিছু দেখানো হচ্ছে
                না।
              </p>
            </div>
          </div>
        )}

        <div className="privacy-note" style={{ marginTop: 24 }}>
          <Info className="ic" aria-hidden="true" />
          <span>
            <strong style={{ color: 'var(--rh-ink)' }}>গোপনীয়তা:</strong> এই পাতায় শুধু সেটুকুই
            দেখা যায় যা সদস্য নিজে পাবলিক রেখেছেন। ফোন নম্বর, ইমেইল, জমা দেওয়া প্রশ্ন ও সংরক্ষিত
            লেখা কখনো অন্য কাউকে দেখানো হয় না।{' '}
            <Link className="link" href="/settings#privacy">
              প্রাইভেসি সেটিংস
            </Link>
          </span>
        </div>
      </div>
    </main>
  )
}
