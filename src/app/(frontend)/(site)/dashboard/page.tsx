import {
  IconBook,
  IconBookmark,
  IconCalendar,
  IconExplore,
  IconNext,
  IconPencil,
  IconQuestion,
  IconSettings,
} from '@/components/icons'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { isProfileIncomplete } from '@/lib/profile-complete'
import { Suspense } from 'react'

import { JourneyProgress } from '@/components/dashboard/journey-progress'
import { Badge, ModeBadge } from '@/components/ui/badge'
import { ButtonLink, LinkArrow } from '@/components/ui/button'
import { DateTile, EmptyState, Progress, Skeleton } from '@/components/ui/primitives'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserAvatar } from '@/components/ui/user-avatar'
import { districtLabel } from '@/lib/districts'
import { bn, formatDate, formatDay, formatMonth, formatTime, formatWeekday } from '@/lib/format'
import { journeyIndex, journeyLabel, JOURNEY_STAGES } from '@/lib/journey'
import { INTEREST_OPTIONS } from '@/lib/options'
import { buildMetadata } from '@/lib/seo'
import type { User } from '@/payload-types'
import { actionContext } from '@/server/action-context'
import { data } from '@/server/data'
import type { ServiceContext } from '@/server/services/context'
import { listBookmarks } from '@/server/services/bookmarks'
import { myEnrollments } from '@/server/services/learning'
import { myQuestions, myRegistrations } from '@/server/services/member'

export const metadata: Metadata = buildMetadata({
  title: 'আমার ড্যাশবোর্ড',
  path: '/dashboard',
  noIndex: true,
})

/** An event stays "upcoming" until three hours after it starts. */
const hasPassed = (startsAt: string) => new Date(startsAt).getTime() < Date.now() - 3 * 3600 * 1000

const ORDINALS = ['প্রথম', 'দ্বিতীয়', 'তৃতীয়', 'চতুর্থ', 'পঞ্চম', 'ষষ্ঠ', 'সপ্তম', 'অষ্টম']
const QUESTION_BADGE = {
  answered: { variant: 'reviewed', label: 'উত্তর এসেছে' },
  in_review: { variant: 'warning', label: 'রিভিউ চলছে' },
  pending: { variant: 'neutral', label: 'অপেক্ষমাণ' },
  rejected: { variant: 'neutral', label: 'প্রকাশ হয়নি' },
} as const

function Section({
  id,
  title,
  action,
  children,
}: {
  id: string
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="card card-pad" aria-labelledby={id}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
          gap: 12,
        }}
      >
        <h2 id={id} className="t-h4">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

async function DashboardBody({ ctx, user }: { ctx: ServiceContext; user: User }) {
  const [enrollments, registrations, saved, questions, courses] = await Promise.all([
    myEnrollments(ctx),
    myRegistrations(ctx),
    listBookmarks(ctx, { limit: 30 }),
    myQuestions(ctx),
    data.courses(null),
  ])
  const stage = journeyIndex(user.journeyStage)
  const stageCourse = courses.find((c) => c.journeyStage === JOURNEY_STAGES[stage]?.value)
  const active = enrollments.filter((e) => !e.completed)
  const continueHref = active[0]?.next
    ? `/courses/${active[0].courseSlug}/${active[0].next.slug}`
    : '/courses'
  const upcoming = registrations.docs.filter((r) => !hasPassed(r.event.startsAt))

  const coursesList = (list: typeof enrollments) =>
    list.length ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {list.map((e) => (
          <div key={e.courseId} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <Link
                href={
                  e.next ? `/courses/${e.courseSlug}/${e.next.slug}` : `/courses/${e.courseSlug}`
                }
                style={{ fontWeight: 600, color: 'var(--rh-ink)', textDecoration: 'none' }}
              >
                {e.courseTitle}
              </Link>
              <span className="t-small t-muted">{bn(e.progress)}%</span>
            </div>
            <Progress value={e.progress} label={`${e.courseTitle} অগ্রগতি`} />
            <span className="t-caption t-muted">
              {e.completed
                ? 'মাশাআল্লাহ, কোর্স সম্পন্ন'
                : e.next
                  ? `পরবর্তী: পাঠ ${bn(e.next.order)} · ${e.next.title}`
                  : 'শুরু করুন'}
            </span>
          </div>
        ))}
      </div>
    ) : (
      <EmptyState
        icon={<IconBook className="ic ic-xl" aria-hidden="true" />}
        title="এখনো কোনো কোর্স শুরু করেননি"
        text="নিজের গতিতে শিখুন; অগ্রগতি এখানে জমা থাকবে।"
      >
        <ButtonLink href="/courses" size="sm">
          কোর্স দেখুন
        </ButtonLink>
      </EmptyState>
    )

  const eventsList = (list: typeof registrations.docs) =>
    list.length ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map((r) => (
          <Link
            key={r.id}
            href={`/events/${r.event.slug}`}
            className="row-link"
            style={{ padding: '10px 0' }}
          >
            <DateTile
              size="xs"
              day={formatDay(r.event.startsAt)}
              month={formatMonth(r.event.startsAt)}
            />
            <span style={{ flex: 1 }}>
              <span className="row-link__title" style={{ display: 'block' }}>
                {r.event.title}
              </span>
              <span className="t-small t-muted">
                {[
                  `${formatWeekday(r.event.startsAt)}, ${r.event.timeLabel || formatTime(r.event.startsAt)}`,
                  r.event.mode === 'online' ? 'অনলাইন' : districtLabel(r.event.district),
                  bn(r.code),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </span>
            <ModeBadge mode={r.event.mode} />
          </Link>
        ))}
      </div>
    ) : (
      <EmptyState
        icon={<IconCalendar className="ic ic-xl" aria-hidden="true" />}
        title="কোনো মজলিসে রেজিস্টার করা নেই"
        text="আসন্ন মজলিসগুলো দেখে নিন; অনলাইনে বা নিজের জেলায়।"
      >
        <ButtonLink href="/events" size="sm">
          মজলিস দেখুন
        </ButtonLink>
      </EmptyState>
    )

  const savedList = (limit: number) =>
    saved.docs.length ? (
      <ul className="list-reset">
        {saved.docs.slice(0, limit).map((b) => (
          <li key={b.id}>
            <Link href={b.href} className="row-link">
              <IconBookmark
                className="ic"
                aria-hidden="true"
                fill="currentColor"
                style={{ color: 'var(--rh-accent)' }}
              />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="row-link__title clamp-2" style={{ display: 'block' }}>
                  {b.title}
                </span>
                <span className="t-small t-muted">{b.meta}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    ) : (
      <EmptyState
        icon={<IconBookmark className="ic ic-xl" aria-hidden="true" />}
        title="কিছু সংরক্ষণ করা নেই"
        text="প্রবন্ধ, আয়াত বা হাদিসে বুকমার্ক চাপলে এখানে জমা হবে; সংরক্ষিত প্রবন্ধ ইন্টারনেট ছাড়াও পড়া যাবে।"
      />
    )

  const questionsList = (limit: number) =>
    questions.length ? (
      <ul className="list-reset">
        {questions.slice(0, limit).map((q) => {
          const badge = QUESTION_BADGE[q.status]
          const inner = (
            <>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="row-link__title" style={{ display: 'block' }}>
                  {q.title}
                </span>
                <span className="t-small t-muted">
                  জমা: {formatDate(q.submittedAt)}
                  {q.note ? ` · ${q.note}` : ''}
                </span>
              </span>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </>
          )
          return (
            <li key={q.id}>
              {q.status === 'answered' && q.slug ? (
                <Link href={`/qa/${q.slug}`} className="row-link">
                  {inner}
                </Link>
              ) : (
                <div className="row-link" style={{ cursor: 'default' }}>
                  {inner}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    ) : (
      <EmptyState
        icon={<IconQuestion className="ic ic-xl" aria-hidden="true" />}
        title="এখনো কোনো প্রশ্ন করেননি"
        text="দ্বীনি যেকোনো জিজ্ঞাসা আলিম প্যানেলের কাছে পাঠাতে পারেন।"
      >
        <ButtonLink href="/qa#ask" size="sm">
          প্রশ্ন করুন
        </ButtonLink>
      </EmptyState>
    )

  return (
    <Tabs defaultValue="overview">
      <div className="rh-container">
        <TabsList label="ড্যাশবোর্ড বিভাগ" style={{ marginTop: -1, borderBottom: 0 }}>
          <TabsTrigger value="overview">সারসংক্ষেপ</TabsTrigger>
          <TabsTrigger value="courses">কোর্স</TabsTrigger>
          <TabsTrigger value="saved">সংরক্ষিত</TabsTrigger>
          <TabsTrigger value="questions">প্রশ্ন</TabsTrigger>
          <TabsTrigger value="events">মজলিস</TabsTrigger>
        </TabsList>
      </div>
      <section className="section-sm" style={{ borderTop: '1px solid var(--rh-border)' }}>
        <div className="rh-container">
          <TabsContent
            value="overview"
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            <section className="card card-pad" aria-labelledby="my-journey">
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div>
                  <span className="eyebrow">আমার যাত্রা</span>
                  <h2 id="my-journey" className="t-h3" style={{ marginTop: 6 }}>
                    আপনি এখন {ORDINALS[stage]} ধাপে: {journeyLabel(user.journeyStage)}
                  </h2>
                </div>
                <p className="t-small t-muted" style={{ maxWidth: 380 }}>
                  এটি আত্মমূল্যায়ন, কোনো র‍্যাংকিং নয়। যেকোনো ধাপে ফিরে গিয়ে আবার পড়তে পারেন।{' '}
                  <Link href="/settings#journey" className="link">
                    ধাপ বদলান
                  </Link>
                </p>
              </div>
              <JourneyProgress current={stage} />
              {stageCourse ? (
                <div
                  className="adab-strip"
                  style={{ marginTop: 20, alignItems: 'center', flexWrap: 'wrap' }}
                >
                  <IconExplore
                    className="ic"
                    aria-hidden="true"
                    style={{ color: 'var(--rh-primary)' }}
                  />
                  <p className="t-small" style={{ flex: '1 1 260px' }}>
                    এই ধাপের জন্য প্রস্তাবিত: “{stageCourse.title}” কোর্স।
                  </p>
                  <ButtonLink href={`/courses/${stageCourse.slug}`} size="sm">
                    শুরু করুন
                  </ButtonLink>
                </div>
              ) : null}
            </section>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(460px, 100%), 1fr))',
                gap: 24,
                alignItems: 'start',
              }}
            >
              <Section
                id="d-courses"
                title="আমার কোর্স"
                action={<LinkArrow href="/courses">সব</LinkArrow>}
              >
                {coursesList(active.slice(0, 3))}
                {active.length ? (
                  <ButtonLink href={continueHref} size="sm" style={{ marginTop: 18 }}>
                    পাঠ চালিয়ে যান
                  </ButtonLink>
                ) : null}
              </Section>
              <Section
                id="d-events"
                title="রেজিস্টার করা মজলিস"
                action={<LinkArrow href="/events">সব</LinkArrow>}
              >
                {eventsList(upcoming.slice(0, 3))}
              </Section>
              <Section
                id="d-saved"
                title="সংরক্ষিত"
                action={<span className="t-small t-muted">{bn(saved.totalDocs)}টি</span>}
              >
                {savedList(4)}
              </Section>
              <Section
                id="d-qs"
                title="আমার প্রশ্ন"
                action={<LinkArrow href="/qa#ask">নতুন প্রশ্ন</LinkArrow>}
              >
                {questionsList(4)}
              </Section>
            </div>
          </TabsContent>
          <TabsContent value="courses">
            <Section id="t-courses" title="আমার সব কোর্স">
              {coursesList(enrollments)}
            </Section>
          </TabsContent>
          <TabsContent value="saved">
            <Section id="t-saved" title={`সংরক্ষিত (${bn(saved.totalDocs)})`}>
              {savedList(30)}
            </Section>
          </TabsContent>
          <TabsContent value="questions">
            <Section
              id="t-qs"
              title="আমার সব প্রশ্ন"
              action={<LinkArrow href="/qa#ask">নতুন প্রশ্ন</LinkArrow>}
            >
              {questionsList(50)}
            </Section>
          </TabsContent>
          <TabsContent value="events">
            <Section id="t-events" title="আমার মজলিস">
              {eventsList(registrations.docs)}
            </Section>
          </TabsContent>
        </div>
      </section>
    </Tabs>
  )
}

function BodySkeleton() {
  return (
    <div
      className="rh-container"
      style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBlock: 32 }}
      aria-busy="true"
    >
      <Skeleton style={{ height: 44, width: 420, maxWidth: '100%' }} />
      <Skeleton style={{ height: 220, borderRadius: 'var(--rh-radius-lg)' }} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(460px, 100%), 1fr))',
          gap: 24,
        }}
      >
        <Skeleton style={{ height: 240, borderRadius: 'var(--rh-radius-lg)' }} />
        <Skeleton style={{ height: 240, borderRadius: 'var(--rh-radius-lg)' }} />
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const ctx = await actionContext()
  const user = ctx.user
  if (!user) redirect('/login?next=/dashboard')
  if (isProfileIncomplete(user)) redirect('/onboarding?next=/dashboard')
  const interests = (user.interests ?? [])
    .map((v) => INTEREST_OPTIONS.find((o) => o.value === v)?.label)
    .filter(Boolean)

  return (
    <main id="main">
      <section className="page-hero" style={{ padding: '40px 0 24px' }}>
        <div className="rh-pattern" aria-hidden="true" />
        <div className="rh-container">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
            <UserAvatar
              name={user.name}
              tone={user.avatarColor === 'teal' ? 'teal' : 'gold'}
              size="xl"
              ring
            />
            <div style={{ flex: '1 1 320px' }}>
              <p className="t-muted">আসসালামু আলাইকুম,</p>
              <h1 className="t-h2">{user.name}</h1>
              <p className="t-small t-muted">
                {[
                  user.district ? districtLabel(user.district) : null,
                  `সদস্য ${formatDate(user.createdAt).split(' ').slice(1).join(' ')} থেকে`,
                  interests.length ? `আগ্রহ: ${interests.join(', ')}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {user.username ? (
                <ButtonLink href={`/members/${user.username}`} variant="ghost" size="sm">
                  প্রোফাইল দেখুন <IconNext className="ic" aria-hidden="true" />
                </ButtonLink>
              ) : null}
              <ButtonLink href="/settings" variant="secondary" size="sm">
                <IconPencil className="ic" aria-hidden="true" />
                প্রোফাইল সম্পাদনা
              </ButtonLink>
              <ButtonLink href="/settings#account" variant="ghost" size="sm" aria-label="সেটিংস">
                <IconSettings className="ic" aria-hidden="true" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
      <Suspense fallback={<BodySkeleton />}>
        <DashboardBody ctx={ctx} user={user} />
      </Suspense>
    </main>
  )
}
