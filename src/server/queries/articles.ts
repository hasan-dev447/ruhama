import type { Payload, Where } from 'payload'
import type { User } from '@/payload-types'

import { toArticleCard, toCategory, toIkhtilafCard, toPerson } from './mappers'
import type { ArticleCardView, CategoryView } from './types'

export const PERSON_POPULATE = {
  name: true,
  slug: true,
  avatarTone: true,
  title: true,
  kinds: true,
  verified: true,
  bio: true,
  specialty: true,
} as const
export const CATEGORY_POPULATE = { name: true, slug: true, icon: true } as const

const CARD_SELECT = {
  title: true,
  slug: true,
  excerpt: true,
  category: true,
  level: true,
  readingTime: true,
  tint: true,
  author: true,
  reviewStatus: true,
  publishedAt: true,
} as const

const populate = { categories: CATEGORY_POPULATE, people: PERSON_POPULATE }

export type ArticleListParams = {
  categories?: string[]
  level?: string | null
  q?: string | null
  sort?: 'new' | 'short' | 'long'
  page?: number
  limit?: number
  authorId?: number | string
  reviewerId?: number | string
  seriesId?: number | string
  excludeId?: number | string
}

export type Paged<T> = {
  docs: T[]
  totalDocs: number
  totalPages: number
  page: number
  hasNextPage: boolean
}

export async function listArticles(
  payload: Payload,
  params: ArticleListParams = {},
): Promise<Paged<ArticleCardView>> {
  const and: Where[] = [{ _status: { equals: 'published' } }]
  if (params.categories?.length) and.push({ 'category.slug': { in: params.categories } })
  if (params.level && params.level !== 'all') and.push({ level: { equals: params.level } })
  if (params.authorId) and.push({ author: { equals: params.authorId } })
  if (params.reviewerId) and.push({ reviewedBy: { contains: params.reviewerId } })
  if (params.seriesId) and.push({ series: { equals: params.seriesId } })
  if (params.excludeId) and.push({ id: { not_equals: params.excludeId } })
  const q = params.q?.trim()
  if (q)
    and.push({
      or: [{ title: { like: q } }, { 'author.name': { like: q } }, { excerpt: { like: q } }],
    })
  const sort =
    params.sort === 'short'
      ? 'readingTime'
      : params.sort === 'long'
        ? '-readingTime'
        : '-publishedAt'
  const res = await payload.find({
    collection: 'articles',
    where: { and },
    select: CARD_SELECT,
    populate,
    depth: 1,
    sort,
    page: params.page ?? 1,
    limit: params.limit ?? 12,
  })
  return {
    docs: res.docs.map((d) => toArticleCard(d as never)),
    totalDocs: res.totalDocs,
    totalPages: res.totalPages,
    page: res.page ?? 1,
    hasNextPage: res.hasNextPage,
  }
}

export async function getArticle(
  payload: Payload,
  slug: string,
  opts: { draft?: boolean; user?: User | null } = {},
) {
  const res = await payload.find({
    collection: 'articles',
    where: { slug: { equals: slug } },
    draft: opts.draft,
    depth: 2,
    limit: 1,
    overrideAccess: false,
    user: opts.user ?? undefined,
    populate: {
      categories: CATEGORY_POPULATE,
      people: PERSON_POPULATE,
      tags: { name: true, slug: true },
      articles: CARD_SELECT,
      series: { title: true, slug: true },
    },
  })
  const doc = res.docs[0]
  if (!doc) return null
  if (!opts.draft && doc._status !== 'published') return null
  return doc
}

export async function relatedArticles(
  payload: Payload,
  article: { id: number; category?: unknown; relatedArticles?: unknown },
  limit = 3,
) {
  const manual = ((article.relatedArticles as unknown[]) ?? []).filter(
    (a) => a && typeof a === 'object',
  ) as Record<string, unknown>[]
  if (manual.length >= limit) return manual.slice(0, limit).map((d) => toArticleCard(d))
  const categoryId = (article.category as { id?: number } | null)?.id ?? article.category
  const res = await payload.find({
    collection: 'articles',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { id: { not_in: [article.id, ...manual.map((m) => m.id as number)] } },
        ...(categoryId ? [{ category: { equals: categoryId } }] : []),
      ],
    } as Where,
    select: CARD_SELECT,
    populate,
    depth: 1,
    sort: '-publishedAt',
    limit: limit - manual.length,
  })
  const extra = res.docs.map((d) => toArticleCard(d as never))
  if (manual.length + extra.length < limit) {
    const more = await listArticles(payload, {
      limit: limit - manual.length - extra.length + 1,
      excludeId: article.id,
    })
    for (const m of more.docs)
      if (!extra.find((e) => e.id === m.id) && extra.length + manual.length < limit) extra.push(m)
  }
  return [...manual.map((d) => toArticleCard(d)), ...extra]
}

export async function listCategories(
  payload: Payload,
  usedFor: 'articles' | 'questions' | 'videos' | 'events' | 'ikhtilaf',
): Promise<CategoryView[]> {
  const res = await payload.find({
    collection: 'categories',
    where: { usedFor: { contains: usedFor } },
    depth: 0,
    limit: 50,
    sort: 'order',
    select: {
      name: true,
      slug: true,
      icon: true,
      description: true,
      articleCount: true,
      questionCount: true,
      videoCount: true,
    },
  })
  return res.docs.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug ?? '',
    icon: c.icon ?? null,
    description: c.description ?? null,
    articleCount: c.articleCount ?? 0,
    questionCount: c.questionCount ?? 0,
    videoCount: c.videoCount ?? 0,
  }))
}

export async function countPublishedArticles(payload: Payload) {
  return (
    await payload.count({ collection: 'articles', where: { _status: { equals: 'published' } } })
  ).totalDocs
}

/* ---------------- ikhtilaf ---------------- */

const IKH_SELECT = {
  title: true,
  slug: true,
  lead: true,
  category: true,
  subTopic: true,
  level: true,
  readingTime: true,
  opinions: true,
  conduct: true,
  publishedAt: true,
} as const

export async function listIkhtilaf(
  payload: Payload,
  params: { limit?: number; excludeId?: number; page?: number } = {},
) {
  const res = await payload.find({
    collection: 'ikhtilaf-topics',
    where: {
      and: [
        { _status: { equals: 'published' } },
        ...(params.excludeId ? [{ id: { not_equals: params.excludeId } }] : []),
      ],
    },
    select: IKH_SELECT,
    populate: { categories: CATEGORY_POPULATE },
    depth: 1,
    sort: '-publishedAt',
    limit: params.limit ?? 20,
    page: params.page ?? 1,
  })
  return {
    docs: res.docs.map((d) => toIkhtilafCard(d as never)),
    totalDocs: res.totalDocs,
    totalPages: res.totalPages,
    page: res.page ?? 1,
  }
}

export async function getIkhtilaf(
  payload: Payload,
  slug: string,
  opts: { draft?: boolean; user?: User | null } = {},
) {
  const res = await payload.find({
    collection: 'ikhtilaf-topics',
    where: { slug: { equals: slug } },
    draft: opts.draft,
    overrideAccess: false,
    user: opts.user ?? undefined,
    depth: 2,
    limit: 1,
    populate: {
      categories: CATEGORY_POPULATE,
      people: PERSON_POPULATE,
      'ikhtilaf-topics': IKH_SELECT,
    },
  })
  const doc = res.docs[0]
  if (!doc || (!opts.draft && doc._status !== 'published')) return null
  return doc
}

export { toCategory, toPerson }
