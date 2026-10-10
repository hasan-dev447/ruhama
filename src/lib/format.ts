/**
 * Bangla formatting helpers. All dates are shown in Bangladesh time.
 */

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
export const TIME_ZONE = 'Asia/Dhaka'

/** Convert ASCII digits in a number or string to Bangla digits. */
export function bn(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return ''
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d)
}

/** Bangla number with thousands separators, e.g. ১২,৫০০ */
export function bnNumber(value: number): string {
  return new Intl.NumberFormat('bn-BD').format(value)
}

/** Compact Bangla count, e.g. ১.২ হা for 1200 */
export function bnCompact(value: number): string {
  if (value < 1000) return bn(value)
  if (value < 100000)
    return `${bn((value / 1000).toFixed(value < 10000 ? 1 : 0).replace(/\.0$/, ''))} হাজার`
  return `${bn((value / 100000).toFixed(1).replace(/\.0$/, ''))} লাখ`
}

function toDate(input: Date | string | number): Date {
  return input instanceof Date ? input : new Date(input)
}

function parts(input: Date | string | number) {
  const d = toDate(input)
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  })
  const map: Record<string, string> = {}
  for (const p of fmt.formatToParts(d)) map[p.type] = p.value
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour) % 24,
    minute: Number(map.minute),
  }
}

export const BN_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
]

export const BN_WEEKDAYS = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার',
]

/** Weekday index (0 = Sunday) in Bangladesh time */
function weekdayIndex(input: Date | string | number): number {
  const { year, month, day } = parts(input)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

export const valid = (input: Date | string | number) => Number.isFinite(toDate(input).getTime())

/** e.g. "৪ অক্টোবর ২০২৬" */
export function formatDate(input: Date | string | number): string {
  if (!valid(input)) return ''
  const { year, month, day } = parts(input)
  return `${bn(day)} ${BN_MONTHS[month - 1]} ${bn(year)}`
}

/** e.g. "রবিবার, ৪ অক্টোবর ২০২৬" */
export function formatLongDate(input: Date | string | number): string {
  return `${BN_WEEKDAYS[weekdayIndex(input)]}, ${formatDate(input)}`
}

/** e.g. "৪ অক্টো." style short form is avoided; returns "৪ অক্টোবর" */
export function formatDayMonth(input: Date | string | number): string {
  const { month, day } = parts(input)
  return `${bn(day)} ${BN_MONTHS[month - 1]}`
}

export function formatDay(input: Date | string | number): string {
  return bn(parts(input).day)
}

export function formatMonth(input: Date | string | number): string {
  return BN_MONTHS[parts(input).month - 1] ?? ''
}

export function formatYear(input: Date | string | number): string {
  return bn(parts(input).year)
}

export function formatWeekday(input: Date | string | number): string {
  return BN_WEEKDAYS[weekdayIndex(input)] ?? ''
}

function dayPeriod(hour: number): string {
  if (hour >= 4 && hour < 6) return 'ভোর'
  if (hour >= 6 && hour < 12) return 'সকাল'
  if (hour >= 12 && hour < 15) return 'দুপুর'
  if (hour >= 15 && hour < 18) return 'বিকাল'
  if (hour >= 18 && hour < 20) return 'সন্ধ্যা'
  return 'রাত'
}

/** e.g. "রাত ৯:০০" */
export function formatTime(input: Date | string | number): string {
  if (!valid(input)) return ''
  const { hour, minute } = parts(input)
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${dayPeriod(hour)} ${bn(h12)}:${bn(String(minute).padStart(2, '0'))}`
}

/** e.g. "শনিবার, রাত ৯:০০" */
export function formatWeekdayTime(input: Date | string | number): string {
  return `${formatWeekday(input)}, ${formatTime(input)}`
}

const REL_UNITS: [limit: number, size: number, unit: string][] = [
  [3600, 60, 'মিনিট'],
  [86400, 3600, 'ঘণ্টা'],
  [86400 * 7, 86400, 'দিন'],
  [86400 * 30, 86400 * 7, 'সপ্তাহ'],
  [86400 * 365, 86400 * 30, 'মাস'],
]

/**
 * Relative time in Bangla, e.g. "১০ মিনিট আগে", "গতকাল".
 * Spelled out by hand: Node and browsers ship different ICU data for bn, which breaks hydration.
 */
export function formatRelative(input: Date | string | number, now: Date = new Date()): string {
  if (!valid(input)) return ''
  const d = toDate(input)
  const diffSec = Math.round((d.getTime() - now.getTime()) / 1000)
  const abs = Math.abs(diffSec)
  if (abs < 45) return 'এইমাত্র'
  const future = diffSec > 0
  for (const [limit, size, unit] of REL_UNITS) {
    if (abs >= limit) continue
    const n = Math.max(1, Math.round(abs / size))
    if (unit === 'দিন' && n === 1) return future ? 'আগামীকাল' : 'গতকাল'
    return `${bn(n)} ${unit} ${future ? 'পরে' : 'আগে'}`
  }
  return formatDate(d)
}

/** Reading time label, e.g. "৮ মিনিট পড়া" */
export function readingTimeLabel(minutes: number): string {
  return `${bn(Math.max(1, Math.round(minutes)))} মিনিট পড়া`
}

/** Duration in seconds to "mm:ss" or "h:mm:ss" with Bangla digits */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return bn(h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`)
}

/** Duration in minutes to "১ ঘণ্টা ২০ মিনিট" */
export function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = Math.round(totalMinutes % 60)
  if (h && m) return `${bn(h)} ঘণ্টা ${bn(m)} মিনিট`
  if (h) return `${bn(h)} ঘণ্টা`
  return `${bn(m)} মিনিট`
}

/** First letters of a Bangla or English name for avatar initials, e.g. "আম" */
export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const cleaned = name
    .replace(/^(ড\.|ডা\.|উস্তাযা|উস্তায|শাইখ|শায়খ|মাওলানা|মুফতি|হাফেজ|Dr\.|Prof\.)\s*/u, '')
    .trim()
  const words = cleaned.split(/\s+/).filter(Boolean)
  // first letter only (vowel signs dropped), matching the design: সুমাইয়া কবির → সক
  const first = (w: string) => [...w][0] ?? ''
  if (words.length === 0) return '?'
  if (words.length === 1) return first(words[0]!)
  return first(words[0]!) + first(words[words.length - 1]!)
}
