/**
 * Video library seed. YouTube ids here are demo placeholders (RH…) so the facade and
 * pages render; replace them with real YouTube links from the admin panel.
 */

export type SeedPlaylist = {
  slug: string
  title: string
  speakerLabel: string
  level?: 'beginner' | 'intermediate' | 'advanced'
  tint: 'teal' | 'deep' | 'umber' | 'slate'
  order: number
  description: string
}

export type SeedVideo = {
  slug: string
  title: string
  shortTitle: string
  speaker: string
  category: string
  durationSeconds: number
  viewCount: number
  tint: 'teal' | 'deep' | 'umber' | 'slate'
  level?: 'beginner' | 'intermediate' | 'advanced'
  playlist?: string
  episode?: number
  publishedAt: string
  description?: string
  chapters?: { start: number; title: string }[]
  references?: { type: string; citation: string; note?: string }[]
}

const dur = (mmss: string) => {
  const parts = mmss.split(':').map(Number)
  return parts.length === 3
    ? parts[0]! * 3600 + parts[1]! * 60 + parts[2]!
    : parts[0]! * 60 + parts[1]!
}

export const PLAYLISTS: SeedPlaylist[] = [
  {
    slug: 'six-pillars-of-iman',
    title: 'ঈমানের ছয় স্তম্ভ',
    speakerLabel: 'উস্তায আব্দুর রহমান',
    level: 'beginner',
    tint: 'teal',
    order: 1,
    description: 'ঈমানের ছয়টি স্তম্ভের ধারাবাহিক লেকচার।',
  },
  {
    slug: 'etiquette-of-disagreement',
    title: 'মতপার্থক্যের আদব',
    speakerLabel: 'একাধিক বক্তা',
    level: 'intermediate',
    tint: 'umber',
    order: 2,
    description: 'ইখতিলাফ ও ইনসাফ নিয়ে বিভিন্ন আলিমের আলোচনা।',
  },
  {
    slug: 'seerah-series',
    title: 'সীরাত ধারাবাহিক',
    speakerLabel: 'মাওলানা জুবায়ের আহমাদ',
    tint: 'deep',
    order: 3,
    description: 'রাসূলুল্লাহ ﷺ-এর জীবনের ধারাবাহিক আলোচনা।',
  },
  {
    slug: 'purifying-the-heart',
    title: 'অন্তরের পরিশুদ্ধি',
    speakerLabel: 'উস্তাযা সুমাইয়া কবির',
    tint: 'slate',
    order: 4,
    description: 'তাযকিয়াহর ধারাবাহিক পাঠ।',
  },
  {
    slug: 'tafsir-al-hujurat',
    title: 'সূরা আল-হুজুরাতের তাফসির',
    speakerLabel: 'শায়খ ইউসুফ নূর',
    tint: 'teal',
    order: 5,
    description: 'ভ্রাতৃত্ব ও সামাজিক আদবের সূরা আল-হুজুরাতের ধারাবাহিক তাফসির।',
  },
]

const IMAN_EPISODES: [string, string][] = [
  ['ঈমান কী ও কেন', '18:20'],
  ['আল্লাহর প্রতি ঈমান (১)', '34:10'],
  ['আল্লাহর প্রতি ঈমান (২)', '31:45'],
  ['ফেরেশতাদের প্রতি ঈমান', '27:30'],
  ['আসমানি কিতাবসমূহ', '29:15'],
  ['রাসূলগণের প্রতি ঈমান', '33:05'],
  ['আখিরাতের প্রতি ঈমান', '41:20'],
  ['তাকদিরের প্রতি ঈমান: চেষ্টা ও ভরসার ভারসাম্য', '46:10'],
  ['ঈমানের বৃদ্ধি ও হ্রাস', '26:40'],
  ['ঈমানের সুরক্ষা', '30:25'],
  ['ঈমান ও আমলের সম্পর্ক', '28:50'],
  ['পুনরালোচনা', '22:10'],
]

const IMAN_SLUGS = [
  'what-is-iman',
  'iman-in-allah-part-1',
  'iman-in-allah-part-2',
  'iman-in-angels',
  'revealed-books',
  'iman-in-messengers',
  'iman-in-the-hereafter',
  'iman-in-qadar-effort-and-trust',
  'increase-and-decrease-of-iman',
  'protecting-iman',
  'iman-and-amal',
  'iman-series-review',
]

export const VIDEOS: SeedVideo[] = [
  ...IMAN_EPISODES.map(([title, d], i) => ({
    slug: IMAN_SLUGS[i]!,
    title,
    shortTitle: i === 7 ? 'তাকদিরের প্রতি ঈমান' : title,
    speaker: 'abdur-rahman',
    category: 'aqidah',
    durationSeconds: dur(d),
    viewCount: [8200, 6100, 5400, 4300, 3900, 4100, 7300, 11000, 3600, 3100, 2800, 2200][i]!,
    tint: 'teal' as const,
    level: 'beginner' as const,
    playlist: 'six-pillars-of-iman',
    episode: i + 1,
    publishedAt: new Date(Date.UTC(2026, 7, 2 + i * 5, 12)).toISOString(),
    ...(i === 7
      ? {
          description:
            'তাকদিরে বিশ্বাস কি মানুষকে নিষ্ক্রিয় করে দেয়? এই পর্বে জিবরীল (আ.)-এর হাদিস থেকে তাকদিরের সংজ্ঞা, আলিমদের ব্যাখ্যায় এর চারটি স্তর এবং চেষ্টা ও তাওয়াক্কুলের ভারসাম্য নিয়ে আলোচনা করা হয়েছে। শেষে প্রচলিত কিছু ভুল ধারণার উত্তর।',
          chapters: [
            { start: 0, title: 'ভূমিকা' },
            { start: 195, title: 'তাকদির শব্দের অর্থ' },
            { start: 580, title: 'জিবরীল (আ.)-এর হাদিস' },
            { start: 1040, title: 'তাকদিরের চারটি স্তর' },
            { start: 1685, title: 'চেষ্টা ও তাওয়াক্কুলের ভারসাম্য' },
            { start: 2330, title: 'প্রচলিত ভুল ধারণা ও উত্তর' },
            { start: 2610, title: 'সারসংক্ষেপ ও দোয়া' },
          ],
          references: [
            {
              type: 'hadith',
              citation: 'সহিহ মুসলিম : ৮',
              note: 'জিবরীল (আ.)-এর হাদিস, ঈমানের ছয় স্তম্ভ',
            },
            {
              type: 'quran',
              citation: 'সূরা আল-কামার : ৪৯',
              note: 'প্রতিটি জিনিস নির্ধারিত পরিমাপে',
            },
            { type: 'quran', citation: 'সূরা আল-হাদীদ : ২২', note: 'সবকিছু কিতাবে লিপিবদ্ধ' },
            {
              type: 'hadith',
              citation: 'সহিহ মুসলিম : ২৬৬৪',
              note: 'উপকারী বিষয়ে আগ্রহী হও, অক্ষম হয়ো না',
            },
          ],
          publishedAt: '2026-09-27T12:00:00.000Z',
        }
      : {}),
  })),
  {
    slug: 'ikhtilaf-with-insaf',
    title: 'ইখতিলাফ: ইনসাফের সাথে ভিন্নমত',
    shortTitle: 'ইখতিলাফ ও ইনসাফ',
    speaker: 'mahmudul-hasan',
    category: 'adab',
    durationSeconds: dur('52:40'),
    viewCount: 14000,
    tint: 'umber',
    level: 'intermediate',
    playlist: 'etiquette-of-disagreement',
    episode: 1,
    publishedAt: '2026-09-20T12:00:00.000Z',
    description: 'আলিমদের মতপার্থক্যের কারণ, সীমা এবং ভিন্নমত উপস্থাপনে ইনসাফের দাবি।',
  },
  {
    slug: 'recognising-riya',
    title: 'রিয়া: নীরব শিরক চেনার উপায়',
    shortTitle: 'রিয়া চেনার উপায়',
    speaker: 'sumaiya-kabir',
    category: 'tazkiyah',
    durationSeconds: dur('22:35'),
    viewCount: 9000,
    tint: 'slate',
    playlist: 'purifying-the-heart',
    episode: 1,
    publishedAt: '2026-09-15T12:00:00.000Z',
    description: 'লোক দেখানো আমলের লক্ষণ ও প্রতিকার।',
  },
  {
    slug: 'surah-al-hujurat-verses-10-12',
    title: 'সূরা আল-হুজুরাত: আয়াত ১০ থেকে ১২',
    shortTitle: 'সূরা আল-হুজুরাত',
    speaker: 'yusuf-nur',
    category: 'tafsir',
    durationSeconds: dur('38:20'),
    viewCount: 17000,
    tint: 'deep',
    playlist: 'tafsir-al-hujurat',
    episode: 3,
    publishedAt: '2026-09-10T12:00:00.000Z',
    description: 'ভ্রাতৃত্ব, উপহাস, কুধারণা ও গিবত থেকে বেঁচে থাকার নির্দেশনা।',
  },
  {
    slug: 'keeping-iman-on-campus',
    title: 'ক্যাম্পাসে ঈমান ধরে রাখা',
    shortTitle: 'ক্যাম্পাসে ঈমান',
    speaker: 'naim-ahmad',
    category: 'dawah',
    durationSeconds: dur('31:20'),
    viewCount: 21000,
    tint: 'umber',
    publishedAt: '2026-09-05T12:00:00.000Z',
    description: 'বিশ্ববিদ্যালয় জীবনে ঈমান ও আমল ধরে রাখার বাস্তব পরামর্শ।',
  },
  {
    slug: 'treaty-of-hudaybiyyah',
    title: 'হুদাইবিয়ার সন্ধি: ধৈর্যের বিজয়',
    shortTitle: 'হুদাইবিয়ার সন্ধি',
    speaker: 'zubayer-ahmad',
    category: 'seerah',
    durationSeconds: dur('58:05'),
    viewCount: 12000,
    tint: 'teal',
    playlist: 'seerah-series',
    episode: 14,
    publishedAt: '2026-08-28T12:00:00.000Z',
    description: 'আপাত পরাজয়ের ভেতরে লুকানো বিজয়: হুদাইবিয়ার শিক্ষা।',
  },
  {
    slug: 'sunnah-of-salam-in-two-minutes',
    title: 'দুই মিনিটে: সালাম দেওয়ার সুন্নাহ',
    shortTitle: 'সালামের সুন্নাহ',
    speaker: 'sumaiya-kabir',
    category: 'adab',
    durationSeconds: dur('2:18'),
    viewCount: 34000,
    tint: 'slate',
    publishedAt: '2026-08-20T12:00:00.000Z',
    description: 'সালামের আদব ও ফজিলত সংক্ষেপে।',
  },
  {
    slug: 'grades-of-hadith-explained',
    title: 'হাদিসের মান: সহিহ, হাসান ও যঈফ',
    shortTitle: 'হাদিসের মান',
    speaker: 'mahmudul-hasan',
    category: 'aqidah',
    durationSeconds: dur('8:45'),
    viewCount: 19000,
    tint: 'deep',
    publishedAt: '2026-08-14T12:00:00.000Z',
    description: 'হাদিসের মান নির্ণয়ের মৌলিক ধারণা।',
  },
  {
    slug: 'prophetic-way-to-control-anger',
    title: 'রাগ নিয়ন্ত্রণের নববি পদ্ধতি',
    shortTitle: 'রাগ নিয়ন্ত্রণ',
    speaker: 'abdur-rahman',
    category: 'tazkiyah',
    durationSeconds: dur('15:30'),
    viewCount: 26000,
    tint: 'teal',
    publishedAt: '2026-08-08T12:00:00.000Z',
    description: 'রাগ সংবরণের হাদিসভিত্তিক উপায়।',
  },
  {
    slug: 'method-of-verifying-hadith',
    title: 'হাদিস যাচাইয়ের পদ্ধতি',
    shortTitle: 'হাদিস যাচাইয়ের পদ্ধতি',
    speaker: 'mahmudul-hasan',
    category: 'aqidah',
    durationSeconds: dur('38:12'),
    viewCount: 9000,
    tint: 'teal',
    publishedAt: '2026-07-30T12:00:00.000Z',
  },
  {
    slug: 'principles-of-aqidah-part-1',
    title: 'আকীদাহর মূলনীতি (পর্ব ১)',
    shortTitle: 'আকীদাহর মূলনীতি (পর্ব ১)',
    speaker: 'mahmudul-hasan',
    category: 'aqidah',
    durationSeconds: dur('44:05'),
    viewCount: 7000,
    tint: 'deep',
    publishedAt: '2026-07-22T12:00:00.000Z',
  },
  {
    slug: 'friendship-across-differences',
    title: 'ভিন্নমতের বন্ধুর সাথে সম্পর্ক',
    shortTitle: 'ভিন্নমতের বন্ধুর সাথে সম্পর্ক',
    speaker: 'naim-ahmad',
    category: 'dawah',
    durationSeconds: dur('24:08'),
    viewCount: 12000,
    tint: 'teal',
    playlist: 'etiquette-of-disagreement',
    episode: 2,
    publishedAt: '2026-07-18T12:00:00.000Z',
    description: 'মতের পার্থক্য সত্ত্বেও ভাই হিসেবে আপন করে নেওয়ার বাস্তব পরামর্শ।',
  },
  {
    slug: 'time-management-and-regular-deeds',
    title: 'সময় ব্যবস্থাপনা ও নিয়মিত আমল',
    shortTitle: 'সময় ব্যবস্থাপনা ও নিয়মিত আমল',
    speaker: 'naim-ahmad',
    category: 'dawah',
    durationSeconds: dur('28:45'),
    viewCount: 8000,
    tint: 'slate',
    publishedAt: '2026-07-10T12:00:00.000Z',
  },
]
