import { IconChevronBack, IconChevronNext, IconClock, IconVerified } from '@/components/icons'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { RichText } from '@/components/content/rich-text'
import { YouTubeFacade } from '@/components/content/youtube-facade'
import { LessonSidebarList } from '@/components/learning/course-outline'
import {
  AudioLesson,
  LessonCompleteButton,
  LessonProgressHeader,
  LessonQuiz,
} from '@/components/learning/lesson-client'
import { JsonLd } from '@/components/seo/json-ld'
import { LevelBadge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/ui/primitives'
import { bn, formatMinutes } from '@/lib/format'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'
import { data } from '@/server/data'
import { toPerson } from '@/server/queries/articles'

export const revalidate = 86400

type Props = { params: Promise<{ slug: string; lesson: string }> }

export async function generateStaticParams() {
  try {
    const courses = await data.courses(null)
    const all = await Promise.all(courses.slice(0, 6).map((c) => data.course(c.slug)))
    return all.flatMap((res) =>
      res
        ? res.lessons.slice(0, 3).map((l) => ({ slug: res.course.slug ?? '', lesson: l.slug }))
        : [],
    )
  } catch {
    return []
  }
}

async function load(slug: string, lessonSlug: string) {
  const res = await data.course(slug)
  if (!res) return null
  const lesson = await data.lesson(res.course.id, lessonSlug)
  if (!lesson) return null
  return { ...res, lesson }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lesson } = await params
  const res = await load(slug, lesson)
  if (!res)
    return buildMetadata({
      title: 'পাঠটি পাওয়া যায়নি',
      path: `/courses/${slug}/${lesson}`,
      noIndex: true,
    })
  return buildMetadata({
    title: `${res.lesson.title} · ${res.course.title}`,
    description: `${res.course.title} কোর্সের পাঠ ${bn(res.lesson.order)}: ${res.lesson.title}`,
    path: `/courses/${slug}/${lesson}`,
  })
}

export default async function LessonPage({ params }: Props) {
  const { slug, lesson: lessonSlug } = await params
  const res = await load(slug, lessonSlug)
  if (!res) notFound()
  const { course, lessons, lesson } = res

  const courseSlug = course.slug ?? slug
  const position = lessons.findIndex((l) => l.id === lesson.id)
  const prev = position > 0 ? lessons[position - 1] : null
  const next = position >= 0 && position < lessons.length - 1 ? lessons[position + 1] : null
  const instructor = toPerson(course.instructor)
  const reviewer =
    ((course.reviewedBy ?? []) as unknown[]).map(toPerson).find((p) => p !== null) ?? null
  const totalMinutes =
    course.durationMinutes ?? (lessons.reduce((s, l) => s + (l.durationMinutes ?? 0), 0) || null)
  const media = lesson.media
  const audio =
    media?.kind === 'audio' && media.audio && typeof media.audio === 'object' ? media.audio : null
  const path = `/courses/${courseSlug}/${lesson.slug}`

  return (
    <main id="main">
      <div style={{ borderBottom: '1px solid var(--rh-border)', background: 'var(--rh-surface)' }}>
        <div
          className="rh-container"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '12px 24px',
            paddingBlock: 16,
          }}
        >
          <div style={{ flex: '1 1 320px' }}>
            <Breadcrumbs
              items={[
                { label: 'শেখার পথ', href: '/courses' },
                { label: course.title, href: `/courses/${courseSlug}` },
                { label: `পাঠ ${bn(lesson.order)}` },
              ]}
            />
          </div>
          <LessonProgressHeader courseId={course.id} total={lessons.length} />
        </div>
      </div>

      <section className="section-sm">
        <div className="rh-container">
          <div className="layout-side">
            <aside
              className="layout-side__aside sticky-col"
              aria-label="কোর্সের বিষয়সূচি"
              style={{ maxWidth: 320 }}
            >
              <div className="card" style={{ padding: 18 }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    padding: '4px 8px 14px',
                    borderBottom: '1px solid var(--rh-border)',
                    marginBottom: 8,
                  }}
                >
                  <LevelBadge level={course.level} />
                  <Link
                    href={`/courses/${courseSlug}`}
                    style={{
                      fontFamily: 'var(--rh-font-heading)',
                      fontSize: 18,
                      marginTop: 8,
                      fontWeight: 700,
                      color: 'var(--rh-ink)',
                      textDecoration: 'none',
                    }}
                  >
                    {course.title}
                  </Link>
                  <span className="t-caption t-muted">
                    {[
                      `${bn(lessons.length)} পাঠ`,
                      totalMinutes ? formatMinutes(totalMinutes) : null,
                      instructor?.name,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
                <LessonSidebarList
                  courseId={course.id}
                  courseSlug={courseSlug}
                  lessons={lessons}
                  currentId={lesson.id}
                />
              </div>
            </aside>

            <article className="layout-side__main">
              <span className="eyebrow">
                মডিউল {bn(lesson.module)} · পাঠ {bn(lesson.order)}
              </span>
              <h1 className="t-h1" style={{ marginTop: 12 }}>
                {lesson.title}
              </h1>
              <div className="stat-line" style={{ marginTop: 12 }}>
                {lesson.durationMinutes ? (
                  <span>
                    <IconClock className="ic" aria-hidden="true" />
                    {bn(lesson.durationMinutes)} মিনিট
                  </span>
                ) : null}
                {reviewer ? (
                  <span>
                    <IconVerified className="ic" aria-hidden="true" />
                    রিভিউ: {reviewer.name}
                  </span>
                ) : null}
              </div>

              {media?.kind === 'youtube' && media.youtubeId ? (
                <div style={{ marginTop: 28 }}>
                  <YouTubeFacade
                    videoId={media.youtubeId}
                    title={lesson.title}
                    durationSeconds={media.durationSeconds ?? undefined}
                  />
                </div>
              ) : audio?.url ? (
                <AudioLesson
                  src={audio.url}
                  durationSeconds={media?.durationSeconds ?? null}
                  title={lesson.title}
                />
              ) : null}

              <RichText data={lesson.content} style={{ marginTop: 36 }} className="prose-first" />

              {lesson.quiz.length ? (
                <LessonQuiz lessonId={lesson.id} questions={lesson.quiz} />
              ) : null}

              <nav
                aria-label="পাঠ নেভিগেশন"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
                  gap: 14,
                  marginTop: 32,
                }}
              >
                {prev ? (
                  <Link
                    href={`/courses/${courseSlug}/${prev.slug}`}
                    className="card card-hover"
                    style={{
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      textDecoration: 'none',
                      color: 'var(--rh-ink)',
                    }}
                  >
                    <IconChevronBack className="ic" aria-hidden="true" />
                    <span>
                      <span className="t-caption t-muted" style={{ display: 'block' }}>
                        আগের পাঠ
                      </span>
                      <strong style={{ fontWeight: 600 }}>{prev.title}</strong>
                    </span>
                  </Link>
                ) : (
                  <span />
                )}
                {next ? (
                  <Link
                    href={`/courses/${courseSlug}/${next.slug}`}
                    className="card card-hover"
                    style={{
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 14,
                      textDecoration: 'none',
                      color: 'var(--rh-ink)',
                      textAlign: 'right',
                    }}
                  >
                    <span>
                      <span className="t-caption t-muted" style={{ display: 'block' }}>
                        পরের পাঠ
                      </span>
                      <strong style={{ fontWeight: 600 }}>{next.title}</strong>
                    </span>
                    <IconChevronNext className="ic" aria-hidden="true" />
                  </Link>
                ) : null}
              </nav>
              <LessonCompleteButton
                courseId={course.id}
                lessonId={lesson.id}
                nextHref={next ? `/courses/${courseSlug}/${next.slug}` : null}
              />
            </article>
          </div>
        </div>
      </section>
      <JsonLd
        data={breadcrumbLd([
          { name: 'শেখার পথ', path: '/courses' },
          { name: course.title, path: `/courses/${courseSlug}` },
          { name: lesson.title, path },
        ])}
      />
    </main>
  )
}
