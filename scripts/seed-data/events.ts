import { doc, p } from './lexical'

export type SeedEvent = {
  slug: string
  title: string
  summary: string
  startsAt: string
  endsAt?: string
  timeLabel?: string
  mode: 'online' | 'in_person'
  district?: string
  venueName?: string
  venueAddress?: string
  category?: string
  audience: string
  separateSeating?: boolean
  capacity: number
  reservedSeats: number
  description: ReturnType<typeof doc>
  agenda: { time: string; item: string }[]
  speakers: string[]
  speakerNotes?: string[]
  circle?: string
  onlineUrl?: string
}

// All times are Bangladesh time (UTC+6)
export const EVENTS: SeedEvent[] = [
  {
    slug: 'etiquette-of-disagreement-from-the-companions',
    title: 'মতপার্থক্যের আদব: সাহাবিদের জীবন থেকে',
    summary:
      'ভিন্নমত সত্ত্বেও সাহাবিরা কীভাবে পরস্পরের ভাই হয়ে ছিলেন: ঘটনা, দলিল ও আজকের জন্য শিক্ষা।',
    startsAt: '2026-10-10T15:00:00.000Z',
    endsAt: '2026-10-10T16:15:00.000Z',
    timeLabel: 'রাত ৯:০০ থেকে ১০:১৫',
    mode: 'online',
    category: 'akhlaq',
    audience: 'সবার জন্য উন্মুক্ত\nলাইভ সেশনের লিংক রেজিস্ট্রেশনের পর ইমেইলে',
    capacity: 500,
    reservedSeats: 311,
    description: doc(
      p(
        'সাহাবায়ে কেরামের মধ্যে বহু বিষয়ে মতপার্থক্য ছিল, কিন্তু তাঁদের হৃদয় ছিল এক। এই অনলাইন মজলিসে আমরা কয়েকটি ঘটনা থেকে দেখব, কীভাবে তাঁরা দ্বিমতের মাঝেও সম্মান ও ভালোবাসা বজায় রেখেছিলেন।',
      ),
      p('আলোচনা শেষে প্রশ্নোত্তর পর্ব থাকবে। সেশনের রেকর্ড পরে ভিডিও লাইব্রেরিতে পাওয়া যাবে।'),
    ),
    agenda: [
      { time: '১০ মিনিট', item: 'তিলাওয়াত ও সূচনা' },
      { time: '৪০ মিনিট', item: 'মূল আলোচনা: সাহাবিদের তিনটি ঘটনা' },
      { time: '২৫ মিনিট', item: 'প্রশ্নোত্তর' },
    ],
    speakers: ['mahmudul-hasan'],
    onlineUrl: 'https://meet.example.org/ruhama-majlis-1010',
  },
  {
    slug: 'tazkiyah-majlis-diseases-of-the-heart',
    title: 'তাযকিয়াহ মজলিস: অন্তরের রোগ ও তার প্রতিকার',
    summary:
      'অহংকার, হিংসা ও রিয়া: যে রোগগুলো চোখে পড়ে না, অথচ আমল ও সম্পর্ক দুটোই নষ্ট করে। কুরআন ও সুন্নাহর আলোকে চেনা ও সারানোর এক বিকেল।',
    startsAt: '2026-10-16T09:45:00.000Z',
    endsAt: '2026-10-16T11:45:00.000Z',
    timeLabel: 'বাদ আসর থেকে মাগরিব পর্যন্ত',
    mode: 'in_person',
    district: 'khulna',
    venueName: 'সোনাডাঙ্গা কমিউনিটি মিলনায়তন',
    venueAddress: 'সোনাডাঙ্গা আবাসিক এলাকা, খুলনা',
    category: 'tazkiyah',
    audience: 'সবার জন্য উন্মুক্ত\nবোনদের জন্য আলাদা বসার ব্যবস্থা',
    separateSeating: true,
    capacity: 120,
    reservedSeats: 86,
    description: doc(
      p(
        'রাসূলুল্লাহ ﷺ বলেছেন, দেহের ভেতর একটি মাংসপিণ্ড আছে; তা সুস্থ থাকলে পুরো দেহ সুস্থ থাকে। এই মজলিসে আমরা অন্তরের সেই সুস্থতা নিয়ে কথা বলব: কোন রোগগুলো আমাদের অজান্তে বাসা বাঁধে, আর সাহাবায়ে কেরাম কীভাবে নিজেদের পরিশুদ্ধ রাখতেন।',
      ),
      p('আলোচনা শেষে থাকবে প্রশ্নোত্তর পর্ব। কোনো দলীয় পরিচয় বা সংগঠনের সদস্যপদের প্রয়োজন নেই।'),
    ),
    agenda: [
      { time: 'আসরের পর', item: 'জামাতে আসর সালাত ও আসন গ্রহণ' },
      { time: '১০ মিনিট', item: 'তিলাওয়াত ও সূচনা কথা' },
      { time: '৪৫ মিনিট', item: 'মূল আলোচনা: অন্তরের তিনটি নীরব রোগ' },
      { time: '২০ মিনিট', item: 'প্রশ্নোত্তর' },
      { time: 'মাগরিব', item: 'দোয়া ও জামাতে মাগরিব সালাত' },
    ],
    speakers: ['abdur-rahman', 'sumaiya-kabir'],
    speakerNotes: ['আকীদাহ ও ফিকহ বিভাগ', 'বোনদের অংশে আলোচনা'],
  },
  {
    slug: 'youth-ilm-circle-principles-of-aqidah',
    title: 'তরুণদের ইলম সার্কেল: আকীদাহর মূলনীতি',
    summary:
      'বিশ্ববিদ্যালয়পড়ুয়া তরুণদের জন্য আকীদাহর মৌলিক প্রশ্ন ও সংশয় নিয়ে খোলামেলা আলোচনা।',
    startsAt: '2026-10-24T04:00:00.000Z',
    endsAt: '2026-10-24T06:30:00.000Z',
    timeLabel: 'সকাল ১০:০০ থেকে দুপুর ১২:৩০',
    mode: 'in_person',
    district: 'dhaka',
    venueName: 'ধানমন্ডি ইসলামিক সেন্টার মিলনায়তন',
    venueAddress: 'ধানমন্ডি, ঢাকা',
    category: 'aqidah',
    audience: 'তরুণ ও বিশ্ববিদ্যালয় শিক্ষার্থী\nআসন সীমিত',
    capacity: 60,
    reservedSeats: 52,
    description: doc(
      p(
        'তরুণদের মনে ঈমান নিয়ে নানা প্রশ্ন জাগে। এই সার্কেলে আকীদাহর মূলনীতিগুলো সহজ ভাষায় আলোচনা হবে, প্রশ্ন করার পূর্ণ সুযোগ থাকবে।',
      ),
    ),
    agenda: [
      { time: '১০:০০', item: 'পরিচিতি ও সূচনা' },
      { time: '১০:২০', item: 'আকীদাহর তিনটি মূলনীতি' },
      { time: '১১:৩০', item: 'খোলা প্রশ্নোত্তর' },
    ],
    speakers: ['naim-ahmad', 'abdur-rahman'],
  },
  {
    slug: 'akhlaq-in-family-life',
    title: 'পারিবারিক জীবনে আখলাক',
    summary: 'স্বামী-স্ত্রী, বাবা-মা ও সন্তানের সম্পর্কে নববি আখলাক: ব্যবহারিক আলোচনা।',
    startsAt: '2026-10-30T14:30:00.000Z',
    endsAt: '2026-10-30T15:45:00.000Z',
    timeLabel: 'রাত ৮:৩০ থেকে ৯:৪৫',
    mode: 'online',
    category: 'akhlaq',
    audience: 'সবার জন্য উন্মুক্ত',
    capacity: 500,
    reservedSeats: 140,
    description: doc(
      p(
        'পরিবারই আখলাক চর্চার প্রথম ক্ষেত্র। রাসূলুল্লাহ ﷺ বলেছেন, তোমাদের মধ্যে সর্বোত্তম সে, যে তার পরিবারের কাছে সর্বোত্তম। এই মজলিসে সেই শিক্ষার ব্যবহারিক দিকগুলো আলোচনা হবে।',
      ),
    ),
    agenda: [
      { time: '১০ মিনিট', item: 'সূচনা' },
      { time: '৪৫ মিনিট', item: 'মূল আলোচনা' },
      { time: '২০ মিনিট', item: 'প্রশ্নোত্তর' },
    ],
    speakers: ['sumaiya-kabir'],
    onlineUrl: 'https://meet.example.org/ruhama-majlis-1030',
  },
  {
    slug: 'halal-earning-workshop-for-young-entrepreneurs',
    title: 'হালাল উপার্জন: তরুণ উদ্যোক্তাদের কর্মশালা',
    summary:
      'ব্যবসা শুরুর আগে লেনদেনের মূলনীতি, সুদমুক্ত মূলধন ও চুক্তির আদব নিয়ে ব্যবহারিক কর্মশালা।',
    startsAt: '2026-11-06T09:00:00.000Z',
    endsAt: '2026-11-06T11:20:00.000Z',
    timeLabel: 'বিকেল ৩:০০ থেকে মাগরিব',
    mode: 'in_person',
    district: 'chattogram',
    venueName: 'আগ্রাবাদ কমিউনিটি সেন্টার',
    venueAddress: 'আগ্রাবাদ, চট্টগ্রাম',
    category: 'muamalat',
    audience: 'তরুণ উদ্যোক্তা ও শিক্ষার্থী',
    capacity: 80,
    reservedSeats: 23,
    description: doc(
      p(
        'যাঁরা ব্যবসা শুরু করতে চান বা সদ্য শুরু করেছেন, তাঁদের জন্য হালাল উপার্জনের মূলনীতি ও বাস্তব সমস্যার সমাধান নিয়ে কর্মশালা।',
      ),
    ),
    agenda: [
      { time: '৩:০০', item: 'লেনদেনের মূলনীতি' },
      { time: '৪:০০', item: 'সুদমুক্ত মূলধনের পথ' },
      { time: '৪:৪০', item: 'কেস স্টাডি ও প্রশ্নোত্তর' },
    ],
    speakers: ['imran-khalil'],
  },
  {
    slug: 'training-for-volunteer-translators',
    title: 'স্বেচ্ছাসেবী অনুবাদকদের প্রশিক্ষণ',
    summary: 'আরবি ও ইংরেজি থেকে বাংলায় ইসলামি লেখা অনুবাদের নীতি, পরিভাষা ও রিভিউ প্রক্রিয়া।',
    startsAt: '2026-11-14T13:00:00.000Z',
    endsAt: '2026-11-14T14:30:00.000Z',
    timeLabel: 'সন্ধ্যা ৭:০০ থেকে ৮:৩০',
    mode: 'online',
    category: 'akhlaq',
    audience: 'অনুবাদ টিমে যুক্ত হতে আগ্রহীরা',
    capacity: 100,
    reservedSeats: 34,
    description: doc(
      p(
        'অনুবাদে শব্দচয়ন, পরিভাষার সামঞ্জস্য এবং দলিলের সঠিক উদ্ধৃতি নিয়ে প্রশিক্ষণ। অংশগ্রহণকারীরা একটি ছোট অনুশীলনী জমা দেবেন।',
      ),
    ),
    agenda: [
      { time: '২০ মিনিট', item: 'অনুবাদের নীতিমালা' },
      { time: '৪০ মিনিট', item: 'পরিভাষা ও অনুশীলন' },
      { time: '৩০ মিনিট', item: 'রিভিউ প্রক্রিয়া ও প্রশ্নোত্তর' },
    ],
    speakers: ['naim-ahmad', 'fatima-rahman'],
    onlineUrl: 'https://meet.example.org/ruhama-translators',
  },
]
