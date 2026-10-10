import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

/**
 * The automatic daily verse and hadith, used when the home page's schedule is switched off.
 *
 * - Everyone sees the same pair all day: the choice is seeded by the date, never by the visitor.
 * - The two belong together: each day has a theme (patience, mercy, brotherhood...) and both are
 *   picked from verses and hadiths that speak of it; a theme with nothing suitable falls back to any.
 * - Both stay short enough for the home page cards, and hadiths are shown as the Prophet's words
 *   (the chain of narrators and the publisher's note in brackets are left out).
 */

/** Day themes, each with the Bangla words that mark it in the translations. */
export const DAILY_THEMES: { name: string; words: string[] }[] = [
  { name: 'সবর', words: ['ধৈর্য', 'সবর'] },
  { name: 'রহমত', words: ['রহমত', 'দয়া', 'করুণা'] },
  { name: 'ক্ষমা', words: ['ক্ষমা', 'তওবা', 'তাওবা'] },
  { name: 'ভ্রাতৃত্ব', words: ['ভাই', 'ভ্রাতৃ'] },
  { name: 'শোকর', words: ['কৃতজ্ঞ', 'শোকর', 'শুকর'] },
  { name: 'ইলম', words: ['জ্ঞান', 'ইলম'] },
  { name: 'দোয়া', words: ['দোয়া', 'দু‘আ', 'দুআ', 'প্রার্থনা'] },
  { name: 'সালাত', words: ['সালাত', 'নামাজ', 'নামায'] },
  { name: 'সত্যবাদিতা', words: ['সত্য'] },
  { name: 'দান', words: ['সদকা', 'সাদকা', 'দান কর', 'দান-খয়রাত', 'ব্যয় কর'] },
  { name: 'জিকির', words: ['স্মরণ', 'যিকর', 'জিকির'] },
  { name: 'জান্নাত', words: ['জান্নাত'] },
  { name: 'আখলাক', words: ['চরিত্র', 'আখলাক', 'উত্তম'] },
]

// a verse read alone on the home page should comfort and guide; these need their context
const AYAH_AVOID = new RegExp(
  [
    // punishment and the deniers
    'জাহান্নাম|দোযখ|আযাব|আজাব|শাস্তি|অভিশাপ|লা‘নত|ধ্বংস|আগুন|অগ্নি|বিপর্যস্ত',
    'কাফের|কাফির|কুফর|অবিশ্বাসী|অস্বীকার|মুনাফিক|মুশরিক|জালেম|যালেম|জালিম|ফেরাউন',
    'গোমরাহ|পথভ্রষ্ট|সীমালংঘন|সীমালঙ্ঘন|অবাধ্য|মিথ্যারোপ|মিথ্যা প্রতিপন্ন|অপরাধী|পাপিষ্ঠ|মন্দ কর্ম',
    // rebukes ("why do they not...", "he did not...") and story dialogue
    'কেন|অকৃতজ্ঞ|করেনি|পড়েনি|আনেনি|বলল|বলিল|বলেছিল',
  ].join('|'),
)

/** Day number (days since 1970) of a YYYY-MM-DD date. */
const dayNumber = (day: string) => Math.floor(Date.parse(`${day}T00:00:00Z`) / 86400000)

export const themeOf = (day: string) => DAILY_THEMES[dayNumber(day) % DAILY_THEMES.length]!

const AYAH_MAX = 170
const MATN_MIN = 25
const MATN_MAX = 220
/** Above this the Arabic is mostly the chain of narrators, so the card shows the Bangla alone. */
export const HADITH_ARABIC_MAX = 200

const QUOTE_START = /(?:বলেছেন|বলেন|বলতে শুনেছি|ইরশাদ করেছেন)\s*[ঃ:]\s*/g
// a footnote mark ([1], [৪৪৪০]) or a grading remark (": সহীহ, ইবনু মা-জাহ ...") ends the words
const NOTES_START = /\s*(?:\[[0-9০-৯]+\]|:?\s*(?:সহীহ|সহিহ|হাসান|যঈফ|দ্বঈফ)\s*[,।:(]).*$/s
const PUBLISHER_NOTE =
  /\s*\((?:[^()]*?)(?:ফাউন্ডেশন|সেন্টার|প্রকাশনী|তাওহীদ|একাডেমী|আধুনিক|ইফা|হাদীস নং)[^()]*\)\s*$/

/**
 * The Prophet's words from a hadith translation: what follows "...বলেছেনঃ" (the last such opening
 * before the words, after the narrators), without a publisher's note at the end. `null` when the
 * text has no clear opening, so it is not used.
 */
export function hadithWords(text: string): string | null {
  const starts = [...text.matchAll(QUOTE_START)]
  if (!starts.length) return null
  // the opening that follows the Prophet's name, else the first one
  const afterProphet = starts.find((m) =>
    /সাল্লাল্লাহু|সাল্লাম|রাসূল|রসূল|নবী/.test(text.slice(Math.max(0, m.index! - 60), m.index)),
  )
  const start = afterProphet ?? starts[0]!
  const words = text
    .slice(start.index! + start[0].length)
    .replace(NOTES_START, '')
    .replace(PUBLISHER_NOTE, '')
    .replace(/^[\s"“”'‘’-]+|[\s"“”'‘’-]+$/g, '')
    .trim()
  return words || null
}

type Db = { execute: (q: unknown) => Promise<{ rows: Record<string, unknown>[] }> }
const dbOf = (payload: Payload) => (payload.db as unknown as { drizzle: Db }).drizzle

/** `and <column> ilike any(array['%word%', ...])`, or nothing when there are no words. */
const likeAny = (column: 'translation' | 'text', words: string[] | null) =>
  words?.length
    ? sql`and ${sql.raw(column)} ilike any(array[${sql.join(
        words.map((w) => sql`${`%${w}%`}`),
        sql`, `,
      )}])`
    : sql``

async function ayahCandidates(payload: Payload, day: string, words: string[] | null) {
  const { rows } = await dbOf(payload).execute(sql`
    select id, translation from ayahs
    where char_length(translation) between 30 and ${AYAH_MAX} and char_length(arabic) <= 220
      and translation !~ '^(এবং|আর |অতঃপর|তারপর|অথবা|কিংবা|তবে |তারা কি)'
      ${likeAny('translation', words)}
    order by md5(id::text || ${day})
    limit 40`)
  return rows as { id: number; translation: string }[]
}

async function hadithCandidates(payload: Payload, day: string, words: string[] | null) {
  const { rows } = await dbOf(payload).execute(sql`
    select id, text from hadiths
    where char_length(text) between 40 and 480 and grade in ('sahih', 'hasan')
      and text ~ '(বলেছেন|বলেন|বলতে শুনেছি|ইরশাদ করেছেন)\\s*[ঃ:]'
      and text not like '%অনুরূপ%' and text not like '%একই সূত্র%'
      and text not like '%উল্লেখিত হাদীস%' and text not like '%পূর্বোক্ত%'
      ${likeAny('text', words)}
    order by md5(id::text || ${day})
    limit 60`)
  return rows as { id: number; text: string }[]
}

export type AutoPick = {
  theme: string
  ayahId: number | null
  hadith: { id: number; words: string } | null
}

/** Today's automatic pair. Same day, same pair; a new pair every day. */
export async function pickAutoDaily(payload: Payload, day: string): Promise<AutoPick> {
  const theme = themeOf(day)

  let ayahId: number | null = null
  for (const words of [theme.words, null]) {
    const found = (await ayahCandidates(payload, day, words)).find(
      (r) => !AYAH_AVOID.test(r.translation),
    )
    if (found) {
      ayahId = found.id
      break
    }
  }

  let hadith: AutoPick['hadith'] = null
  for (const words of [theme.words, null]) {
    for (const r of await hadithCandidates(payload, day, words)) {
      const w = hadithWords(r.text)
      if (w && w.length >= MATN_MIN && w.length <= MATN_MAX) {
        hadith = { id: r.id, words: w }
        break
      }
    }
    if (hadith) break
  }

  return { theme: theme.name, ayahId, hadith }
}
