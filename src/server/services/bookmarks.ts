import { z } from 'zod'

import { bn } from '@/lib/format'
import { ayahReference, surahPath } from '@/lib/quran-meta'

import { requireUser, type ServiceContext } from './context'
import { errors } from './errors'

export const BOOKMARK_COLLECTIONS = [
  'articles',
  'ikhtilaf-topics',
  'videos',
  'questions',
  'ayahs',
  'hadiths',
] as const
export type BookmarkCollection = (typeof BOOKMARK_COLLECTIONS)[number]

export const bookmarkTargetSchema = z.object({
  collection: z.enum(BOOKMARK_COLLECTIONS),
  id: z.coerce.number().int().positive(),
})

const PUBLISHED_FIELD: Record<BookmarkCollection, { field: string; value: string } | null> = {
  articles: { field: '_status', value: 'published' },
  'ikhtilaf-topics': { field: '_status', value: 'published' },
  questions: { field: '_status', value: 'published' },
  videos: { field: 'status', value: 'published' },
  ayahs: null,
  hadiths: null,
}

/** Save or unsave an item; returns the new state. */
export async function toggleBookmark(
  ctx: ServiceContext,
  input: z.input<typeof bookmarkTargetSchema>,
) {
  const user = requireUser(ctx)
  const { collection, id } = bookmarkTargetSchema.parse(input)
  const targetKey = `${collection}:${id}`
  const existing = await ctx.payload.find({
    collection: 'bookmarks',
    where: { and: [{ user: { equals: user.id } }, { targetKey: { equals: targetKey } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (existing.docs[0]) {
    await ctx.payload.delete({
      collection: 'bookmarks',
      id: existing.docs[0].id,
      overrideAccess: true,
    })
    return { saved: false }
  }
  const target = (await ctx.payload
    .findByID({ collection, id, depth: 0, overrideAccess: true })
    .catch(() => null)) as Record<string, unknown> | null
  const rule = PUBLISHED_FIELD[collection]
  if (!target || (rule && target[rule.field] !== rule.value)) throw errors.notFound()
  const count = await ctx.payload.count({
    collection: 'bookmarks',
    where: { user: { equals: user.id } },
    overrideAccess: true,
  })
  if (count.totalDocs >= 1000)
    throw errors.invalid('সংরক্ষণের সীমা পূর্ণ হয়েছে। পুরনো কিছু সরিয়ে আবার চেষ্টা করুন।')
  await ctx.payload.create({
    collection: 'bookmarks',
    data: { user: user.id, target: { relationTo: collection, value: id }, targetKey },
    overrideAccess: true,
  })
  return { saved: true }
}

export async function bookmarkStatus(ctx: ServiceContext, keys: string[]) {
  const user = requireUser(ctx)
  const clean = keys.filter((k) => /^[a-z-]+:\d+$/.test(k)).slice(0, 100)
  if (!clean.length) return { saved: {} as Record<string, boolean> }
  const res = await ctx.payload.find({
    collection: 'bookmarks',
    where: { and: [{ user: { equals: user.id } }, { targetKey: { in: clean } }] },
    select: { targetKey: true },
    depth: 0,
    limit: clean.length,
    overrideAccess: true,
  })
  const saved: Record<string, boolean> = Object.fromEntries(clean.map((k) => [k, false]))
  for (const b of res.docs) saved[b.targetKey] = true
  return { saved }
}

export type BookmarkItem = {
  id: number
  collection: BookmarkCollection
  title: string
  href: string
  meta: string
  savedAt: string
}

const LABEL: Record<BookmarkCollection, string> = {
  articles: 'প্রবন্ধ',
  'ikhtilaf-topics': 'মতপার্থক্যের বিষয়',
  videos: 'ভিডিও',
  questions: 'প্রশ্নোত্তর',
  ayahs: 'আয়াত',
  hadiths: 'হাদিস',
}

export async function listBookmarks(
  ctx: ServiceContext,
  params: { page?: number; limit?: number; collection?: BookmarkCollection } = {},
) {
  const user = requireUser(ctx)
  const res = await ctx.payload.find({
    collection: 'bookmarks',
    where: {
      and: [
        { user: { equals: user.id } },
        ...(params.collection ? [{ 'target.relationTo': { equals: params.collection } }] : []),
      ],
    },
    depth: 2,
    sort: '-createdAt',
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    overrideAccess: true,
    populate: {
      articles: { title: true, slug: true, readingTime: true, category: true },
      'ikhtilaf-topics': { title: true, slug: true, readingTime: true },
      videos: { title: true, slug: true, durationSeconds: true },
      questions: { title: true, slug: true },
      ayahs: { surah: true, ayah: true, translation: true },
      hadiths: { key: true, text: true },
      categories: { name: true },
    },
  })
  const items: BookmarkItem[] = []
  for (const b of res.docs) {
    const t = b.target as {
      relationTo: BookmarkCollection
      value: Record<string, unknown> | number
    }
    const v = typeof t.value === 'object' ? t.value : null
    if (!v) continue
    const col = t.relationTo
    let title = String(v.title ?? '')
    let href = '/'
    let meta = LABEL[col]
    if (col === 'articles') {
      href = `/ilm/${v.slug}`
      const cat = (v.category as { name?: string } | null)?.name
      meta = [cat, v.readingTime ? `${bn(v.readingTime as number)} মিনিট` : null]
        .filter(Boolean)
        .join(' · ')
    } else if (col === 'ikhtilaf-topics') {
      href = `/ikhtilaf/${v.slug}`
      meta = `মতপার্থক্যের বিষয়${v.readingTime ? ` · ${bn(v.readingTime as number)} মিনিট` : ''}`
    } else if (col === 'videos') href = `/videos/${v.slug}`
    else if (col === 'questions') href = `/qa/${v.slug}`
    else if (col === 'ayahs') {
      title = String(v.translation ?? '')
      href = surahPath(v.surah as number, v.ayah as number)
      meta = ayahReference(v.surah as number, v.ayah as number)
    } else if (col === 'hadiths') {
      title = String(v.text ?? '').slice(0, 140)
      const [book, num] = String(v.key ?? '').split(':')
      href = `/hadith/${book}/${num}`
    }
    items.push({ id: b.id, collection: col, title, href, meta, savedAt: b.createdAt })
  }
  return {
    docs: items,
    totalDocs: res.totalDocs,
    totalPages: res.totalPages,
    page: res.page ?? 1,
    hasNextPage: res.hasNextPage,
  }
}

/** Saved articles the PWA keeps for offline reading (newest first, at most 100). */
export async function offlineArticles(
  ctx: ServiceContext,
): Promise<{ url: string; title: string }[]> {
  const user = requireUser(ctx)
  const res = await ctx.payload.find({
    collection: 'bookmarks',
    where: {
      and: [{ user: { equals: user.id } }, { 'target.relationTo': { equals: 'articles' } }],
    },
    depth: 1,
    limit: 100,
    sort: '-createdAt',
    overrideAccess: true,
    populate: { articles: { slug: true, title: true } },
  })
  return res.docs.flatMap((b) => {
    const a = (b.target as { value?: { slug?: string; title?: string; _status?: string } }).value
    return a?.slug ? [{ url: `/ilm/${a.slug}`, title: a.title ?? '' }] : []
  })
}
