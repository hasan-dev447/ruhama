import { z } from 'zod'

import type { ServiceContext } from './context'
import { requireUser } from './context'
import { recountCourse } from './counters'
import { errors } from './errors'
import { notify } from './notifications'

const idOf = (v: unknown) =>
  v && typeof v === 'object' && 'id' in v ? (v as { id: number }).id : (v as number)

async function publishedCourse(ctx: ServiceContext, courseId: number) {
  const course = await ctx.payload.findByID({
    collection: 'courses',
    id: courseId,
    depth: 0,
    select: { title: true, slug: true, status: true, lessonCount: true },
    overrideAccess: true,
    disableErrors: true,
  })
  if (!course || course.status !== 'published') throw errors.notFound('কোর্সটি পাওয়া যায়নি।')
  return course
}

async function publishedLesson(ctx: ServiceContext, lessonId: number) {
  const lesson = await ctx.payload.findByID({
    collection: 'lessons',
    id: lessonId,
    depth: 0,
    select: { title: true, slug: true, status: true, course: true, quiz: true },
    overrideAccess: true,
    disableErrors: true,
  })
  if (!lesson || lesson.status !== 'published') throw errors.notFound('পাঠটি পাওয়া যায়নি।')
  return lesson
}

async function findEnrollment(ctx: ServiceContext, userId: number, courseId: number) {
  const res = await ctx.payload.find({
    collection: 'enrollments',
    where: { and: [{ user: { equals: userId } }, { course: { equals: courseId } }] },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  return res.docs[0] ?? null
}

/** Enrol the member in a course. Safe to call repeatedly. */
export async function enroll(ctx: ServiceContext, courseId: number) {
  const user = requireUser(ctx)
  await publishedCourse(ctx, courseId)
  const existing = await findEnrollment(ctx, user.id, courseId)
  if (existing) return { enrolled: true, enrollmentId: existing.id, created: false }
  const doc = await ctx.payload.create({
    collection: 'enrollments',
    data: {
      user: user.id,
      course: courseId,
      completedLessons: 0,
      progress: 0,
      lastActivityAt: new Date().toISOString(),
    },
    overrideAccess: true,
    depth: 0,
  })
  await recountCourse(ctx.payload, courseId)
  return { enrolled: true, enrollmentId: doc.id, created: true }
}

/** Recompute the cached progress on an enrolment from lesson-progress rows. */
async function syncEnrollment(
  ctx: ServiceContext,
  userId: number,
  courseId: number,
  lastLessonId?: number,
) {
  const [course, done] = await Promise.all([
    publishedCourse(ctx, courseId),
    ctx.payload.count({
      collection: 'lesson-progress',
      where: {
        and: [
          { user: { equals: userId } },
          { course: { equals: courseId } },
          { completedAt: { exists: true } },
        ],
      },
      overrideAccess: true,
    }),
  ])
  const total = Math.max(1, course.lessonCount ?? 1)
  const completedLessons = Math.min(done.totalDocs, total)
  const progress = Math.round((completedLessons / total) * 100)
  const enrollment =
    (await findEnrollment(ctx, userId, courseId)) ??
    (await ctx.payload.create({
      collection: 'enrollments',
      data: { user: userId, course: courseId },
      overrideAccess: true,
      depth: 0,
    }))
  const justCompleted = progress >= 100 && !enrollment.completedAt
  await ctx.payload.update({
    collection: 'enrollments',
    id: enrollment.id,
    data: {
      completedLessons,
      progress,
      lastActivityAt: new Date().toISOString(),
      ...(lastLessonId ? { lastLesson: lastLessonId } : {}),
      completedAt: progress >= 100 ? (enrollment.completedAt ?? new Date().toISOString()) : null,
    },
    overrideAccess: true,
    depth: 0,
  })
  if (justCompleted) {
    await notify(ctx.payload, {
      recipients: [userId],
      kind: 'course',
      text: `মাশাআল্লাহ! আপনি “${course.title}” কোর্সটি সম্পন্ন করেছেন।`,
      link: `/courses/${course.slug}`,
      emailSubject: 'কোর্স সম্পন্ন হয়েছে · Ruhama',
    })
  }
  return {
    completedLessons,
    progress,
    total: course.lessonCount ?? 0,
    courseCompleted: progress >= 100,
  }
}

export const completeLessonSchema = z.object({
  lessonId: z.coerce.number().int().positive(),
  completed: z.boolean().default(true),
})

/** Mark a lesson complete (or not). Enrols automatically on first progress. */
export async function setLessonComplete(
  ctx: ServiceContext,
  input: z.input<typeof completeLessonSchema>,
) {
  const user = requireUser(ctx)
  const { lessonId, completed } = completeLessonSchema.parse(input)
  const lesson = await publishedLesson(ctx, lessonId)
  const courseId = idOf(lesson.course)
  await enroll(ctx, courseId)

  const existing = await ctx.payload.find({
    collection: 'lesson-progress',
    where: { and: [{ user: { equals: user.id } }, { lesson: { equals: lessonId } }] },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const completedAt = completed ? new Date().toISOString() : null
  if (existing.docs[0]) {
    await ctx.payload.update({
      collection: 'lesson-progress',
      id: existing.docs[0].id,
      data: { completedAt },
      overrideAccess: true,
      depth: 0,
    })
  } else {
    await ctx.payload.create({
      collection: 'lesson-progress',
      data: { user: user.id, lesson: lessonId, course: courseId, completedAt },
      overrideAccess: true,
      depth: 0,
    })
  }
  const summary = await syncEnrollment(ctx, user.id, courseId, lessonId)
  return { lessonId, completed, ...summary }
}

export const quizSchema = z.object({
  lessonId: z.coerce.number().int().positive(),
  answers: z.record(z.string().max(64), z.number().int().min(0).max(9)),
})

export type QuizResult = {
  results: {
    questionId: string
    correct: boolean
    correctIndex: number
    explanation: string | null
  }[]
  score: number
  total: number
}

/** Check quiz answers on the server so correct options never reach the browser before answering. */
export async function checkQuiz(
  ctx: ServiceContext,
  input: z.input<typeof quizSchema>,
): Promise<QuizResult> {
  const { lessonId, answers } = quizSchema.parse(input)
  const lesson = await publishedLesson(ctx, lessonId)
  const quiz = lesson.quiz ?? []
  const results = quiz
    .filter((q) => q.id && q.id in answers)
    .map((q) => {
      const correctIndex = (q.correctIndex ?? 1) - 1
      return {
        questionId: q.id!,
        correct: answers[q.id!] === correctIndex,
        correctIndex,
        explanation: q.explanation ?? null,
      }
    })
  const score = results.filter((r) => r.correct).length

  if (ctx.user) {
    const existing = await ctx.payload.find({
      collection: 'lesson-progress',
      where: { and: [{ user: { equals: ctx.user.id } }, { lesson: { equals: lessonId } }] },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
    const data = { quizAnswers: answers, quizCorrect: score }
    if (existing.docs[0])
      await ctx.payload.update({
        collection: 'lesson-progress',
        id: existing.docs[0].id,
        data,
        overrideAccess: true,
        depth: 0,
      })
    else
      await ctx.payload.create({
        collection: 'lesson-progress',
        data: { user: ctx.user.id, lesson: lessonId, course: idOf(lesson.course), ...data },
        overrideAccess: true,
        depth: 0,
      })
  }
  return { results, score, total: quiz.length }
}

export type EnrollmentSummary = {
  courseId: number
  courseSlug: string
  courseTitle: string
  progress: number
  completedLessons: number
  lessonCount: number
  completed: boolean
  lastActivityAt: string | null
  next: { slug: string; title: string; order: number; module: number } | null
  modules: { title: string; lessonCount: number; doneCount: number }[]
}

/** The member's courses with progress and the next lesson to continue. */
export async function myEnrollments(ctx: ServiceContext): Promise<EnrollmentSummary[]> {
  const user = requireUser(ctx)
  const res = await ctx.payload.find({
    collection: 'enrollments',
    where: { user: { equals: user.id } },
    depth: 1,
    populate: {
      courses: { title: true, slug: true, lessonCount: true, status: true, modules: true },
    },
    sort: '-lastActivityAt',
    limit: 50,
    overrideAccess: true,
  })
  const enrollments = res.docs.filter(
    (e) => e.course && typeof e.course === 'object' && e.course.status === 'published',
  )
  if (!enrollments.length) return []
  const courseIds = enrollments.map((e) => idOf(e.course))

  const [lessons, done] = await Promise.all([
    ctx.payload.find({
      collection: 'lessons',
      where: { and: [{ course: { in: courseIds } }, { status: { equals: 'published' } }] },
      select: { slug: true, title: true, order: true, module: true, course: true },
      depth: 0,
      sort: 'order',
      limit: 2000,
      pagination: false,
      overrideAccess: true,
    }),
    ctx.payload.find({
      collection: 'lesson-progress',
      where: {
        and: [
          { user: { equals: user.id } },
          { course: { in: courseIds } },
          { completedAt: { exists: true } },
        ],
      },
      select: { lesson: true },
      depth: 0,
      limit: 5000,
      pagination: false,
      overrideAccess: true,
    }),
  ])
  const doneIds = new Set(done.docs.map((d) => idOf(d.lesson)))

  return enrollments.map((e) => {
    const course = e.course as {
      id: number
      title: string
      slug?: string | null
      lessonCount?: number | null
      modules?: { title: string }[] | null
    }
    const own = lessons.docs.filter((l) => idOf(l.course) === course.id)
    const next = own.find((l) => !doneIds.has(l.id)) ?? null
    const modules = (course.modules ?? []).map((m, i) => {
      const inModule = own.filter((l) => l.module === i + 1)
      return {
        title: m.title,
        lessonCount: inModule.length,
        doneCount: inModule.filter((l) => doneIds.has(l.id)).length,
      }
    })
    return {
      courseId: course.id,
      courseSlug: course.slug ?? '',
      courseTitle: course.title,
      progress: e.progress ?? 0,
      completedLessons: e.completedLessons ?? 0,
      lessonCount: course.lessonCount ?? own.length,
      completed: Boolean(e.completedAt),
      lastActivityAt: e.lastActivityAt ?? null,
      next: next
        ? { slug: next.slug ?? '', title: next.title, order: next.order, module: next.module }
        : null,
      modules,
    }
  })
}

/** Completed lesson ids in one course, for outline ticks. */
export async function courseProgress(ctx: ServiceContext, courseId: number) {
  const user = requireUser(ctx)
  const [enrollment, done] = await Promise.all([
    findEnrollment(ctx, user.id, courseId),
    ctx.payload.find({
      collection: 'lesson-progress',
      where: {
        and: [
          { user: { equals: user.id } },
          { course: { equals: courseId } },
          { completedAt: { exists: true } },
        ],
      },
      select: { lesson: true },
      depth: 0,
      limit: 1000,
      pagination: false,
      overrideAccess: true,
    }),
  ])
  return {
    enrolled: Boolean(enrollment),
    progress: enrollment?.progress ?? 0,
    completedLessonIds: done.docs.map((d) => idOf(d.lesson)),
  }
}
