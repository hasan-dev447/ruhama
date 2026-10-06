'use client'

import { useQueryClient } from '@tanstack/react-query'
import { IconCheck, IconLogin, IconNext } from '@/components/icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { enrollAction } from '@/actions/learning'
import { Button, ButtonLink } from '@/components/ui/button'
import { Progress } from '@/components/ui/primitives'
import { courseProgressKey, enrollmentsKey, useCourseProgress } from '@/hooks/use-learning'
import { bn, formatMinutes } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { OutlineLesson } from '@/server/queries/learning'

export type OutlineModule = { title: string; summary?: string | null; lessons: OutlineLesson[] }

function LessonLink({
  lesson,
  href,
  done,
  current,
}: {
  lesson: OutlineLesson
  href: string
  done: boolean
  current: boolean
}) {
  return (
    <Link
      href={href}
      className={cn('lesson-item', current && 'is-current')}
      aria-current={current ? 'page' : undefined}
    >
      <span className={cn('lesson-state', done ? 'is-done' : current && 'is-current')}>
        {done ? <IconCheck className="ic ic-sm" aria-label="সম্পন্ন" /> : bn(lesson.order)}
      </span>
      <span style={{ flex: 1 }}>{lesson.title}</span>
      {lesson.durationMinutes ? (
        <span className="t-caption t-muted" style={{ whiteSpace: 'nowrap' }}>
          {bn(lesson.durationMinutes)} মি.
        </span>
      ) : null}
    </Link>
  )
}

/** Modules with their lessons; completed lessons are ticked for the signed-in member. */
export function CourseOutline({
  courseId,
  courseSlug,
  modules,
}: {
  courseId: number
  courseSlug: string
  modules: OutlineModule[]
}) {
  const { data } = useCourseProgress(courseId)
  const done = new Set(data?.completedLessonIds ?? [])
  const next = modules.flatMap((m) => m.lessons).find((l) => !done.has(l.id))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {modules.map((m, i) => {
        const moduleDone = m.lessons.length > 0 && m.lessons.every((l) => done.has(l.id))
        return (
          <section
            key={m.title}
            className="card"
            style={{ padding: 18 }}
            aria-labelledby={`module-${i + 1}`}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '4px 8px 12px',
                borderBottom: '1px solid var(--rh-border)',
                marginBottom: 8,
              }}
            >
              <div style={{ flex: 1 }}>
                <span className="t-caption t-muted">মডিউল {bn(i + 1)}</span>
                <h3 id={`module-${i + 1}`} className="t-h4" style={{ fontSize: 18 }}>
                  {m.title}
                </h3>
                {m.summary ? (
                  <p className="t-small t-muted" style={{ marginTop: 4 }}>
                    {m.summary}
                  </p>
                ) : null}
              </div>
              <span className={cn('badge', moduleDone && 'badge-sahih')} style={{ flex: 'none' }}>
                {moduleDone ? 'সম্পন্ন' : `${bn(m.lessons.length)} পাঠ`}
              </span>
            </div>
            <nav className="course-outline" aria-label={`মডিউল ${bn(i + 1)}-এর পাঠ`}>
              {m.lessons.map((l) => (
                <LessonLink
                  key={l.id}
                  lesson={l}
                  href={`/courses/${courseSlug}/${l.slug}`}
                  done={done.has(l.id)}
                  current={Boolean(data?.enrolled) && next?.id === l.id}
                />
              ))}
            </nav>
          </section>
        )
      })}
    </div>
  )
}

/** Flat lesson list in the lesson page sidebar. */
export function LessonSidebarList({
  courseId,
  courseSlug,
  lessons,
  currentId,
}: {
  courseId: number
  courseSlug: string
  lessons: OutlineLesson[]
  currentId: number
}) {
  const { data } = useCourseProgress(courseId)
  const done = new Set(data?.completedLessonIds ?? [])
  return (
    <nav className="course-outline" aria-label="পাঠসমূহ">
      {lessons.map((l) => (
        <LessonLink
          key={l.id}
          lesson={l}
          href={`/courses/${courseSlug}/${l.slug}`}
          done={done.has(l.id)}
          current={l.id === currentId}
        />
      ))}
    </nav>
  )
}

/** Primary course action: enrol and start, continue, or (for guests) start reading and log in to save progress. */
export function CourseCta({
  courseId,
  courseSlug,
  lessons,
  totalMinutes,
}: {
  courseId: number
  courseSlug: string
  lessons: OutlineLesson[]
  totalMinutes: number | null
}) {
  const router = useRouter()
  const qc = useQueryClient()
  const { data, signedIn, sessionPending } = useCourseProgress(courseId)
  const [pending, startTransition] = useTransition()
  const done = new Set(data?.completedLessonIds ?? [])
  const next = lessons.find((l) => !done.has(l.id)) ?? lessons[0]
  const nextHref = next ? `/courses/${courseSlug}/${next.slug}` : `/courses/${courseSlug}`

  function start() {
    startTransition(async () => {
      const res = await enrollAction(courseId)
      if (!res.ok) {
        toast.error('কোর্সে যুক্ত হওয়া যায়নি', { description: res.error })
        return
      }
      void qc.invalidateQueries({ queryKey: courseProgressKey(courseId) })
      void qc.invalidateQueries({ queryKey: enrollmentsKey })
      toast.success('কোর্সে স্বাগতম!', { description: 'আপনার অগ্রগতি এখন থেকে সংরক্ষিত থাকবে।' })
      router.push(nextHref)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data?.enrolled ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <span className="t-muted">আপনার অগ্রগতি</span>
            <strong>{bn(data.progress)}%</strong>
          </div>
          <Progress value={data.progress} label="কোর্স অগ্রগতি" />
          <ButtonLink href={nextHref} block>
            {data.progress >= 100 ? 'আবার পড়ুন' : 'চালিয়ে যান'}{' '}
            <IconNext className="ic" aria-hidden="true" />
          </ButtonLink>
        </>
      ) : signedIn || sessionPending ? (
        <Button block onClick={start} pending={pending} disabled={sessionPending}>
          বিনামূল্যে শুরু করুন <IconNext className="ic" aria-hidden="true" />
        </Button>
      ) : (
        <>
          <ButtonLink href={nextHref} block>
            প্রথম পাঠ পড়ুন <IconNext className="ic" aria-hidden="true" />
          </ButtonLink>
          <ButtonLink
            href={`/login?next=${encodeURIComponent(`/courses/${courseSlug}`)}`}
            variant="ghost"
            size="sm"
            block
          >
            <IconLogin className="ic" aria-hidden="true" /> অগ্রগতি সংরক্ষণে লগইন করুন
          </ButtonLink>
        </>
      )}
      <p className="t-caption t-muted" style={{ textAlign: 'center' }}>
        {bn(lessons.length)}টি পাঠ{totalMinutes ? ` · মোট ${formatMinutes(totalMinutes)}` : ''} ·
        সম্পূর্ণ বিনামূল্যে
      </p>
    </div>
  )
}
