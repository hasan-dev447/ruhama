/** Attribution for imported scripture datasets, shown on the Quran/Hadith pages and /sources. */
export const QURAN_SOURCE = {
  arabic: {
    label: 'আরবি পাঠ: Tanzil Quran Text (Simple), সংস্করণ ১.১',
    url: 'https://tanzil.net/docs/text_license',
    license: 'CC BY 3.0, অপরিবর্তিত পাঠ',
  },
  translation: {
    label: 'বাংলা অনুবাদ: মাওলানা মুহিউদ্দীন খান',
    url: 'https://tanzil.net/trans/',
    license: 'Tanzil অনুবাদ সংগ্রহ, অবাণিজ্যিক ব্যবহার',
  },
  delivery: {
    label: 'ডেটা সরবরাহ: fawazahmed0/quran-api',
    url: 'https://github.com/fawazahmed0/quran-api',
    license: 'Unlicense',
  },
} as const

export const HADITH_SOURCE = {
  dataset: {
    label: 'হাদিস ডেটাসেট: fawazahmed0/hadith-api (আরবি ও বাংলা সংস্করণ)',
    url: 'https://github.com/fawazahmed0/hadith-api',
    license: 'Unlicense',
  },
  grading:
    'মান: বুখারী ও মুসলিমের হাদিস সর্বসম্মতভাবে সহিহ; অন্যান্য গ্রন্থে শাইখ আলবানী (রহ.)-এর মূল্যায়ন, না থাকলে ডেটাসেটে উল্লিখিত প্রথম মূল্যায়ন।',
} as const

/** Display data for each imported hadith book, keyed by its dataset slug. */
export const HADITH_BOOKS = [
  {
    slug: 'bukhari',
    name: 'সহিহ বুখারী',
    shortName: 'বুখারী',
    compiler: 'ইমাম মুহাম্মাদ ইবনু ইসমাঈল আল-বুখারী (রহ.)',
    order: 1,
  },
  {
    slug: 'muslim',
    name: 'সহিহ মুসলিম',
    shortName: 'মুসলিম',
    compiler: 'ইমাম মুসলিম ইবনুল হাজ্জাজ (রহ.)',
    order: 2,
  },
  {
    slug: 'abudawud',
    name: 'সুনানে আবু দাউদ',
    shortName: 'আবু দাউদ',
    compiler: 'ইমাম আবু দাউদ সুলাইমান ইবনুল আশআস (রহ.)',
    order: 3,
  },
  {
    slug: 'tirmidhi',
    name: 'জামে তিরমিযী',
    shortName: 'তিরমিযী',
    compiler: 'ইমাম আবু ঈসা আত-তিরমিযী (রহ.)',
    order: 4,
  },
  {
    slug: 'nasai',
    name: 'সুনানে নাসাঈ',
    shortName: 'নাসাঈ',
    compiler: 'ইমাম আহমাদ ইবনু শুআইব আন-নাসাঈ (রহ.)',
    order: 5,
  },
  {
    slug: 'ibnmajah',
    name: 'সুনানে ইবনে মাজাহ',
    shortName: 'ইবনে মাজাহ',
    compiler: 'ইমাম মুহাম্মাদ ইবনু ইয়াযীদ ইবনু মাজাহ (রহ.)',
    order: 6,
  },
  {
    slug: 'malik',
    name: 'মুয়াত্তা মালিক',
    shortName: 'মুয়াত্তা',
    compiler: 'ইমাম মালিক ইবনু আনাস (রহ.)',
    order: 7,
  },
  {
    slug: 'nawawi',
    name: 'আরবাঈন নববী',
    shortName: 'নববী',
    compiler: 'ইমাম ইয়াহইয়া ইবনু শারাফ আন-নববী (রহ.)',
    order: 8,
  },
] as const

export type HadithBookSlug = (typeof HADITH_BOOKS)[number]['slug']
