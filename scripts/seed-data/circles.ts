export type SeedCircle = {
  slug: string
  name: string
  district: string
  type: 'brothers' | 'sisters' | 'family'
  area?: string
  focus: string
  frequency: 'weekly' | 'fortnightly' | 'monthly'
  scheduleLabel: string
  description: string
  venue?: string
  sinceLabel?: string
  memberUnit?: 'people' | 'families'
  offlineMembers: number
  meetups: { startsAt: string; topic: string; meta: string }[]
  team?: { name: string; role: string }[]
}

const FORMAT = [
  { title: 'কুরআন পাঠ', detail: 'এক পৃষ্ঠা অর্থসহ, পালাক্রমে সবাই পড়েন। ২০ মিনিট।' },
  { title: 'ইলমের পাঠ', detail: 'শেখার পথের কোর্স থেকে একটি পাঠ নিয়ে আলোচনা। ২৫ মিনিট।' },
  { title: 'খোঁজখবর ও দোয়া', detail: 'কে কেমন আছেন, কারো সহায়তা লাগবে কি না। ১৫ মিনিট।' },
]

const RULES = [
  'যেকোনো মাযহাব বা ধারার ভাই স্বাগত; বৈঠকে দলীয় আলোচনা বা প্রচারণা নয়।',
  'ফিকহি প্রশ্ন উঠলে সমন্বয়ক তা প্রশ্নোত্তর বিভাগে পাঠান; বৈঠকে ফতোয়া দেওয়া হয় না।',
  'সময়মতো শুরু ও শেষ; কারো ব্যক্তিগত কথা বৈঠকের বাইরে যাবে না।',
]

export const CIRCLE_FORMAT = FORMAT
export const CIRCLE_RULES = RULES

export const CIRCLES: SeedCircle[] = [
  {
    slug: 'khulna-sadar-circle',
    name: 'খুলনা সদর সার্কেল',
    district: 'khulna',
    type: 'brothers',
    area: 'খুলনা সদর',
    focus: 'কুরআন পাঠ ও আকীদাহ',
    frequency: 'weekly',
    scheduleLabel: 'শুক্রবার বাদ মাগরিব',
    description:
      'প্রতি শুক্রবার বাদ মাগরিব এক ঘণ্টা: কুরআনের অর্থসহ পাঠ, আকীদাহর একটি পাঠ এবং একে অপরের খোঁজখবর। রবিউল আউয়াল ১৪৪৮ থেকে চলছে।',
    venue: 'বায়তুন নূর মসজিদ, খুলনা',
    sinceLabel: 'রবিউল আউয়াল ১৪৪৮',
    offlineMembers: 23,
    meetups: [
      {
        startsAt: '2026-10-09T12:15:00.000Z',
        topic: 'সূরা আল-হুজুরাত, আয়াত ৯ থেকে ১০ · পাঠ: তাকদিরের প্রতি ঈমান',
        meta: 'শুক্রবার বাদ মাগরিব',
      },
      {
        startsAt: '2026-10-16T09:45:00.000Z',
        topic: 'এ সপ্তাহে তাযকিয়াহ মজলিসে একসাথে অংশগ্রহণ',
        meta: 'শুক্রবার বাদ আসর · মজলিসের ভেন্যুতে',
      },
      {
        startsAt: '2026-10-23T12:10:00.000Z',
        topic: 'সূরা আল-হুজুরাত, আয়াত ১১ থেকে ১২ · পাঠ: ঈমানের বৃদ্ধি ও হ্রাস',
        meta: 'শুক্রবার বাদ মাগরিব',
      },
      {
        startsAt: '2026-10-30T12:05:00.000Z',
        topic: 'সূরা আল-হুজুরাত, আয়াত ১৩ · পাঠ: ঈমানের সুরক্ষা',
        meta: 'শুক্রবার বাদ মাগরিব',
      },
    ],
    team: [
      { name: 'তানভীর ইসলাম', role: 'সমন্বয়ক' },
      { name: 'রাকিব হাসান', role: 'সহ-সমন্বয়ক' },
      { name: 'উস্তায আব্দুর রহমান', role: 'ইলমি তত্ত্বাবধান (অনলাইন)' },
    ],
  },
  {
    slug: 'sonadanga-sisters-circle',
    name: 'সোনাডাঙ্গা বোনদের সার্কেল',
    district: 'khulna',
    type: 'sisters',
    area: 'সোনাডাঙ্গা',
    focus: 'তাযকিয়াহ ও আখলাক',
    frequency: 'weekly',
    scheduleLabel: 'শনিবার সকাল ১০টা',
    description:
      'প্রতি শনিবার সকালে বোনদের জন্য তাযকিয়াহ ও আখলাকের পাঠ, কুরআন তিলাওয়াত অনুশীলন ও পারস্পরিক খোঁজখবর।',
    venue: 'সোনাডাঙ্গা, খুলনা',
    sinceLabel: 'রবিউস সানি ১৪৪৮',
    offlineMembers: 16,
    meetups: [
      {
        startsAt: '2026-10-10T04:00:00.000Z',
        topic: 'অন্তরের পরিশুদ্ধি: হিংসার প্রতিকার',
        meta: 'শনিবার সকাল ১০টা',
      },
    ],
    team: [{ name: 'উস্তাযা সুমাইয়া কবির', role: 'ইলমি তত্ত্বাবধান' }],
  },
  {
    slug: 'dhanmondi-youth-circle',
    name: 'ধানমন্ডি তরুণ সার্কেল',
    district: 'dhaka',
    type: 'brothers',
    area: 'ধানমন্ডি',
    focus: 'ইলম ও দাওয়াহ',
    frequency: 'weekly',
    scheduleLabel: 'বৃহস্পতিবার রাত ৮টা',
    description:
      'বিশ্ববিদ্যালয়পড়ুয়া ও তরুণ পেশাজীবীদের সাপ্তাহিক ইলম চর্চা ও দাওয়াহর প্রশিক্ষণ।',
    venue: 'ধানমন্ডি, ঢাকা',
    offlineMembers: 42,
    meetups: [
      {
        startsAt: '2026-10-08T14:00:00.000Z',
        topic: 'সামাজিক মাধ্যমে দাওয়াহর আদব',
        meta: 'বৃহস্পতিবার রাত ৮টা',
      },
    ],
    team: [{ name: 'নাঈম আহমাদ', role: 'সমন্বয়ক' }],
  },
  {
    slug: 'mirpur-family-circle',
    name: 'মিরপুর পারিবারিক সার্কেল',
    district: 'dhaka',
    type: 'family',
    area: 'মিরপুর',
    focus: 'সীরাত ও পারিবারিক আদব',
    frequency: 'monthly',
    scheduleLabel: 'প্রথম শুক্রবার বিকেল',
    description:
      'মাসে একবার পরিবারসহ একত্র হওয়া: শিশুদের জন্য সীরাতের গল্প, বড়দের জন্য পারিবারিক আদবের আলোচনা।',
    memberUnit: 'families',
    offlineMembers: 31,
    meetups: [
      {
        startsAt: '2026-11-06T09:00:00.000Z',
        topic: 'সীরাত: মদিনার ভ্রাতৃত্ব',
        meta: 'প্রথম শুক্রবার বিকেল',
      },
    ],
  },
  {
    slug: 'agrabad-circle',
    name: 'আগ্রাবাদ সার্কেল',
    district: 'chattogram',
    type: 'brothers',
    area: 'আগ্রাবাদ',
    focus: 'ফিকহুল ইবাদাত',
    frequency: 'fortnightly',
    scheduleLabel: 'শুক্রবার বাদ আসর',
    description: 'প্রতি দুই সপ্তাহে ইবাদতের ফিকহ, ভিন্নমতের পরিচয়সহ।',
    offlineMembers: 18,
    meetups: [
      {
        startsAt: '2026-10-16T09:45:00.000Z',
        topic: 'সফরের সালাত: কসর ও জমা',
        meta: 'শুক্রবার বাদ আসর',
      },
    ],
  },
  {
    slug: 'bagerhat-sadar-family-circle',
    name: 'বাগেরহাট সদর পারিবারিক সার্কেল',
    district: 'bagerhat',
    type: 'family',
    area: 'বাগেরহাট সদর',
    focus: 'কুরআন পাঠ',
    frequency: 'monthly',
    scheduleLabel: 'দ্বিতীয় রবিবার বাদ ইশা',
    description: 'মাসিক পারিবারিক কুরআন পাঠ ও অর্থ নিয়ে আলোচনা।',
    memberUnit: 'families',
    offlineMembers: 12,
    meetups: [
      {
        startsAt: '2026-10-11T14:00:00.000Z',
        topic: 'সূরা আল-ফুরকানের শেষ রুকু',
        meta: 'দ্বিতীয় রবিবার বাদ ইশা',
      },
    ],
  },
  {
    slug: 'zindabazar-sisters-circle',
    name: 'জিন্দাবাজার বোনদের সার্কেল',
    district: 'sylhet',
    type: 'sisters',
    area: 'জিন্দাবাজার',
    focus: 'তাফসির',
    frequency: 'weekly',
    scheduleLabel: 'মঙ্গলবার বিকেল ৪টা',
    description: 'সাপ্তাহিক তাফসির পাঠ: সূরা আন-নূর থেকে পারিবারিক ও সামাজিক বিধান।',
    offlineMembers: 14,
    meetups: [
      {
        startsAt: '2026-10-06T10:00:00.000Z',
        topic: 'সূরা আন-নূর: পর্দা ও সম্মানের শিক্ষা',
        meta: 'মঙ্গলবার বিকেল ৪টা',
      },
    ],
  },
  {
    slug: 'shaheb-bazar-circle',
    name: 'সাহেববাজার সার্কেল',
    district: 'rajshahi',
    type: 'brothers',
    area: 'সাহেববাজার',
    focus: 'সীরাত',
    frequency: 'weekly',
    scheduleLabel: 'শুক্রবার বাদ জুমা',
    description: 'জুমার পর সীরাতের ধারাবাহিক পাঠ ও আলোচনা।',
    offlineMembers: 20,
    meetups: [
      {
        startsAt: '2026-10-09T07:30:00.000Z',
        topic: 'সীরাত: হুদাইবিয়ার সন্ধি',
        meta: 'শুক্রবার বাদ জুমা',
      },
    ],
  },
]
