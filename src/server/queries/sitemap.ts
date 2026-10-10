import type { CollectionSlug, Payload, Where } from 'payload'

import { AYAH_PAGE, surahPath } from '@/lib/quran-meta'

export type SitemapEntry = {
  path: string
  lastModified?: string | null
  priority?: number
  changeFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
}

export const SITEMAP_TYPES = [
  'pages',
  'articles',
  'ikhtilaf',
  'questions',
  'courses',
  'events',
  'circles',
  'videos',
  'people',
  'quran',
  'hadith',
] as const
export type SitemapType = (typeof SITEMAP_TYPES)[number]

const STATIC_PAGES: SitemapEntry[] = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/about/shura', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/adab', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/ilm', priority: 0.9, changeFrequency: 'daily' },
  { path: '/ikhtilaf', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/qa', priority: 0.9, changeFrequency: 'daily' },
  { path: '/courses', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/events', priority: 0.8, changeFrequency: 'daily' },
  { path: '/circles', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/videos', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/scholars', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/quran', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/hadith', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/forum', priority: 0.6, changeFrequency: 'daily' },
  { path: '/join', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/contact', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/sources', priority: 0.3, changeFrequency: 'yearly' },
]

async function all(
  payload: Payload,
  collection: CollectionSlug,
  where: Where,
  select: Record<string, true>,
) {
  const res = await payload.find({
    collection,
    where,
    select: select as never,
    depth: 0,
    limit: 5000,
    pagination: false,
    sort: '-updatedAt',
  })
  return res.docs as unknown as Record<string, unknown>[]
}

const published: Where = { _status: { equals: 'published' } }
const statusPublished: Where = { status: { equals: 'published' } }

/** URLs for one sitemap file. Only slugs and timestamps are read. */
export async function sitemapEntries(payload: Payload, type: SitemapType): Promise<SitemapEntry[]> {
  switch (type) {
    case 'pages':
      return STATIC_PAGES
    case 'articles':
      return (await all(payload, 'articles', published, { slug: true, updatedAt: true })).map(
        (d) => ({ path: `/ilm/${d.slug}`, lastModified: d.updatedAt as string, priority: 0.7 }),
      )
    case 'ikhtilaf':
      return (
        await all(payload, 'ikhtilaf-topics', published, { slug: true, updatedAt: true })
      ).map((d) => ({
        path: `/ikhtilaf/${d.slug}`,
        lastModified: d.updatedAt as string,
        priority: 0.7,
      }))
    case 'questions':
      return (await all(payload, 'questions', published, { slug: true, updatedAt: true })).map(
        (d) => ({ path: `/qa/${d.slug}`, lastModified: d.updatedAt as string, priority: 0.6 }),
      )
    case 'courses': {
      const courses = await all(payload, 'courses', statusPublished, {
        slug: true,
        updatedAt: true,
      })
      const lessons = await payload.find({
        collection: 'lessons',
        where: statusPublished,
        select: { slug: true, course: true, updatedAt: true },
        populate: { courses: { slug: true } },
        depth: 1,
        limit: 5000,
        pagination: false,
      })
      return [
        ...courses.map((d) => ({
          path: `/courses/${d.slug}`,
          lastModified: d.updatedAt as string,
          priority: 0.7,
        })),
        ...lessons.docs
          .filter((l) => l.course && typeof l.course === 'object')
          .map((l) => ({
            path: `/courses/${(l.course as { slug: string }).slug}/${l.slug}`,
            lastModified: l.updatedAt,
            priority: 0.5,
          })),
      ]
    }
    case 'events':
      return (await all(payload, 'events', statusPublished, { slug: true, updatedAt: true })).map(
        (d) => ({ path: `/events/${d.slug}`, lastModified: d.updatedAt as string, priority: 0.6 }),
      )
    case 'circles':
      return (await all(payload, 'circles', statusPublished, { slug: true, updatedAt: true })).map(
        (d) => ({ path: `/circles/${d.slug}`, lastModified: d.updatedAt as string, priority: 0.5 }),
      )
    case 'videos':
      return (await all(payload, 'videos', statusPublished, { slug: true, updatedAt: true })).map(
        (d) => ({ path: `/videos/${d.slug}`, lastModified: d.updatedAt as string, priority: 0.6 }),
      )
    case 'people':
      return (
        await all(
          payload,
          'people',
          { active: { equals: true } },
          { slug: true, kinds: true, updatedAt: true },
        )
      ).map((d) => ({
        path: `${(d.kinds as string[] | undefined)?.includes('scholar') ? '/scholars' : '/speakers'}/${d.slug}`,
        lastModified: d.updatedAt as string,
        priority: 0.5,
      }))
    case 'hadith': {
      const books = await payload.find({
        collection: 'hadith-collections',
        select: { slug: true, updatedAt: true },
        depth: 0,
        limit: 50,
        pagination: false,
      })
      const slugOf = new Map(books.docs.map((b) => [b.id, b.slug]))
      const hadiths = await payload.find({
        collection: 'hadiths',
        select: { book: true, numberLabel: true, number: true },
        depth: 0,
        limit: 50_000,
        pagination: false,
        sort: 'key',
      })
      return [
        ...books.docs.map((b) => ({
          path: `/hadith/${b.slug}`,
          lastModified: b.updatedAt,
          priority: 0.6,
          changeFrequency: 'monthly' as const,
        })),
        ...hadiths.docs.map((h) => ({
          path: `/hadith/${slugOf.get(h.book as number)}/${h.numberLabel ?? h.number}`,
          priority: 0.4,
        })),
      ]
    }
    case 'quran': {
      const surahs = await payload.find({
        collection: 'surahs',
        select: { number: true, ayahCount: true, updatedAt: true },
        depth: 0,
        limit: 200,
        pagination: false,
        sort: 'number',
      })
      // each surah, plus the later blocks of long surahs (/quran/al-baqarah/41, /81, ...), which are
      // the canonical pages for their ayahs
      return surahs.docs.flatMap((s) => {
        const starts = [1]
        for (let a = 1 + AYAH_PAGE; a <= (s.ayahCount ?? 0); a += AYAH_PAGE) starts.push(a)
        return starts.map((start) => ({
          path: start === 1 ? surahPath(s.number) : surahPath(s.number, start),
          lastModified: s.updatedAt,
          priority: start === 1 ? 0.6 : 0.4,
          changeFrequency: 'yearly' as const,
        }))
      })
    }
  }
}
