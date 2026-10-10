import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { JourneyProgress } from '@/components/dashboard/journey-progress'
import {
  IconBook,
  IconCalendar,
  IconDiscussion,
  IconHelpful,
  IconInfo,
  IconLocation,
  IconLock,
  IconUsers,
} from '@/components/icons'
import { ProfileCover } from '@/components/profile/profile-cover'
import { ProfilePhoto } from '@/components/profile/profile-photo'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { IconTile } from '@/components/ui/primitives'
import { districtLabel } from '@/lib/districts'
import { bn, formatDate, formatRelative } from '@/lib/format'
import { genderLabel } from '@/lib/gender'
import { journeyIndex, journeyLabel, JOURNEY_STAGES } from '@/lib/journey'
import { canViewProfile, VISIBILITY, type SectionKey } from '@/lib/profile-privacy'
import { ROLE_LABELS, type Role } from '@/lib/roles'
import { buildMetadata } from '@/lib/seo'
import { actionContext } from '@/server/action-context'
import { data } from '@/server/data'
import { can } from '@/server/permissions'

/**
 * Who sees what depends on the viewer (everyone, members only, chosen people, only the owner), so the
 * page renders per request. The profile data itself is cached and refreshed when the owner saves.
 */
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ username: string }> }

const ACTIVITY_ICON = { thread: IconDiscussion, helpful: IconHelpful, circle: IconUsers } as const
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
  const [member, { user: viewer }] = await Promise.all([data.member(username), actionContext()])
  if (!member) notFound()
  const role = member.roles.find((r) => r !== 'member') as Role | undefined
  const isOwner = viewer?.id === member.id
  const allowed = canViewProfile(
    member.privacy,
    viewer ? { id: viewer.id, staff: await can(viewer, 'forum.moderate') } : null,
    member.id,
  )
  const show = (key: SectionKey) => allowed && member.privacy[key]
  const stage =
    show('showJourney') && member.journeyStage ? journeyIndex(member.journeyStage) : null
  const gender = genderLabel(member.gender)
  const visibility = VISIBILITY.find((v) => v.value === member.privacy.visibility)

  return (
    <main id="main">
      <ProfileCover cover={show('showCover') ? member.cover : null} />
      <div className="rh-container" style={{ paddingBottom: 96 }}>
        <div className="profile-head">
          <ProfilePhoto
            name={member.name}
            photo={show('showPhoto') ? member.photo : null}
            tone={member.avatarColor === 'teal' ? 'teal' : 'gold'}
          />
          <div
            className="profile-head__info"
            style={{
              flex: '1 1 380px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              paddingBottom: 4,
            }}
          >
            <div
              style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px' }}
            >
              <h1 className="t-h2">{member.name}</h1>
              {gender ? <Badge variant="neutral">{gender}</Badge> : null}
            </div>
            <div className="stat-line">
              {show('showDistrict') && member.district ? (
                <span>
                  <IconLocation className="ic" />
                  {districtLabel(member.district)}
                </span>
              ) : null}
              {allowed ? (
                <span>
                  <IconCalendar className="ic" />
                  যোগদান: {monthYear(member.joinedAt)}
                </span>
              ) : null}
              <Badge variant="cat">{role ? ROLE_LABELS[role] : 'সদস্য'}</Badge>
            </div>
            {show('showBio') && member.bio ? (
              <p className="t-muted" style={{ marginTop: 6, maxWidth: '60ch' }}>
                {member.bio}
              </p>
            ) : null}
          </div>
          {isOwner ? (
            <ButtonLink
              href="/settings#profile"
              variant="secondary"
              size="sm"
              style={{ marginBottom: 4 }}
            >
              প্রোফাইল সম্পাদনা
            </ButtonLink>
          ) : null}
        </div>

        {isOwner ? (
          <div className="privacy-note" style={{ marginTop: 24 }}>
            <IconLock className="ic" />
            <span>
              আপনার প্রোফাইল এখন দেখতে পারেন:{' '}
              <strong style={{ color: 'var(--rh-ink)' }}>{visibility?.label}</strong>। অন্যরা শুধু
              আপনার চালু রাখা অংশগুলো দেখবেন।{' '}
              <Link className="link" href="/settings#privacy">
                বদলান
              </Link>
            </span>
          </div>
        ) : null}

        {allowed ? (
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
            {show('showActivity') ? (
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
                              <IconBook className="ic" />
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
                    <p className="t-small t-muted">এখনো কোনো কোর্স সম্পন্ন হয়নি।</p>
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
                              <Icon className="ic" style={{ color: 'var(--rh-primary)' }} />
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
            ) : null}
          </>
        ) : (
          <div className="card" style={{ marginTop: 36 }}>
            <div className="empty">
              <span className="empty__icon">
                <IconLock className="ic ic-lg" />
              </span>
              {member.privacy.visibility === 'members' && !viewer ? (
                <>
                  <h2 className="t-h4">শুধু সদস্যদের জন্য</h2>
                  <p className="t-small t-muted" style={{ maxWidth: 380 }}>
                    এই প্রোফাইল দেখতে লগইন করুন।
                  </p>
                  <ButtonLink href={`/login?next=/members/${member.username}`} size="sm">
                    লগইন করুন
                  </ButtonLink>
                </>
              ) : (
                <>
                  <h2 className="t-h4">এই প্রোফাইলটি লক করা</h2>
                  <p className="t-small t-muted" style={{ maxWidth: 380 }}>
                    {gender ?? 'সদস্য'} তাঁর প্রোফাইল শুধু নির্দিষ্ট কয়েকজনের জন্য রেখেছেন। নাম
                    ছাড়া আর কিছু দেখানো হচ্ছে না।
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        <div className="privacy-note" style={{ marginTop: 24 }}>
          <IconInfo className="ic" />
          <span>
            <strong style={{ color: 'var(--rh-ink)' }}>গোপনীয়তা:</strong> এই পাতায় শুধু সেটুকুই
            দেখা যায় যা সদস্য নিজে দেখাতে চেয়েছেন। ফোন নম্বর, ইমেইল, জমা দেওয়া প্রশ্ন ও সংরক্ষিত
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
