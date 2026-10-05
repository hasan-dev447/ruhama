/** Helpers for imported hadith text: narrator extraction and grade normalisation. */

export type Grade = 'sahih' | 'hasan' | 'daif' | 'mawdu' | 'unknown'

/** Companion honorifics as they appear in the Bangla datasets, normalised to "(রা.)". */
const HONORIFIC = /\((?:রাঃ|রা\.|রাযিঃ|রাযি\.|রাদিয়াল্লাহু ['‘’]?আনহু|রাদিয়াল্লাহু ['‘’]?আনহা)\)/

/** Boundaries before the companion's name: an isnad gap, a sentence end, a successor's honorific or a clause. */
const BEFORE_NAME = /\.{3,}|।|\(রহঃ\)|\(রহ\.\)|বলেনঃ|বলেন,|থেকে|হতে|,|:/

/**
 * The narrator is the name before the first companion honorific near the start,
 * e.g. "আনাস ইবনু মালিক (রাঃ) সূত্রে বর্ণিত…" gives "আনাস ইবনু মালিক (রা.)".
 * Returns null when the text does not open that way.
 */
export function extractNarrator(text: string): string | null {
  const head = cleanHadithText(text).slice(0, 320)
  const m = head.match(HONORIFIC)
  if (!m || m.index === undefined || m.index > 260) return null
  const segments = head.slice(0, m.index).split(BEFORE_NAME)
  const name = (segments[segments.length - 1] ?? '')
    .replace(
      /^(?:(?:আমীরুল মুমিনীন|উম্মুল মুমিনীন|যে|তিনি|আমি|আমরা|তারা|তাঁরা|একদা|অতঃপর)\s+)+/,
      '',
    )
    .replace(/[,।:;-]+$/, '')
    .trim()
  if (
    !name ||
    name.split(/\s+/).length > 7 ||
    /[।"“”()]/.test(name) ||
    /(?:^|\s)(?:সূত্রে|তার|তাঁর|পিতা|নিকট|কাছে|বলেন)(?:\s|$)/.test(name)
  )
    return null
  return `${name} (রা.)`
}

/**
 * The site never shows em or en dashes (U+2014, U+2013). In the source translations they are editorial
 * punctuation: numbering such as "১<dash>(১/৮)" becomes a hyphen, a dash that introduces speech, a list
 * or a quotation ("তিনি বলেছেন<dash> ...") becomes a colon, and one opening a line is dropped.
 * The wording itself is untouched.
 */
// built from code points so no dash or invisible character sits in the source itself
const DASHES = String.fromCharCode(0x2013, 0x2014)
const NUMBERING_DASH = new RegExp(`([০-৯0-9])\\s*[${DASHES}]+\\s*(?=[(০-৯0-9])`, 'g')
const LINE_START_DASH = new RegExp(`(^|\\n)[ \\t]*[${DASHES}]+[ \\t]*`, 'g')
const INLINE_DASH = new RegExp(`[ \\t]*[${DASHES}]+[ \\t]*`, 'g')
const ANY_DASH = new RegExp(`[${DASHES}]`, 'g')
const ZWNJ = String.fromCharCode(0x200c)
const ZWJ = String.fromCharCode(0x200d)
const INVISIBLE = new RegExp(
  `[${String.fromCharCode(0x200b)}${ZWNJ}${ZWJ}${String.fromCharCode(0x2060)}]`,
  'g',
)

export function normalizeDashes(text: string): string {
  return text
    .replace(NUMBERING_DASH, '$1-')
    .replace(LINE_START_DASH, '$1')
    .replace(INLINE_DASH, ': ')
    .replace(/:(\s*:)+/g, ':')
    .replace(/: (?=[\s।,;.)]|$)/g, ':')
}

/** Arabic source text: the rare editorial dash becomes a plain hyphen, nothing else changes. */
export const normalizeArabicDashes = (text: string) => text.replace(ANY_DASH, '-')

/** Trim stray leading punctuation, invisible characters (keeping ZWNJ/ZWJ, which Bangla needs) and dashes. */
export function cleanHadithText(text: string): string {
  return normalizeDashes(
    text.replace(INVISIBLE, (c) => (c === ZWNJ || c === ZWJ ? c : '')).replace(/^[\s।.,:;-]+/, ''),
  ).trim()
}

/** Map a dataset grade label (English) to our grade scale. */
export function mapGrade(label: string | null | undefined): Grade {
  if (!label) return 'unknown'
  const g = label.toLowerCase()
  if (/mawdu|fabricat|maudu/.test(g)) return 'mawdu'
  if (/da.?if|weak|munkar|shadh/.test(g)) return 'daif'
  if (/sahih/.test(g)) return 'sahih'
  if (/hasan/.test(g)) return 'hasan'
  return 'unknown'
}

const GRADE_LABEL_BN: Record<string, string> = {
  sahih: 'সহিহ',
  hasan: 'হাসান',
  daif: 'যঈফ',
  mawdu: 'মাওযু',
}

/**
 * Pick one grade: Bukhari and Muslim are sahih by consensus; otherwise prefer
 * Shaykh al-Albani's verdict, then the first verdict listed.
 */
export function pickGrade(
  book: string,
  grades: { name: string; grade: string }[] | undefined,
): { grade: Grade; source: string | null } {
  if (book === 'bukhari' || book === 'muslim')
    return { grade: 'sahih', source: 'সর্বসম্মত সহিহ গ্রন্থ' }
  const list = grades ?? []
  const chosen = list.find((g) => /albani/i.test(g.name)) ?? list[0]
  if (!chosen) return { grade: 'unknown', source: null }
  const grade = mapGrade(chosen.grade)
  const who = /albani/i.test(chosen.name) ? 'শাইখ আলবানী' : chosen.name
  return {
    grade,
    source: grade === 'unknown' ? `${who}: ${chosen.grade}` : `${who}: ${GRADE_LABEL_BN[grade]}`,
  }
}
