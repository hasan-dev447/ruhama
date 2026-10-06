'use client'

import { IconBook, IconCheck, IconClock, IconNext } from '@/components/icons'
import Link from 'next/link'
import { parseAsStringLiteral, useQueryState } from 'nuqs'

import { Badge, LevelBadge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { Chip, EmptyState, Progress, Skeleton } from '@/components/ui/primitives'
import { useEnrollments } from '@/hooks/use-learning'
import { bn, formatMinutes } from '@/lib/format'
import { journeyLabel } from '@/lib/journey'
import type { CourseCardView } from '@/server/queries/types'
import type { EnrollmentSummary } from '@/server/services/learning'

const TINT_BG = {
  sage: 'var(--rh-sage)',
  gold: 'var(--rh-accent-soft)',
  teal: 'var(--rh-primary-soft)',
} as const

const LEVELS = [
  { value: 'all', label: 'সব' },
  { value: 'beginner', label: 'প্রাথমিক' },
  { value: 'intermediate', label: 'মধ্যম' },
  { value: 'advanced', label: 'উচ্চ' },
] as const

export function CourseCard({
  course,
  enrollment,
}: {
  course: CourseCardView
  enrollment?: EnrollmentSummary
}) {
  const href = `/courses/${course.slug}`
  const continueHref = enrollment?.next ? `${href}/${enrollment.next.slug}` : href
  return (
    <article
      className="card card-hover"
      style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <div
        className="pattern-host"
        style={{
          height: 104,
          background: TINT_BG[course.tint],
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div className="rh-pattern" aria-hidden="true" style={{ opacity: 0.09 }} />
        <Badge style={{ background: 'var(--rh-surface)', color: 'var(--rh-ink)' }}>
          যাত্রার ধাপ: {journeyLabel(course.journeyStage)}
        </Badge>
        <LevelBadge level={course.level} />
      </div>
      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <h3 className="t-h4">
          <Link href={href} style={{ color: 'var(--rh-ink)', textDecoration: 'none' }}>
            {course.title}
          </Link>
        </h3>
        <p className="t-small t-muted clamp-3">{course.description}</p>
        <div className="stat-line">
          <span>
            <IconBook className="ic" aria-hidden="true" />
            {bn(course.lessonCount)} পাঠ
          </span>
          {course.durationMinutes ? (
            <span>
              <IconClock className="ic" aria-hidden="true" />
              {formatMinutes(course.durationMinutes)}
            </span>
          ) : null}
        </div>
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 14,
            borderTop: '1px solid var(--rh-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {enrollment ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span className="t-muted">{enrollment.completed ? 'সম্পন্ন' : 'অগ্রগতি'}</span>
                <span>{bn(enrollment.progress)}%</span>
              </div>
              <Progress value={enrollment.progress} label={`${course.title} কোর্সের অগ্রগতি`} />
              <ButtonLink href={continueHref} size="sm" block>
                {enrollment.completed ? (
                  <>
                    <IconCheck className="ic" aria-hidden="true" /> আবার দেখুন
                  </>
                ) : (
                  'চালিয়ে যান'
                )}
              </ButtonLink>
            </>
          ) : (
            <ButtonLink href={href} variant="secondary" size="sm" block>
              বিনামূল্যে শুরু করুন
            </ButtonLink>
          )}
        </div>
      </div>
    </article>
  )
}

/** "সব কোর্স" grid with a level filter in the URL and the member's progress overlaid. */
export function CourseGrid({ courses }: { courses: CourseCardView[] }) {
  const [level, setLevel] = useQueryState(
    'level',
    parseAsStringLiteral(['all', 'beginner', 'intermediate', 'advanced'] as const)
      .withDefault('all')
      .withOptions({ history: 'replace', shallow: true, scroll: false }),
  )
  const { data: enrollments } = useEnrollments()
  const byCourse = new Map((enrollments ?? []).map((e) => [e.courseId, e]))
  const shown = courses.filter((c) => level === 'all' || c.level === level)

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <h2 className="t-h3">সব কোর্স</h2>
        <div className="chip-row" role="group" aria-label="স্তর অনুযায়ী ফিল্টার">
          {LEVELS.map((l) => (
            <Chip
              key={l.value}
              active={level === l.value}
              onClick={() => void setLevel(l.value === 'all' ? null : l.value)}
            >
              {l.label}
            </Chip>
          ))}
        </div>
      </div>
      {shown.length ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))',
            gap: 20,
          }}
        >
          {shown.map((c) => (
            <CourseCard key={c.id} course={c} enrollment={byCourse.get(Number(c.id))} />
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={<IconBook className="ic ic-xl" aria-hidden="true" />}
            title="এই স্তরে এখনো কোনো কোর্স নেই"
            text="অন্য স্তর বেছে নিন, নতুন কোর্স শিগগিরই আসছে।"
          />
        </div>
      )}
    </div>
  )
}

/** "যেখানে থেমেছিলেন" band. Guests and new members see a suggested first course instead. */
export function ContinueLearning({
  starter,
}: {
  starter:
    | (CourseCardView & {
        firstLesson: string | null
        modules: { title: string; lessonCount: number }[]
      })
    | null
}) {
  const { data: enrollments, isPending, signedIn, sessionPending } = useEnrollments()
  if (sessionPending || (signedIn && isPending)) {
    return <Skeleton style={{ height: 280, borderRadius: 'var(--rh-radius-lg)' }} />
  }
  const current = (enrollments ?? []).find((e) => !e.completed && e.next) ?? null

  if (current) {
    const href = `/courses/${current.courseSlug}/${current.next!.slug}`
    const currentModule = current.next!.module
    return (
      <Band
        eyebrow="যেখানে থেমেছিলেন"
        title={current.courseTitle}
        text={`পরবর্তী পাঠ ${bn(current.next!.order)}: ${current.next!.title}`}
        progress={{
          value: current.progress,
          label: `${bn(current.lessonCount)} পাঠের ${bn(current.completedLessons)}টি সম্পন্ন`,
        }}
        cta={{ href, label: 'পাঠ চালিয়ে যান' }}
        outlineHref={`/courses/${current.courseSlug}`}
        modules={current.modules.map((m, i) => ({
          title: `মডিউল ${bn(i + 1)}: ${m.title}`,
          state:
            m.lessonCount > 0 && m.doneCount >= m.lessonCount
              ? 'done'
              : i + 1 === currentModule
                ? 'current'
                : 'todo',
          note:
            m.lessonCount > 0 && m.doneCount >= m.lessonCount
              ? `${bn(m.lessonCount)} পাঠ`
              : i + 1 === currentModule
                ? 'চলছে'
                : `${bn(m.lessonCount)} পাঠ`,
        }))}
      />
    )
  }
  if (!starter) return null
  const href = starter.firstLesson
    ? `/courses/${starter.slug}/${starter.firstLesson}`
    : `/courses/${starter.slug}`
  return (
    <Band
      eyebrow={signedIn ? 'আপনার প্রথম কোর্স' : 'এখান থেকে শুরু করুন'}
      title={starter.title}
      text={starter.description}
      cta={{ href, label: 'প্রথম পাঠ শুরু করুন' }}
      outlineHref={`/courses/${starter.slug}`}
      modules={starter.modules.map((m, i) => ({
        title: `মডিউল ${bn(i + 1)}: ${m.title}`,
        state: i === 0 ? 'current' : 'todo',
        note: `${bn(m.lessonCount)} পাঠ`,
      }))}
    />
  )
}

function Band({
  eyebrow,
  title,
  text,
  progress,
  cta,
  modules,
  outlineHref,
}: {
  eyebrow: string
  title: string
  text: string
  progress?: { value: number; label: string }
  cta: { href: string; label: string }
  modules: { title: string; state: 'done' | 'current' | 'todo'; note: string }[]
  outlineHref: string
}) {
  return (
    <div
      className="card card-raised"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))',
        overflow: 'hidden',
      }}
    >
      <div
        className="pattern-host"
        style={{
          background: 'var(--rh-band-bg)',
          color: 'var(--rh-band-ink)',
          padding: 36,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          justifyContent: 'center',
        }}
      >
        <div
          className="rh-pattern"
          aria-hidden="true"
          style={{ backgroundColor: '#F3E9D6', opacity: 0.08 }}
        />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#D4A95C' }}>{eyebrow}</span>
        <h2 className="t-h3" style={{ color: 'var(--rh-band-ink)' }}>
          {title}
        </h2>
        <p className="clamp-3" style={{ color: 'var(--rh-band-muted)' }}>
          {text}
        </p>
        {progress ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 360 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 14,
                color: 'var(--rh-band-muted)',
              }}
            >
              <span>{progress.label}</span>
              <span>{bn(progress.value)}%</span>
            </div>
            <Progress
              value={progress.value}
              gold
              label="কোর্স অগ্রগতি"
              style={{ background: 'rgba(255,255,255,0.14)' }}
            />
          </div>
        ) : null}
        <div>
          <ButtonLink href={cta.href} variant="gold" style={{ marginTop: 8 }}>
            {cta.label} <IconNext className="ic" aria-hidden="true" />
          </ButtonLink>
        </div>
      </div>
      <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h3 className="t-h4" style={{ marginBottom: 8 }}>
          কোর্সের বিষয়সূচি
        </h3>
        <div className="course-outline">
          {modules.map((m, i) => (
            <Link
              key={m.title}
              href={outlineHref}
              className={`lesson-item${m.state === 'current' ? ' is-current' : ''}`}
            >
              <span
                className={`lesson-state${m.state === 'done' ? ' is-done' : m.state === 'current' ? ' is-current' : ''}`}
              >
                {m.state === 'done' ? (
                  <IconCheck className="ic ic-sm" aria-hidden="true" />
                ) : (
                  bn(i + 1)
                )}
              </span>
              {m.title}
              <span
                className={`t-caption${m.state === 'current' ? '' : ' t-muted'}`}
                style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}
              >
                {m.note}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
