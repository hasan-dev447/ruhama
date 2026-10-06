import { bn } from './format'

/**
 * The 114 surahs: Bangla name, transliteration slug, ayah count (Hafs) and place of revelation.
 * Arabic names are imported from the Quran dataset into the `surahs` collection.
 */
export type SurahMeta = {
  number: number
  bangla: string
  latin: string
  ayahs: number
  medinan: boolean
}

const RAW: [string, string, number][] = [
  ['আল-ফাতিহা', 'al-fatihah', 7],
  ['আল-বাকারা', 'al-baqarah', 286],
  ['আলে ইমরান', 'ali-imran', 200],
  ['আন-নিসা', 'an-nisa', 176],
  ['আল-মায়িদাহ', 'al-maidah', 120],
  ["আল-আন'আম", 'al-anam', 165],
  ["আল-আ'রাফ", 'al-araf', 206],
  ['আল-আনফাল', 'al-anfal', 75],
  ['আত-তাওবা', 'at-tawbah', 129],
  ['ইউনুস', 'yunus', 109],
  ['হুদ', 'hud', 123],
  ['ইউসুফ', 'yusuf', 111],
  ["আর-রা'দ", 'ar-rad', 43],
  ['ইবরাহীম', 'ibrahim', 52],
  ['আল-হিজর', 'al-hijr', 99],
  ['আন-নাহল', 'an-nahl', 128],
  ['আল-ইসরা', 'al-isra', 111],
  ['আল-কাহফ', 'al-kahf', 110],
  ['মারইয়াম', 'maryam', 98],
  ['ত্বা-হা', 'taha', 135],
  ['আল-আম্বিয়া', 'al-anbiya', 112],
  ['আল-হাজ্জ', 'al-hajj', 78],
  ["আল-মু'মিনূন", 'al-muminun', 118],
  ['আন-নূর', 'an-nur', 64],
  ['আল-ফুরকান', 'al-furqan', 77],
  ["আশ-শু'আরা", 'ash-shuara', 227],
  ['আন-নামল', 'an-naml', 93],
  ['আল-কাসাস', 'al-qasas', 88],
  ['আল-আনকাবূত', 'al-ankabut', 69],
  ['আর-রূম', 'ar-rum', 60],
  ['লুকমান', 'luqman', 34],
  ['আস-সাজদাহ', 'as-sajdah', 30],
  ['আল-আহযাব', 'al-ahzab', 73],
  ['সাবা', 'saba', 54],
  ['ফাতির', 'fatir', 45],
  ['ইয়াসীন', 'yasin', 83],
  ['আস-সাফফাত', 'as-saffat', 182],
  ['সোয়াদ', 'sad', 88],
  ['আয-যুমার', 'az-zumar', 75],
  ['গাফির', 'ghafir', 85],
  ['ফুসসিলাত', 'fussilat', 54],
  ['আশ-শূরা', 'ash-shura', 53],
  ['আয-যুখরুফ', 'az-zukhruf', 89],
  ['আদ-দুখান', 'ad-dukhan', 59],
  ['আল-জাসিয়াহ', 'al-jathiyah', 37],
  ['আল-আহকাফ', 'al-ahqaf', 35],
  ['মুহাম্মাদ', 'muhammad', 38],
  ['আল-ফাতহ', 'al-fath', 29],
  ['আল-হুজুরাত', 'al-hujurat', 18],
  ['ক্বাফ', 'qaf', 45],
  ['আয-যারিয়াত', 'adh-dhariyat', 60],
  ['আত-তূর', 'at-tur', 49],
  ['আন-নাজম', 'an-najm', 62],
  ['আল-কামার', 'al-qamar', 55],
  ['আর-রাহমান', 'ar-rahman', 78],
  ["আল-ওয়াকি'আহ", 'al-waqiah', 96],
  ['আল-হাদীদ', 'al-hadid', 29],
  ['আল-মুজাদালাহ', 'al-mujadilah', 22],
  ['আল-হাশর', 'al-hashr', 24],
  ['আল-মুমতাহিনাহ', 'al-mumtahanah', 13],
  ['আস-সাফ', 'as-saff', 14],
  ["আল-জুমু'আহ", 'al-jumuah', 11],
  ['আল-মুনাফিকূন', 'al-munafiqun', 11],
  ['আত-তাগাবুন', 'at-taghabun', 18],
  ['আত-তালাক', 'at-talaq', 12],
  ['আত-তাহরীম', 'at-tahrim', 12],
  ['আল-মুলক', 'al-mulk', 30],
  ['আল-কালাম', 'al-qalam', 52],
  ['আল-হাক্কাহ', 'al-haqqah', 52],
  ["আল-মা'আরিজ", 'al-maarij', 44],
  ['নূহ', 'nuh', 28],
  ['আল-জিন', 'al-jinn', 28],
  ['আল-মুযযাম্মিল', 'al-muzzammil', 20],
  ['আল-মুদ্দাসসির', 'al-muddaththir', 56],
  ['আল-কিয়ামাহ', 'al-qiyamah', 40],
  ['আল-ইনসান', 'al-insan', 31],
  ['আল-মুরসালাত', 'al-mursalat', 50],
  ['আন-নাবা', 'an-naba', 40],
  ["আন-নাযি'আত", 'an-naziat', 46],
  ['আবাসা', 'abasa', 42],
  ['আত-তাকভীর', 'at-takwir', 29],
  ['আল-ইনফিতার', 'al-infitar', 19],
  ['আল-মুতাফফিফীন', 'al-mutaffifin', 36],
  ['আল-ইনশিকাক', 'al-inshiqaq', 25],
  ['আল-বুরূজ', 'al-buruj', 22],
  ['আত-তারিক', 'at-tariq', 17],
  ["আল-আ'লা", 'al-ala', 19],
  ['আল-গাশিয়াহ', 'al-ghashiyah', 26],
  ['আল-ফাজর', 'al-fajr', 30],
  ['আল-বালাদ', 'al-balad', 20],
  ['আশ-শামস', 'ash-shams', 15],
  ['আল-লাইল', 'al-layl', 21],
  ['আদ-দুহা', 'ad-duha', 11],
  ['আশ-শারহ', 'ash-sharh', 8],
  ['আত-তীন', 'at-tin', 8],
  ['আল-আলাক', 'al-alaq', 19],
  ['আল-কাদর', 'al-qadr', 5],
  ['আল-বাইয়্যিনাহ', 'al-bayyinah', 8],
  ['আয-যিলযাল', 'az-zalzalah', 8],
  ['আল-আদিয়াত', 'al-adiyat', 11],
  ["আল-কারি'আহ", 'al-qariah', 11],
  ['আত-তাকাসুর', 'at-takathur', 8],
  ['আল-আসর', 'al-asr', 3],
  ['আল-হুমাযাহ', 'al-humazah', 9],
  ['আল-ফীল', 'al-fil', 5],
  ['কুরাইশ', 'quraysh', 4],
  ["আল-মা'ঊন", 'al-maun', 7],
  ['আল-কাওসার', 'al-kawthar', 3],
  ['আল-কাফিরূন', 'al-kafirun', 6],
  ['আন-নাসর', 'an-nasr', 3],
  ['আল-লাহাব', 'al-masad', 5],
  ['আল-ইখলাস', 'al-ikhlas', 4],
  ['আল-ফালাক', 'al-falaq', 5],
  ['আন-নাস', 'an-nas', 6],
]

const MEDINAN = new Set([
  2, 3, 4, 5, 8, 9, 13, 22, 24, 33, 47, 48, 49, 55, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 76, 98,
  99, 110,
])

export const SURAHS: SurahMeta[] = RAW.map(([bangla, latin, ayahs], i) => ({
  number: i + 1,
  bangla,
  latin,
  ayahs,
  medinan: MEDINAN.has(i + 1),
}))

export const TOTAL_AYAHS = SURAHS.reduce((s, x) => s + x.ayahs, 0)

export function surahMeta(n: number): SurahMeta | undefined {
  return SURAHS[n - 1]
}

export function surahBySlug(slug: string): SurahMeta | undefined {
  return (
    SURAHS.find((s) => s.latin === slug) ??
    (/^\d+$/.test(slug) ? surahMeta(Number(slug)) : undefined)
  )
}

/** e.g. "সূরা আল-হুজুরাত : ১০" or "সূরা আলে ইমরান : ১০২-১০৩" */
export function ayahReference(surah: number, ayah: number, ayahTo?: number | null): string {
  const name = surahMeta(surah)?.bangla ?? bn(surah)
  return `সূরা ${name} : ${bn(ayah)}${ayahTo && ayahTo > ayah ? `-${bn(ayahTo)}` : ''}`
}

/** `/quran/al-baqarah`, or `/quran/al-baqarah/255` for one ayah (a page of its own, shareable). */
export const surahPath = (surah: number, ayah?: number) =>
  `/quran/${surahMeta(surah)?.latin ?? surah}${ayah ? `/${ayah}` : ''}`

/** `/quran/al-kahf`; a bare number such as `/quran/18` redirects to the readable slug. */
export function resolveSurah(param: string) {
  if (/^\d+$/.test(param)) return { meta: surahMeta(Number(param)), redirect: true }
  return { meta: surahBySlug(param), redirect: false }
}

/** Ayahs shown per page of a surah; "load more" adds the next block. */
export const AYAH_PAGE = 40

/** First ayah of the block that holds `ayah` (1, 41, 81, ...). */
export const pageStart = (ayah: number) => Math.floor((ayah - 1) / AYAH_PAGE) * AYAH_PAGE + 1

/** The address search engines should index for the block holding `ayah`. */
export const pageCanonical = (surah: number, ayah: number) => {
  const start = pageStart(ayah)
  return start === 1 ? surahPath(surah) : surahPath(surah, start)
}
