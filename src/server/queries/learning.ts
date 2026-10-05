import type { Payload, Where } from 'payload'
import type { User } from '@/payload-types'

import { CATEGORY_POPULATE, PERSON_POPULATE } from './articles'
import { toCourseCard, toQuestionCard } from './mappers'
import type { CourseCardView } from './types'

const COURSE_SELECT = {
  title: true,
  slug: true,
  description: true,
  journeyStage: true,
  level: true,
  tint: true,
  lessonCount: true,
  durationMinutes: true,
} as const

export async function listCourses(
  payload: Payload,
  params: { level?: string | null; journeyStage?: string | null } = {},
): Promise<CourseCardView[]> {
  const and: Where[] = [{ status: { equals: 'published' } }]
  if (params.level && params.level !== 'all') and.push({ level: { equals: params.level } })
  if (params.journeyStage) and.push({ journeyStage: { equals: params.journeyStage } })
  const res = await payload.find({
    collection: 'courses',
    where: { and },
    select: COURSE_SELECT,
    depth: 0,
    sort: 'order',
    limit: 60,
  })
  return res.docs.map((d) => toCourseCard(d as never))
}

export type OutlineLesson = {
  id: number
  slug: string
  title: string
  module: number
  order: number
  durationMinutes: number | null
}

export async function getCourse(payload: Payload, slug: string) {
  const res = await payload.find({
    collection: 'courses',
    where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
    depth: 1,
    limit: 1,
    populate: { people: PERSON_POPULATE },
  })
  const course = res.docs[0]
  if (!course) return null
  const lessons = await payload.find({
    collection: 'lessons',
    where: { and: [{ course: { equals: course.id } }, { status: { equals: 'published' } }] },
    select: { slug: true, title: true, module: true, order: true, durationMinutes: true },
    depth: 0,
    sort: 'order',
    limit: 200,
    pagination: false,
  })
  return {
    course,
    lessons: lessons.docs.map((l) => ({
      id: l.id,
      slug: l.slug ?? '',
      title: l.title,
      module: l.module,
      order: l.order,
      durationMinutes: l.durationMinutes ?? null,
    })) as OutlineLesson[],
  }
}

/** Lesson content without quiz answers (answers are checked on the server). */
export async function getLesson(payload: Payload, courseId: number, lessonSlug: string) {
  const res = await payload.find({
    collection: 'lessons',
    where: {
      and: [
        { course: { equals: courseId } },
        { slug: { equals: lessonSlug } },
        { status: { equals: 'published' } },
      ],
    },
    depth: 1,
    limit: 1,
  })
  const lesson = res.docs[0]
  if (!lesson) return null
  const quiz = (lesson.quiz ?? []).map((q) => ({
    id: q.id ?? '',
    question: q.question,
    options: (q.options ?? []).map((o) => o.text),
  }))
  return { ...lesson, quiz }
}

/* ---------------- Q&A ---------------- */

const QUESTION_SELECT = {
  title: true,
  slug: true,
  body: true,
  category: true,
  answeredBy: true,
  publishedAt: true,
} as const

export async function listQuestions(
  payload: Payload,
  params: {
    category?: string | null
    q?: string | null
    page?: number
    limit?: number
    answeredById?: number | string
    reviewerId?: number | string
  } = {},
) {
  const and: Where[] = [{ _status: { equals: 'published' } }]
  if (params.category && params.category !== 'all')
    and.push({ 'category.slug': { equals: params.category } })
  if (params.answeredById) and.push({ answeredBy: { equals: params.answeredById } })
  if (params.reviewerId) and.push({ reviewedBy: { contains: params.reviewerId } })
  const q = params.q?.trim()
  if (q)
    and.push({
      or: [{ title: { like: q } }, { body: { like: q } }, { answerExcerpt: { like: q } }],
    })
  const res = await payload.find({
    collection: 'questions',
    where: { and },
    select: QUESTION_SELECT,
    populate: { categories: CATEGORY_POPULATE, people: PERSON_POPULATE },
    depth: 1,
    sort: '-publishedAt',
    page: params.page ?? 1,
    limit: params.limit ?? 10,
  })
  return {
    docs: res.docs.map((d) => toQuestionCard(d as never)),
    totalDocs: res.totalDocs,
    totalPages: res.totalPages,
    page: res.page ?? 1,
    hasNextPage: res.hasNextPage,
  }
}

export async function getQuestion(
  payload: Payload,
  slug: string,
  opts: { draft?: boolean; user?: User | null } = {},
) {
  const res = await payload.find({
    collection: 'questions',
    where: { slug: { equals: slug } },
    draft: opts.draft,
    overrideAccess: false,
    user: opts.user ?? undefined,
    depth: 1,
    limit: 1,
    populate: {
      categories: CATEGORY_POPULATE,
      people: PERSON_POPULATE,
      questions: { title: true, slug: true },
    },
  })
  const doc = res.docs[0]
  if (!doc || (!opts.draft && doc._status !== 'published')) return null
  // the asker's account never leaves the server; only a display name when they chose to be named
  const askerId = doc.askedBy && typeof doc.askedBy === 'object' ? doc.askedBy.id : doc.askedBy
  let askerName: string | null = null
  if (!doc.anonymous && askerId) {
    const asker = await payload.findByID({
      collection: 'users',
      id: askerId,
      select: { name: true },
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
    })
    askerName = asker?.name ?? null
  }
  const { askedBy: _askedBy, assignedTo: _assignedTo, moderationNote: _note, ...rest } = doc
  return { ...rest, askerName }
}
