import type { Payload } from 'payload'

import { TIME_ZONE } from '@/lib/format'
import { ayahReference, surahPath } from '@/lib/quran-meta'

import {
  CATEGORY_POPULATE,
  getIkhtilaf,
  IKH_SELECT,
  listArticles,
  listCategories,
} from './articles'
import { HADITH_ARABIC_MAX, pickAutoDaily } from './daily-auto'
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

const SCRIPTURE_POPULATE = {
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
} as const

/** Today's automatic pair (daily-auto.ts), in the same shape as a scheduled reminder. */
async function autoReminders(payload: Payload, today: string) {
  const auto = await pickAutoDaily(payload, today)
  const [ayahDoc, hadithDoc] = await Promise.all([
    auto.ayahId
      ? payload
          .findByID({
            collection: 'ayahs',
            id: auto.ayahId,
            depth: 0,
            select: SCRIPTURE_POPULATE.ayahs,
          })
          .catch(() => null)
      : null,
    auto.hadith
      ? payload
          .findByID({
            collection: 'hadiths',
            id: auto.hadith.id,
            depth: 1,
            select: SCRIPTURE_POPULATE.hadiths,
            populate: { 'hadith-collections': SCRIPTURE_POPULATE['hadith-collections'] },
          })
          .catch(() => null)
      : null,
  ])
  const a: Reminder | null = ayahDoc ? { id: 0, ayah: ayahDoc as Reminder['ayah'] } : null
  const hadith = hadithDoc as (Exclude<Reminder['hadith'], number | null | undefined> & {}) | null
  const h: Reminder | null =
    hadith && auto.hadith
      ? {
          id: 0,
          // the card shows the Prophet's words; long Arabic is mostly the chain of narrators
          hadith: {
            ...hadith,
            arabic:
              hadith.arabic && hadith.arabic.length <= HADITH_ARABIC_MAX ? hadith.arabic : null,
          },
          custom: { translation: auto.hadith.words },
        }
      : null
  return { a, h }
}

/**
 * The daily verse and hadith. On a schedule (the default): a reminder dated today, otherwise the
 * list rotated by day; a kind with nothing on the list falls back to the automatic pick. With the
 * schedule off: the automatic pair for the day (a theme, short texts, same for everyone).
 */
export async function getDaily(
  payload: Payload,
  today = bdToday(),
  scheduled = true,
): Promise<{ ayah: DailyAyah | null; hadith: DailyHadith | null; date: string }> {
  let a: Reminder | null = null
  let h: Reminder | null = null
  if (scheduled) {
    const res = await payload.find({
      collection: 'daily-reminders',
      where: { active: { equals: true } },
      depth: 2,
      limit: 200,
      pagination: false,
      sort: 'id',
      populate: SCRIPTURE_POPULATE,
    })
    const docs = res.docs as unknown as (Reminder & { kind: 'ayah' | 'hadith' })[]
    a = pick(
      docs.filter((d) => d.kind === 'ayah'),
      today,
    )
    h = pick(
      docs.filter((d) => d.kind === 'hadith'),
      today,
    )
  }
  if (!a || !h) {
    const auto = await autoReminders(payload, today)
    a ??= auto.a
    h ??= auto.h
  }

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

type HomeCounts = {
  featuredIkhtilaf?: number | null
  ilmCount?: number | null
  articlesCount?: number | null
  eventsCount?: number | null
}

/** A count from the home page settings, kept to a sane range. */
const count = (value: number | null | undefined, fallback: number, max: number) =>
  Math.min(max, Math.max(1, Math.round(value ?? fallback)))

export async function getHomeData(payload: Payload) {
  const home = (await payload.findGlobal({
    slug: 'home-page',
    depth: 0,
    select: { featuredIkhtilaf: true, ilmCount: true, articlesCount: true, eventsCount: true },
  })) as HomeCounts
  const [articles, allCategories, events] = await Promise.all([
    listArticles(payload, { limit: count(home.articlesCount, 3, 12) }),
    listCategories(payload, 'articles'),
    listUpcomingEvents(payload, count(home.eventsCount, 3, 10)),
  ])
  const categories = allCategories.slice(0, count(home.ilmCount, 7, 15))
  const featuredId = home.featuredIkhtilaf
  let featured = null
  if (featuredId) {
    const doc = await payload
      .findByID({
        select: { ...IKH_SELECT, _status: true },
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
