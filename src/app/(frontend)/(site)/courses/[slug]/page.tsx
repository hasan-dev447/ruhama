import { BookOpen, Clock, Users } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PersonAvatar, personHref } from '@/components/content/cards'
import { CourseCta, CourseOutline, type OutlineModule } from '@/components/learning/course-outline'
import { JsonLd } from '@/components/seo/json-ld'
import { Badge, LevelBadge, levelLabel } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/ui/primitives'
import { bn, bnCompact, formatMinutes } from '@/lib/format'
import { journeyLabel } from '@/lib/journey'
import { breadcrumbLd, buildMetadata, courseLd } from '@/lib/seo'
import { data } from '@/server/data'
import { toPerson } from '@/server/queries/articles'

export const revalidate = 86400

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  try {
    const courses = await data.courses(null)
    return courses.map((c) => ({ slug: c.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const res = await data.course(slug)
  if (!res)
    return buildMetadata({
      title: 'কোর্সটি পাওয়া যায়নি',
      path: `/courses/${slug}`,
      noIndex: true,
    })
  return buildMetadata({
    title: res.course.title,
    description: res.course.description,
    path: `/courses/${slug}`,
  })
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params
  const res = await data.course(slug)
  if (!res) notFound()
  const { course, lessons } = res

  const instructor = toPerson(course.instructor)
  const instructorDoc =
    course.instructor && typeof course.instructor === 'object' ? course.instructor : null
  const reviewers = ((course.reviewedBy ?? []) as unknown[]).map(toPerson).filter((p) => p !== null)
  const modules: OutlineModule[] = (course.modules ?? []).map((m, i) => ({
    title: m.title,
    summary: m.summary,
    lessons: lessons.filter((l) => l.module === i + 1),
  }))
  const orphans = lessons.filter((l) => l.module < 1 || l.module > modules.length)
  if (orphans.length) modules.push({ title: 'অন্যান্য পাঠ', lessons: orphans })
  const totalMinutes =
    course.durationMinutes ??
    (lessons.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0) || null)
  const path = `/courses/${course.slug}`

  return (
    <main id="main">
      <header className="page-hero">
        <div className="rh-pattern" aria-hidden="true" />
        <div className="rh-container">
          <Breadcrumbs
            items={[
              { label: 'হোম', href: '/' },
              { label: 'শেখার পথ', href: '/courses' },
            ]}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
            <Badge style={{ background: 'var(--rh-surface)' }}>
              যাত্রার ধাপ: {journeyLabel(course.journeyStage)}
            </Badge>
            <LevelBadge level={course.level} />
          </div>
          <h1 className="t-h1" style={{ marginTop: 16 }}>
            {course.title}
          </h1>
          <p className="lead">{course.description}</p>
          <div className="stat-line" style={{ marginTop: 20 }}>
            <span>
              <BookOpen className="ic" aria-hidden="true" />
              {bn(lessons.length)} পাঠ · {bn(modules.length)} মডিউল
            </span>
            {totalMinutes ? (
              <span>
                <Clock className="ic" aria-hidden="true" />
                {formatMinutes(totalMinutes)}
              </span>
            ) : null}
            {course.enrolledCount ? (
              <span>
                <Users className="ic" aria-hidden="true" />
                {bnCompact(course.enrolledCount)} জন শিখছেন
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <section className="section-sm">
        <div className="rh-container">
          <div className="layout-side">
            <div className="layout-side__main">
              <h2 className="t-h3" style={{ marginBottom: 20 }}>
                কোর্সের বিষয়সূচি
              </h2>
              <CourseOutline
                courseId={course.id}
                courseSlug={course.slug ?? slug}
                modules={modules}
              />
            </div>
            <aside
              className="layout-side__aside layout-side__aside--right sticky-col"
              aria-label="কোর্সের তথ্য"
            >
              <div className="card card-raised card-pad">
                <CourseCta
                  courseId={course.id}
                  courseSlug={course.slug ?? slug}
                  lessons={lessons}
                  totalMinutes={totalMinutes}
                />
              </div>
              {instructor ? (
                <div className="card card-pad" style={{ display: 'flex', gap: 14 }}>
                  <PersonAvatar person={instructor} size="lg" />
                  <div>
                    <span className="t-caption t-muted">শিক্ষক</span>
                    <Link
                      href={personHref(instructor)}
                      style={{
                        display: 'block',
                        fontWeight: 700,
                        color: 'var(--rh-ink)',
                        textDecoration: 'none',
                        lineHeight: 1.5,
                      }}
                    >
                      {instructor.name}
                    </Link>
                    {instructorDoc?.specialty ? (
                      <p className="t-small t-muted" style={{ marginTop: 4 }}>
                        {instructorDoc.specialty}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {reviewers.length ? (
                <div
                  className="card card-pad"
                  style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  <span className="t-caption t-muted">ইলমি রিভিউ</span>
                  {reviewers.map((r) => (
                    <Link
                      key={r.id}
                      href={personHref(r)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        color: 'var(--rh-ink)',
                        textDecoration: 'none',
                      }}
                    >
                      <PersonAvatar person={r} size="sm" />
                      <span className="t-small" style={{ fontWeight: 600 }}>
                        {r.name}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </section>
      <JsonLd
        data={[
          courseLd({
            title: course.title,
            description: course.description,
            path,
            lessons: lessons.length,
            level: levelLabel(course.level),
          }),
          breadcrumbLd([
            { name: 'হোম', path: '/' },
            { name: 'শেখার পথ', path: '/courses' },
            { name: course.title, path },
          ]),
        ]}
      />
    </main>
  )
}
