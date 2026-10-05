/** Scholars, writers and speakers from the design boards. */

export type SeedPerson = {
  slug: string
  name: string
  avatarTone: 'teal' | 'gold'
  kinds: ('scholar' | 'author' | 'reviewer' | 'speaker')[]
  title: string
  specialty?: string
  shuraRole?: string
  shuraOrder?: number
  verified: boolean
  bio: string
  joinedLabel: string
  location: string
  education: { degree: string; institution?: string }[]
  expertise: string[]
  roleNotes?: { role: 'author' | 'reviewer' | 'speaker'; note: string }[]
  disclaimer?: string
  account?: { email: string; roles: string[] }
}

export const PEOPLE: SeedPerson[] = [
  {
    slug: 'mahmudul-hasan',
    name: 'ড. মাহমুদুল হাসান',
    avatarTone: 'teal',
    kinds: ['scholar', 'author', 'reviewer', 'speaker'],
    title: 'ইলমি রিভিউ প্রধান',
    specialty: 'হাদিস ও উলুমুল হাদিস',
    shuraRole: 'ইলমি রিভিউ প্রধান',
    shuraOrder: 2,
    verified: true,
    bio: 'দুই দশক ধরে হাদিস ও উলুমুল হাদিস পড়াচ্ছেন। Ruhama-তে প্রতিটি প্রবন্ধের দলিল ও হাদিসের মান যাচাই করেন। বিশেষ আগ্রহ: ভিন্নমতের দলিলগুলো ইনসাফের সাথে উপস্থাপন।',
    joinedLabel: 'রবিউল আউয়াল ১৪৪৮',
    location: 'খুলনা',
    education: [
      { degree: 'পিএইচডি, হাদিস ও ইসলামিক স্টাডিজ', institution: 'হাদিস ও ইসলামিক স্টাডিজ অনুষদ' },
      { degree: 'তাখাসসুস ফিল হাদিস', institution: 'উচ্চতর হাদিস গবেষণা বিভাগ, ঢাকা' },
      { degree: 'দাওরায়ে হাদিস (মাস্টার্স সমমান)', institution: 'কওমি মাদরাসা, খুলনা' },
    ],
    expertise: ['হাদিস', 'উলুমুল হাদিস', 'আকীদাহ', 'উসূলুল ফিকহ', 'ইখতিলাফ'],
    roleNotes: [
      { role: 'author', note: 'আকীদাহ ও ফিকহের প্রবন্ধ' },
      { role: 'reviewer', note: 'দলিল ও হাদিসের মান যাচাই' },
      { role: 'speaker', note: 'মজলিস ও ভিডিও লেকচার' },
    ],
    account: { email: 'mahmudul@ruhama.local', roles: ['reviewer', 'shura'] },
  },
  {
    slug: 'imran-khalil',
    name: 'মুফতি ইমরান খলিল',
    avatarTone: 'teal',
    kinds: ['scholar', 'author', 'reviewer'],
    title: 'প্রশ্নোত্তর বিভাগ প্রধান',
    specialty: 'ফিকহ ও লেনদেন',
    shuraRole: 'প্রশ্নোত্তর বিভাগ',
    shuraOrder: 5,
    verified: true,
    bio: 'ফিকহ ও আধুনিক লেনদেন বিষয়ে দীর্ঘদিন ধরে ফতোয়া বিভাগে কাজ করছেন। প্রশ্নোত্তর বিভাগের উত্তরগুলো সমন্বয় করেন এবং প্রতিটি মাসআলায় ভিন্ন মাযহাবের মত ইনসাফের সাথে তুলে ধরেন।',
    joinedLabel: 'রবিউল আউয়াল ১৪৪৮',
    location: 'ঢাকা',
    education: [
      { degree: 'ইফতা (ফতোয়া প্রশিক্ষণ)', institution: 'ফতোয়া ও ইসলামি আইন বিভাগ, ঢাকা' },
      { degree: 'দাওরায়ে হাদিস', institution: 'কওমি মাদরাসা, চট্টগ্রাম' },
    ],
    expertise: ['ফিকহ', 'লেনদেন', 'পরিবার'],
    roleNotes: [
      { role: 'author', note: 'প্রশ্নোত্তর ও ফিকহি প্রবন্ধ' },
      { role: 'reviewer', note: 'ফিকহি মাসআলার রিভিউ' },
    ],
    account: { email: 'imran@ruhama.local', roles: ['reviewer'] },
  },
  {
    slug: 'abdur-rahman',
    name: 'উস্তায আব্দুর রহমান',
    avatarTone: 'teal',
    kinds: ['scholar', 'author', 'speaker'],
    title: 'আকীদাহ ও ফিকহ বিভাগ',
    specialty: 'আকীদাহ ও তাযকিয়াহ',
    shuraRole: 'আকীদাহ ও ফিকহ বিভাগ',
    shuraOrder: 3,
    verified: true,
    bio: 'আকীদাহ ও তাযকিয়াহ বিষয়ে সহজ ভাষায় লেখেন ও পড়ান। “ঈমানের ছয় স্তম্ভ” কোর্স ও ধারাবাহিক লেকচারের শিক্ষক।',
    joinedLabel: 'রবিউল আউয়াল ১৪৪৮',
    location: 'খুলনা',
    education: [
      { degree: 'কামিল (হাদিস)', institution: 'আলিয়া মাদরাসা, খুলনা' },
      { degree: 'এমএ, আল-কুরআন ও ইসলামিক স্টাডিজ', institution: 'ইসলামিক স্টাডিজ বিভাগ' },
    ],
    expertise: ['আকীদাহ', 'তাযকিয়াহ'],
    roleNotes: [
      { role: 'author', note: 'আকীদাহ ও তাযকিয়াহর প্রবন্ধ' },
      { role: 'speaker', note: 'কোর্স ও মজলিস' },
    ],
    account: { email: 'abdurrahman@ruhama.local', roles: ['author'] },
  },
  {
    slug: 'sumaiya-kabir',
    name: 'উস্তাযা সুমাইয়া কবির',
    avatarTone: 'gold',
    kinds: ['scholar', 'author', 'speaker'],
    title: 'নারী শিক্ষা ও তাযকিয়াহ',
    specialty: 'আখলাক ও পারিবারিক আদব',
    shuraRole: 'নারী শিক্ষা ও তাযকিয়াহ',
    shuraOrder: 4,
    verified: true,
    bio: 'নারী শিক্ষা ও তাযকিয়াহ বিভাগ। আখলাক ও পারিবারিক আদব বিষয়ে লেখেন।',
    joinedLabel: 'রবিউল আউয়াল ১৪৪৮',
    location: 'খুলনা',
    education: [
      { degree: 'দাওরায়ে হাদিস (মহিলা শাখা)', institution: 'মহিলা মাদরাসা, খুলনা' },
      { degree: 'বিএ (অনার্স), ইসলামিক স্টাডিজ', institution: 'ইসলামিক স্টাডিজ বিভাগ' },
    ],
    expertise: ['আখলাক', 'পরিবার', 'তাযকিয়াহ'],
    roleNotes: [
      { role: 'author', note: 'আখলাক ও পারিবারিক আদব' },
      { role: 'speaker', note: 'বোনদের মজলিস' },
    ],
    account: { email: 'sumaiya@ruhama.local', roles: ['author'] },
  },
  {
    slug: 'abdul-hakim',
    name: 'মাওলানা আব্দুল হাকিম',
    avatarTone: 'gold',
    kinds: ['scholar', 'author', 'speaker'],
    title: 'শূরা সমন্বয়ক',
    specialty: 'ইবাদত, সীরাত ও দাওয়াহ',
    shuraRole: 'শূরা সমন্বয়ক',
    shuraOrder: 1,
    verified: true,
    bio: 'তিন দশক ধরে মসজিদভিত্তিক দাওয়াহ ও শিক্ষায় যুক্ত। শূরার সভাগুলো সমন্বয় করেন এবং বিভিন্ন ধারার আলিমদের মধ্যে সেতুবন্ধনের কাজ করেন।',
    joinedLabel: 'রবিউল আউয়াল ১৪৪৮',
    location: 'খুলনা',
    education: [{ degree: 'দাওরায়ে হাদিস', institution: 'কওমি মাদরাসা, ঢাকা' }],
    expertise: ['ইবাদত', 'সীরাত', 'দাওয়াহ'],
    account: { email: 'hakim@ruhama.local', roles: ['shura'] },
  },
  {
    slug: 'yusuf-nur',
    name: 'শায়খ ইউসুফ নূর',
    avatarTone: 'teal',
    kinds: ['scholar', 'speaker'],
    title: 'তাফসির বিভাগ',
    specialty: 'তাফসির ও কুরআনিক আরবি',
    verified: true,
    bio: 'কুরআনের তাফসির ও কুরআনিক আরবি পড়ান। সূরা আল-হুজুরাতের ধারাবাহিক তাফসির তাঁর জনপ্রিয় লেকচার সিরিজ।',
    joinedLabel: 'জুমাদাল উলা ১৪৪৮',
    location: 'চট্টগ্রাম',
    education: [{ degree: 'তাখাসসুস ফিত তাফসির', institution: 'তাফসির গবেষণা বিভাগ, চট্টগ্রাম' }],
    expertise: ['তাফসির', 'কুরআনিক আরবি'],
  },
  {
    slug: 'rashida-parvin',
    name: 'ড. রাশিদা পারভীন',
    avatarTone: 'gold',
    kinds: ['scholar', 'author'],
    title: 'হাদিস ও নারী শিক্ষা',
    specialty: 'হাদিস ও পরিবার',
    verified: true,
    bio: 'হাদিস বিষয়ে গবেষণা ও শিক্ষকতা করেন। নারী ও পরিবার সংক্রান্ত হাদিসগুলোর প্রেক্ষাপটসহ ব্যাখ্যা তাঁর লেখার মূল বিষয়।',
    joinedLabel: 'জুমাদাল উলা ১৪৪৮',
    location: 'রাজশাহী',
    education: [{ degree: 'পিএইচডি, হাদিস', institution: 'আল-হাদিস বিভাগ' }],
    expertise: ['হাদিস', 'পরিবার'],
  },
  {
    slug: 'zubayer-ahmad',
    name: 'মাওলানা জুবায়ের আহমাদ',
    avatarTone: 'teal',
    kinds: ['scholar', 'speaker'],
    title: 'সীরাত ও ইতিহাস',
    specialty: 'সীরাত ও ইসলামের ইতিহাস',
    verified: true,
    bio: 'সীরাত ও ইসলামের ইতিহাস নিয়ে ধারাবাহিক লেকচার দেন। সাহাবিদের জীবন থেকে বর্তমানের শিক্ষা খুঁজে আনাই তাঁর আলোচনার বৈশিষ্ট্য।',
    joinedLabel: 'রবিউল আউয়াল ১৪৪৮',
    location: 'ঢাকা',
    education: [
      {
        degree: 'দাওরায়ে হাদিস ও ইসলামের ইতিহাসে স্নাতকোত্তর',
        institution: 'ইসলামের ইতিহাস বিভাগ',
      },
    ],
    expertise: ['সীরাত', 'ইসলামের ইতিহাস'],
  },
  {
    slug: 'naim-ahmad',
    name: 'নাঈম আহমাদ',
    avatarTone: 'gold',
    kinds: ['author', 'speaker'],
    title: 'দাওয়াহ ও মজলিস বিভাগ',
    specialty: 'তরুণদের নিয়ে কাজ করেন',
    shuraRole: 'দাওয়াহ ও মজলিস',
    shuraOrder: 6,
    verified: false,
    bio: 'পেশায় সফটওয়্যার প্রকৌশলী। এক দশক ধরে বিশ্ববিদ্যালয়পড়ুয়া তরুণদের নিয়ে স্টাডি সার্কেল চালান। সহজ ভাষায় ঈমান, আখলাক ও ভ্রাতৃত্ব নিয়ে লেখেন ও বলেন।',
    joinedLabel: 'রবিউল আউয়াল ১৪৪৮',
    location: 'ঢাকা',
    education: [
      { degree: 'বিএসসি, কম্পিউটার সায়েন্স', institution: 'প্রকৌশল বিশ্ববিদ্যালয়' },
      { degree: 'দুই বছরের আলিম কোর্স (খণ্ডকালীন)', institution: 'ইসলামি শিক্ষা কেন্দ্র, ঢাকা' },
    ],
    expertise: ['দাওয়াহ', 'আখলাক', 'তরুণ ও ঈমান', 'ভ্রাতৃত্ব'],
    disclaimer:
      'ইনি আলিম প্যানেলের সদস্য নন। তাঁর প্রতিটি লেখা ও লেকচার প্রকাশের আগে প্যানেলের একজন আলিম রিভিউ করেন।',
  },
  {
    slug: 'fatima-rahman',
    name: 'ফাতিমা রহমান',
    avatarTone: 'gold',
    kinds: ['author'],
    title: 'অনুবাদ ও প্রকাশনা',
    shuraRole: 'অনুবাদ ও প্রকাশনা',
    shuraOrder: 7,
    verified: false,
    bio: 'অনুবাদ ও সম্পাদনা টিমের সমন্বয়ক। আরবি ও ইংরেজি থেকে নির্বাচিত লেখা বাংলায় রূপান্তর করেন।',
    joinedLabel: 'রবিউল আউয়াল ১৪৪৮',
    location: 'ঢাকা',
    education: [{ degree: 'এমএ, আরবি ভাষা ও সাহিত্য', institution: 'আরবি বিভাগ' }],
    expertise: ['অনুবাদ', 'সম্পাদনা'],
  },
  {
    slug: 'tanvir-islam',
    name: 'তানভীর ইসলাম',
    avatarTone: 'teal',
    kinds: ['author'],
    title: 'প্রযুক্তি ও প্ল্যাটফর্ম',
    shuraRole: 'প্রযুক্তি ও প্ল্যাটফর্ম',
    shuraOrder: 8,
    verified: false,
    bio: 'প্ল্যাটফর্মের প্রযুক্তি টিমের সমন্বয়ক এবং খুলনা সদর সার্কেলের সমন্বয়ক।',
    joinedLabel: 'রবিউল আউয়াল ১৪৪৮',
    location: 'খুলনা',
    education: [
      {
        degree: 'বিএসসি, কম্পিউটার সায়েন্স ও ইঞ্জিনিয়ারিং',
        institution: 'প্রকৌশল বিশ্ববিদ্যালয়',
      },
    ],
    expertise: ['প্রযুক্তি'],
    account: { email: 'tanvir@ruhama.local', roles: ['editor', 'moderator'] },
  },
]
