export const SITE = {
  name: 'Ruhama',
  tagline: 'দয়ায় গাঁথা হৃদয়, ঐক্যে গড়া উম্মাহ',
  description:
    'কুরআন ও সহিহ সুন্নাহর আলোকে দলীয় পরিচয়ের ঊর্ধ্বে ঈমান, ইলম ও ভ্রাতৃত্বের পথে একসাথে চলার একটি নিরপেক্ষ ও উন্মুক্ত প্ল্যাটফর্ম।',
  shortDescription:
    'কুরআন ও সহিহ সুন্নাহর আলোকে দলীয় পরিচয়ের ঊর্ধ্বে একটি নিরপেক্ষ ও উন্মুক্ত প্ল্যাটফর্ম।',
  locale: 'bn_BD',
  themeColor: '#0E4D45',
  themeColorDark: '#0C1614',
} as const

export type NavKey = 'home' | 'about' | 'ilm' | 'learn' | 'qa' | 'majlis' | 'join'

export const MAIN_NAV: { key: NavKey; label: string; href: string; match: string[] }[] = [
  { key: 'home', label: 'হোম', href: '/', match: ['/'] },
  { key: 'about', label: 'আমাদের পরিচয়', href: '/about', match: ['/about', '/adab'] },
  {
    key: 'ilm',
    label: 'ইলম কেন্দ্র',
    href: '/ilm',
    match: ['/ilm', '/ikhtilaf', '/scholars', '/videos', '/speakers', '/quran', '/hadith'],
  },
  { key: 'learn', label: 'শেখার পথ', href: '/courses', match: ['/courses'] },
  { key: 'qa', label: 'প্রশ্নোত্তর', href: '/qa', match: ['/qa'] },
  { key: 'majlis', label: 'মজলিস', href: '/events', match: ['/events', '/circles', '/forum'] },
  { key: 'join', label: 'যুক্ত হোন', href: '/join', match: ['/join', '/contact'] },
]

export function activeNavKey(pathname: string): NavKey | null {
  if (pathname === '/') return 'home'
  for (const item of MAIN_NAV) {
    if (item.key === 'home') continue
    if (item.match.some((m) => pathname === m || pathname.startsWith(`${m}/`))) return item.key
  }
  return null
}

export const FOOTER_COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'প্ল্যাটফর্ম',
    links: [
      { label: 'আমাদের পরিচয়', href: '/about' },
      { label: 'ঘোষণাপত্র', href: '/about#manifesto' },
      { label: 'শূরা', href: '/about#shura' },
      { label: 'আদব ও ইনসাফ নীতি', href: '/adab' },
    ],
  },
  {
    title: 'শিখুন',
    links: [
      { label: 'ইলম কেন্দ্র', href: '/ilm' },
      { label: 'শেখার পথ', href: '/courses' },
      { label: 'প্রশ্নোত্তর', href: '/qa' },
      { label: 'মতপার্থক্যের আদব', href: '/ikhtilaf' },
    ],
  },
  {
    title: 'অংশ নিন',
    links: [
      { label: 'মজলিস', href: '/events' },
      { label: 'যুক্ত হোন', href: '/join' },
      { label: 'আমার যাত্রা', href: '/dashboard' },
      { label: 'যোগাযোগ', href: '/contact' },
    ],
  },
]

export const LEGAL_LINKS = [
  { label: 'গোপনীয়তা নীতি', href: '/privacy' },
  { label: 'ব্যবহারের শর্তাবলি', href: '/terms' },
  { label: 'আদব নীতিমালা', href: '/adab' },
]
