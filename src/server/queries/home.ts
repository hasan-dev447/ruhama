import type { Payload } from 'payload'

import { TIME_ZONE } from '@/lib/format'
import { ayahReference, surahPath } from '@/lib/quran-meta'

import { CATEGORY_POPULATE, getIkhtilaf, listArticles, listCategories } from './articles'
import { listUpcomingEvents } from './events'
import { toIkhtilafCard } from './mappers'

export type DailyAyah = {
  arabic: string
  translation: string
  reference: string
  ayahKey: string | null
  ayahId: number | null
  /** the verse's own page, e.g. /quran/al-baqarah/255 */
  href: string | null
}
export type DailyHadith = {
  arabic: string | null
  text: string
  narrator: string | null
  reference: string
  grade: string | null
  hadithKey: string | null
  /** the hadith's own page, e.g. /hadith/bukhari/1 */
  href: string | null
}

/** Today's date in Bangladesh as YYYY-MM-DD */
export function bdToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

type Reminder = {
  id: number
  date?: string | null
  ayah?:
    | {
        id?: number
        arabic?: string
        translation?: string
        surah?: number
        ayah?: number
        key?: string
      }
    | number
    | null
  ayahTo?: { ayah?: number } | number | null
  hadith?:
    | {
        arabic?: string | null
        text?: string
        narrator?: string | null
        grade?: string | null
        key?: string
        number?: number
        numberLabel?: string | null
        book?: { name?: string; slug?: string } | number
      }
    | number
    | null
  custom?: {
    arabic?: string | null
    translation?: string | null
    reference?: string | null
    narrator?: string | null
    grade?: string | null
  }
}

const asObj = <T>(v: T | number | null | undefined): T | null =>
  v && typeof v === 'object' ? v : null

function pick(reminders: Reminder[], today: string): Reminder | null {
  if (!reminders.length) return null
  const dated = reminders.find((r) => r.date?.slice(0, 10) === today)
  if (dated) return dated
  const pool = reminders.filter((r) => !r.date)
  const list = pool.length ? pool : reminders
  const day = Math.floor(Date.parse(`${today}T00:00:00Z`) / 86400000)
  return list[day % list.length] ?? null
}

/** The daily verse and hadith: a reminder dated today, otherwise rotated by day. */
export async function getDaily(
  payload: Payload,
  today = bdToday(),
): Promise<{ ayah: DailyAyah | null; hadith: DailyHadith | null; date: string }> {
  const res = await payload.find({
    collection: 'daily-reminders',
    where: { active: { equals: true } },
    depth: 2,
    limit: 200,
    pagination: false,
    sort: 'id',
    populate: {
      ayahs: { arabic: true, translation: true, surah: true, ayah: true, key: true },
      hadiths: {
        arabic: true,
        text: true,
        narrator: true,
        grade: true,
        key: true,
        number: true,
        numberLabel: true,
        book: true,
      },
      'hadith-collections': { name: true, slug: true },
    },
  })
  const docs = res.docs as unknown as (Reminder & { kind: 'ayah' | 'hadith' })[]
  const a = pick(
    docs.filter((d) => d.kind === 'ayah'),
    today,
  )
  const h = pick(
    docs.filter((d) => d.kind === 'hadith'),
    today,
  )

  let ayah: DailyAyah | null = null
  if (a) {
    const doc = asObj(a.ayah)
    const to = asObj(a.ayahTo)
    ayah = {
      arabic: a.custom?.arabic || doc?.arabic || '',
      translation: a.custom?.translation || doc?.translation || '',
      reference:
        a.custom?.reference ||
        (doc?.surah && doc.ayah ? ayahReference(doc.surah, doc.ayah, to?.ayah) : ''),
      ayahKey: doc?.key ?? null,
      ayahId: doc?.id ?? null,
      href: doc?.surah && doc.ayah ? surahPath(doc.surah, doc.ayah) : null,
    }
  }
  let hadith: DailyHadith | null = null
  if (h) {
    const doc = asObj(h.hadith)
    const book = asObj(doc?.book)
    hadith = {
      arabic: h.custom?.arabic || doc?.arabic || null,
      text: h.custom?.translation || doc?.text || '',
      narrator: h.custom?.narrator || doc?.narrator || null,
      reference:
        h.custom?.reference ||
        (book?.name && doc ? `${book.name} : ${doc.numberLabel ?? doc.number}` : ''),
      grade: h.custom?.grade || doc?.grade || null,
      hadithKey: doc?.key ?? null,
      href: book?.slug && doc?.number ? `/hadith/${book.slug}/${doc.number}` : null,
    }
  }
  return { ayah, hadith, date: today }
}

export async function getHomeData(payload: Payload) {
  const [articles, categories, events, home] = await Promise.all([
    listArticles(payload, { limit: 3 }),
    listCategories(payload, 'articles'),
    listUpcomingEvents(payload, 3),
    payload.findGlobal({ slug: 'home-page', depth: 0, select: { featuredIkhtilaf: true } }),
  ])
  const featuredId = (home as { featuredIkhtilaf?: number | null }).featuredIkhtilaf
  let featured = null
  if (featuredId) {
    const doc = await payload
      .findByID({
        collection: 'ikhtilaf-topics',
        id: featuredId,
        depth: 1,
        populate: { categories: CATEGORY_POPULATE },
      })
      .catch(() => null)
    if (doc && doc._status === 'published') featured = toIkhtilafCard(doc as never)
  }
  return { articles: articles.docs, categories, events, featured }
}

export { getIkhtilaf }
