import type { Metadata } from 'next'
import { Suspense } from 'react'

import { ContinueLearning, CourseCard, CourseGrid } from '@/components/learning/course-cards'
import { JsonLd } from '@/components/seo/json-ld'
import { PageHero, Skeleton } from '@/components/ui/primitives'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'
import { data } from '@/server/data'

export const revalidate = 86400

const LEAD =
  'ধাপে ধাপে সাজানো কোর্স, প্রতিটি পাঠ শেষে ছোট্ট মূল্যায়ন। নিজের গতিতে শিখুন, অগ্রগতি সংরক্ষিত থাকবে।'

export const metadata: Metadata = buildMetadata({
  title: 'শেখার পথ',
  description: LEAD,
  path: '/courses',
})

export default async function CoursesPage() {
  const courses = await data.courses(null)
  const first = courses[0] ? await data.course(courses[0].slug) : null
  const starter =
    first && courses[0]
      ? {
          ...courses[0],
          firstLesson: first.lessons[0]?.slug ?? null,
          modules: (first.course.modules ?? []).map((m, i) => ({
            title: m.title,
            lessonCount: first.lessons.filter((l) => l.module === i + 1).length,
          })),
        }
      : null

  return (
    <main id="main">
      <PageHero
        crumbs={[{ label: 'হোম', href: '/' }, { label: 'শেখার পথ' }]}
        title="শেখার পথ"
        lead={LEAD}
        id="learn-title"
      />
      <section className="section-sm">
        <div className="rh-container" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <ContinueLearning starter={starter} />
          <Suspense
            fallback={
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))',
                  gap: 20,
                }}
              >
                {courses.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
                {courses.length ? null : <Skeleton style={{ height: 320 }} />}
              </div>
            }
          >
            <CourseGrid courses={courses} />
          </Suspense>
        </div>
      </section>
      <JsonLd
        data={breadcrumbLd([
          { name: 'হোম', path: '/' },
          { name: 'শেখার পথ', path: '/courses' },
        ])}
      />
    </main>
  )
}
