import type { Payload, Where } from 'payload'

import { PERSON_POPULATE } from './articles'

const SCHOLAR_SELECT = {
  name: true,
  slug: true,
  avatarTone: true,
  title: true,
  kinds: true,
  verified: true,
  expertise: true,
  articleCount: true,
  answerCount: true,
  lectureCount: true,
} as const

export type ScholarCard = {
  id: number
  name: string
  slug: string
  tone: 'teal' | 'gold'
  title: string | null
  verified: boolean
  expertise: string[]
  articleCount: number
  answerCount: number
  lectureCount: number
}

export async function listScholars(
  payload: Payload,
  params: { field?: string | null; q?: string | null; sort?: string | null } = {},
): Promise<ScholarCard[]> {
  const and: Where[] = [{ active: { equals: true } }, { kinds: { contains: 'scholar' } }]
  if (params.field && params.field !== 'all') and.push({ expertise: { in: [params.field] } })
  const q = params.q?.trim()
  if (q)
    and.push({ or: [{ name: { like: q } }, { title: { like: q } }, { searchText: { like: q } }] })
  const sort =
    params.sort === 'answers'
      ? '-answerCount'
      : params.sort === 'lectures'
        ? '-lectureCount'
        : 'name'
  const res = await payload.find({
    collection: 'people',
    where: { and },
    select: SCHOLAR_SELECT,
    depth: 0,
    sort,
    limit: 100,
    pagination: false,
  })
  return res.docs.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug ?? '',
    tone: p.avatarTone === 'gold' ? 'gold' : 'teal',
    title: p.title ?? null,
    verified: Boolean(p.verified),
    expertise: p.expertise ?? [],
    articleCount: p.articleCount ?? 0,
    answerCount: p.answerCount ?? 0,
    lectureCount: p.lectureCount ?? 0,
  }))
}

/** Distinct expertise tags across the scholar panel (filter chips). */
export async function scholarFields(payload: Payload): Promise<string[]> {
  const res = await payload.find({
    collection: 'people',
    where: { and: [{ active: { equals: true } }, { kinds: { contains: 'scholar' } }] },
    select: { expertise: true },
    depth: 0,
    limit: 100,
    pagination: false,
  })
  const counts = new Map<string, number>()
  for (const p of res.docs)
    for (const e of p.expertise ?? []) counts.set(e, (counts.get(e) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([e]) => e)
    .slice(0, 10)
}

export async function getPerson(payload: Payload, slug: string) {
  const res = await payload.find({
    collection: 'people',
    where: { and: [{ slug: { equals: slug } }, { active: { equals: true } }] },
    depth: 0,
    limit: 1,
  })
  return res.docs[0] ?? null
}

export async function listShura(payload: Payload) {
  const res = await payload.find({
    collection: 'people',
    where: {
      and: [
        { active: { equals: true } },
        { shuraRole: { exists: true } },
        { shuraRole: { not_equals: '' } },
      ],
    },
    select: { name: true, slug: true, avatarTone: true, shuraRole: true, kinds: true },
    depth: 0,
    sort: 'shuraOrder',
    limit: 500,
    pagination: false,
  })
  return res.docs
}

export async function listSeriesByAuthor(payload: Payload, personId: number) {
  const res = await payload.find({
    collection: 'series',
    where: { author: { equals: personId } },
    depth: 0,
    limit: 10,
  })
  return res.docs
}

export { PERSON_POPULATE }
