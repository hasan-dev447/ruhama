'use client'

import { useQueryClient } from '@tanstack/react-query'
import { CircleCheck, CircleX, ListChecks, LogIn, Pause, Play } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { startTransition, useOptimistic, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { checkQuizAction, setLessonCompleteAction } from '@/actions/learning'
import { Button, ButtonLink } from '@/components/ui/button'
import { IconTile, Progress } from '@/components/ui/primitives'
import {
  courseProgressKey,
  enrollmentsKey,
  useCourseProgress,
  type CourseProgress,
} from '@/hooks/use-learning'
import { bn, formatDuration } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { QuizResult } from '@/server/services/learning'

/** Top strip on the lesson page: "১২ পাঠের ৭টি সম্পন্ন" with the course progress bar. */
export function LessonProgressHeader({ courseId, total }: { courseId: number; total: number }) {
  const { data, signedIn } = useCourseProgress(courseId)
  const done = data?.completedLessonIds.length ?? 0
  const pct = total ? Math.round((Math.min(done, total) / total) * 100) : 0
  return (
    <div style={{ flex: '1 1 280px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span className="t-small t-muted" style={{ whiteSpace: 'nowrap' }}>
        {signedIn ? `${bn(total)} পাঠের ${bn(done)}টি সম্পন্ন` : `${bn(total)}টি পাঠ`}
      </span>
      <Progress value={pct} label="কোর্স অগ্রগতি" style={{ flex: 1 }} />
      <span className="t-small" style={{ fontWeight: 600 }}>
        {bn(pct)}%
      </span>
    </div>
  )
}

/** Mark the lesson done (or undo). Optimistic, with progress caches refreshed after the server confirms. */
export function LessonCompleteButton({
  courseId,
  lessonId,
  nextHref,
}: {
  courseId: number
  lessonId: number
  nextHref: string | null
}) {
  const qc = useQueryClient()
  const pathname = usePathname()
  const { data, signedIn, sessionPending, isPending: progressPending } = useCourseProgress(courseId)
  const serverDone = Boolean(data?.completedLessonIds.includes(lessonId))
  const [done, setDone] = useOptimistic(serverDone)

  // until the member's progress is known the toggle would point the wrong way, so it waits too
  if (sessionPending || (signedIn && progressPending))
    return (
      <Button block size="lg" disabled variant="secondary">
        লোড হচ্ছে…
      </Button>
    )
  if (!signedIn) {
    return (
      <ButtonLink
        href={`/login?next=${encodeURIComponent(pathname ?? '/courses')}`}
        variant="secondary"
        size="lg"
        block
        style={{ marginTop: 16 }}
      >
        <LogIn className="ic" aria-hidden="true" /> অগ্রগতি সংরক্ষণে লগইন করুন
      </ButtonLink>
    )
  }

  function toggle() {
    const next = !done
    startTransition(async () => {
      setDone(next)
      const res = await setLessonCompleteAction(lessonId, next)
      if (!res.ok) {
        toast.error('অগ্রগতি সংরক্ষণ করা যায়নি', { description: res.error })
        return
      }
      qc.setQueryData<CourseProgress>(courseProgressKey(courseId), (prev) => {
        const ids = new Set(prev?.completedLessonIds ?? [])
        if (next) ids.add(lessonId)
        else ids.delete(lessonId)
        return { enrolled: true, progress: res.data.progress, completedLessonIds: [...ids] }
      })
      void qc.invalidateQueries({ queryKey: enrollmentsKey })
      if (next) {
        toast.success(
          res.data.courseCompleted ? 'মাশাআল্লাহ! কোর্স সম্পন্ন হয়েছে' : 'পাঠ সম্পন্ন হয়েছে',
          {
            description: res.data.courseCompleted
              ? 'আল্লাহ আপনার ইলমে বরকত দিন।'
              : `কোর্সের ${bn(res.data.progress)}% সম্পন্ন।`,
            action:
              nextHref && !res.data.courseCompleted
                ? { label: 'পরের পাঠ', onClick: () => (window.location.href = nextHref) }
                : undefined,
          },
        )
      }
    })
  }

  return (
    <button
      type="button"
      className={cn('btn btn-block btn-lg', done ? 'btn-secondary' : 'btn-primary')}
      style={{ marginTop: 16 }}
      onClick={toggle}
      aria-pressed={done}
    >
      {done ? (
        <>
          <CircleCheck className="ic" aria-hidden="true" /> সম্পন্ন হয়েছে · আবার অসম্পন্ন করুন
        </>
      ) : (
        'পাঠ সম্পন্ন হিসেবে চিহ্নিত করুন'
      )}
    </button>
  )
}

type QuizQuestion = { id: string; question: string; options: string[] }
const KEYS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ']

/** "নিজেকে যাচাই করুন": one question at a time, answers checked on the server. */
export function LessonQuiz({
  lessonId,
  questions,
}: {
  lessonId: number
  questions: QuizQuestion[]
}) {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [result, setResult] = useState<QuizResult['results'][number] | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [pending, start] = useTransition()
  const groupRef = useRef<HTMLDivElement>(null)
  const q = questions[index]
  if (!q) return null

  function check() {
    if (picked === null || !q) return
    start(async () => {
      const res = await checkQuizAction(lessonId, { [q.id]: picked })
      if (!res.ok) {
        toast.error('উত্তর যাচাই করা যায়নি', { description: res.error })
        return
      }
      const r = res.data.results[0] ?? null
      setResult(r)
      if (r?.correct) setScore((s) => s + 1)
    })
  }
  function next() {
    if (index + 1 >= questions.length) {
      setFinished(true)
      return
    }
    setIndex(index + 1)
    setPicked(null)
    setResult(null)
  }
  function reset() {
    setIndex(0)
    setPicked(null)
    setResult(null)
    setScore(0)
    setFinished(false)
  }
  function onKey(e: React.KeyboardEvent) {
    if (result) return
    if (
      e.key === 'ArrowDown' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowLeft'
    ) {
      e.preventDefault()
      const dir = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1
      const nextIdx = ((picked ?? -1) + dir + q!.options.length) % q!.options.length
      setPicked(nextIdx)
      groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[nextIdx]?.focus()
    }
  }

  return (
    <section
      className="card card-pad"
      aria-labelledby="quiz-title"
      style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <h2
          id="quiz-title"
          className="t-h4"
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <IconTile size={36}>
            <ListChecks className="ic" aria-hidden="true" />
          </IconTile>
          নিজেকে যাচাই করুন
        </h2>
        <span className="t-caption t-muted">
          প্রশ্ন {bn(Math.min(index + 1, questions.length))} / {bn(questions.length)}
        </span>
      </div>

      {finished ? (
        <div role="status" className="adab-strip" style={{ background: 'var(--rh-success-soft)' }}>
          <CircleCheck
            className="ic"
            aria-hidden="true"
            style={{ color: 'var(--rh-success)', marginTop: 3 }}
          />
          <p className="t-small">
            <strong>
              {bn(questions.length)}টি প্রশ্নের {bn(score)}টি সঠিক।
            </strong>{' '}
            {score === questions.length
              ? 'মাশাআল্লাহ, চমৎকার!'
              : 'আরেকবার পাঠটি দেখে নিলে বিষয়টি আরও পরিষ্কার হবে, ইনশাআল্লাহ।'}
          </p>
        </div>
      ) : (
        <>
          <p id="quiz-q" style={{ fontWeight: 600 }}>
            {q.question}
          </p>
          <div
            ref={groupRef}
            role="radiogroup"
            aria-labelledby="quiz-q"
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            onKeyDown={onKey}
          >
            {q.options.map((text, i) => {
              const isPicked = picked === i
              const state = result
                ? i === result.correctIndex
                  ? 'is-correct'
                  : isPicked
                    ? 'is-wrong'
                    : ''
                : isPicked
                  ? 'is-selected'
                  : ''
              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={isPicked}
                  tabIndex={isPicked || (picked === null && i === 0) ? 0 : -1}
                  className={cn('quiz-opt', state)}
                  onClick={() => !result && setPicked(i)}
                  disabled={Boolean(result) && !isPicked && i !== result?.correctIndex}
                >
                  <span className="quiz-opt__key">{KEYS[i] ?? bn(i + 1)}</span>
                  <span>{text}</span>
                </button>
              )
            })}
          </div>
          {result ? (
            <div
              role="status"
              className="adab-strip"
              style={{
                background: result.correct ? 'var(--rh-success-soft)' : 'var(--rh-error-soft)',
              }}
            >
              {result.correct ? (
                <CircleCheck
                  className="ic"
                  aria-hidden="true"
                  style={{ color: 'var(--rh-success)', marginTop: 3 }}
                />
              ) : (
                <CircleX
                  className="ic"
                  aria-hidden="true"
                  style={{ color: 'var(--rh-error)', marginTop: 3 }}
                />
              )}
              <p className="t-small">
                <strong>
                  {result.correct ? 'সঠিক উত্তর!' : 'সঠিক উত্তরটি চিহ্নিত করা হয়েছে।'}
                </strong>{' '}
                {result.explanation ?? ''}
              </p>
            </div>
          ) : null}
        </>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {finished ? null : result ? (
          <Button onClick={next}>
            {index + 1 >= questions.length ? 'ফলাফল দেখুন' : 'পরের প্রশ্ন'}
          </Button>
        ) : (
          <Button onClick={check} disabled={picked === null} pending={pending}>
            উত্তর যাচাই করুন
          </Button>
        )}
        <Button variant="ghost" onClick={reset}>
          আবার চেষ্টা
        </Button>
      </div>
    </section>
  )
}

/** Audio lesson on the band background, matching the design's play button. */
export function AudioLesson({
  src,
  durationSeconds,
  title,
}: {
  src: string
  durationSeconds: number | null
  title: string
}) {
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const total = durationSeconds ?? 0
  return (
    <div
      className="pattern-host"
      style={{
        marginTop: 28,
        borderRadius: 'var(--rh-radius-lg)',
        background: 'var(--rh-band-bg)',
        aspectRatio: '16 / 8',
        display: 'grid',
        placeItems: 'center',
        minHeight: 220,
        position: 'relative',
      }}
    >
      <div
        className="rh-pattern"
        aria-hidden="true"
        style={{ backgroundColor: '#F3E9D6', opacity: 0.08 }}
      />
      <audio
        ref={audio}
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
      />
      <button
        type="button"
        aria-label={playing ? 'অডিও পাঠ থামান' : `অডিও পাঠ চালু করুন: ${title}`}
        onClick={() => (playing ? audio.current?.pause() : void audio.current?.play())}
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 76,
          height: 76,
          borderRadius: '50%',
          border: '1.5px solid rgba(212,169,92,0.7)',
          background: 'rgba(255,255,255,0.06)',
          color: '#D4A95C',
          cursor: 'pointer',
        }}
      >
        {playing ? (
          <Pause className="ic ic-lg" aria-hidden="true" />
        ) : (
          <Play className="ic ic-lg" aria-hidden="true" style={{ marginLeft: 4 }} />
        )}
      </button>
      <span
        style={{
          position: 'absolute',
          left: 20,
          bottom: 16,
          color: 'var(--rh-band-muted)',
          fontSize: 14,
        }}
      >
        অডিও পাঠ · {time > 0 ? `${formatDuration(time)} / ` : ''}
        {total ? formatDuration(total) : ''}
      </span>
    </div>
  )
}
