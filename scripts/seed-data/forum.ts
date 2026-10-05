/** Forum threads and replies from the forum boards. `author` refers to a seed member key. */

export type SeedPost = {
  key: string
  author: string
  body: string
  arabic?: string
  reference?: string
  hoursAgo: number
  helpfulBy?: string[]
  markedHelpful?: boolean
  parentKey?: string
  removed?: boolean
}

export type SeedThread = {
  slug: string
  title: string
  category: string
  author: string
  anonymous?: boolean
  body: string
  hoursAgo: number
  viewCount: number
  pinned?: boolean
  modNote?: string
  posts: SeedPost[]
}

export const FORUM_MEMBERS = [
  { key: 'demo', name: 'আব্দুল্লাহ আল মামুন' },
  { key: 'fatima', name: 'ফাতিমা রহমান', email: 'fatima@ruhama.local', gold: true },
  { key: 'rakib', name: 'রাকিব হাসান', email: 'rakib@ruhama.local' },
  { key: 'tanvir', name: 'তানভীর ইসলাম' },
  { key: 'nusrat', name: 'নুসরাত জাহান', email: 'nusrat@ruhama.local', gold: true },
  { key: 'sakib', name: 'সাকিব আহমেদ', email: 'sakib@ruhama.local' },
  { key: 'sumaiya', name: 'উস্তাযা সুমাইয়া কবির' },
  { key: 'modteam', name: 'মডারেটর টিম' },
  { key: 'karim', name: 'করিম উদ্দিন', email: 'karim@ruhama.local' },
]

export const THREADS: SeedThread[] = [
  {
    slug: 'welcome-read-before-posting',
    title: 'ফোরামে স্বাগতম: পোস্ট করার আগে একবার পড়ুন',
    category: 'platform-feedback',
    author: 'modteam',
    body: 'আসসালামু আলাইকুম। এই ফোরাম প্রশ্ন, অভিজ্ঞতা ও পারস্পরিক পরামর্শের জন্য। দ্বিমত থাকতে পারে, অসম্মান নয়। পোস্ট করার আগে আদব নীতিমালা পড়ে নিন: দলিলসহ কথা বলুন, ব্যক্তি নয় বক্তব্য নিয়ে আলোচনা করুন, কোনো দল বা আলিমকে কটাক্ষ করবেন না, আর ফতোয়ার প্রশ্ন প্রশ্নোত্তর বিভাগে করুন। নতুন সদস্যদের প্রথম তিনটি পোস্ট মডারেটর দেখে প্রকাশ করেন।',
    hoursAgo: 24 * 20,
    viewCount: 4100,
    pinned: true,
    posts: [
      {
        key: 'w1',
        author: 'rakib',
        body: 'জাযাকাল্লাহু খাইরান। নীতিমালাগুলো খুবই প্রয়োজনীয়।',
        hoursAgo: 24 * 19,
      },
      {
        key: 'w2',
        author: 'nusrat',
        body: 'বোনদের জন্য আলাদা কোনো বিভাগ রাখার পরিকল্পনা আছে কি?',
        hoursAgo: 24 * 3,
      },
      {
        key: 'w3',
        author: 'modteam',
        body: 'নুসরাত আপা, পরামর্শটি শূরার কাছে পাঠানো হয়েছে, ইনশাআল্লাহ জানানো হবে।',
        hoursAgo: 24,
        parentKey: 'w2',
      },
    ],
  },
  {
    slug: 'my-experience-controlling-anger',
    title: 'রাগ নিয়ন্ত্রণে নিজের অভিজ্ঞতা: কী কাজ করেছে, কী করেনি',
    category: 'tazkiyah',
    author: 'demo',
    body: 'আসসালামু আলাইকুম। পরিবারে ছোটখাটো বিষয়ে খুব দ্রুত রেগে যাই, পরে অনুশোচনা হয়। গত দুই মাস কয়েকটি জিনিস চেষ্টা করেছি: রাগ উঠলে চুপ থাকা আর জায়গা বদলানো কিছুটা কাজ করেছে, কিন্তু অফিসের চাপ নিয়ে বাসায় ফিরলে আবার একই অবস্থা।\n\nআপনারা কেউ কি নিয়মিত কোনো অভ্যাস গড়ে তুলে উপকার পেয়েছেন? হাদিস বা সাহাবিদের জীবন থেকে কোনো দিকনির্দেশনা থাকলে জানাবেন।',
    hoursAgo: 72,
    viewCount: 920,
    modNote:
      'এই আলোচনা অভিজ্ঞতা বিনিময়ের জন্য। ব্যক্তিগত বা পারিবারিক বিশেষ পরিস্থিতিতে বিশ্বস্ত আলিম বা পেশাদার কাউন্সেলরের পরামর্শ নিন। একটি মন্তব্য আদব নীতিমালা ভঙ্গের কারণে সরানো হয়েছে।',
    posts: [
      {
        key: 'r1',
        author: 'fatima',
        body: 'এক সাহাবি নবীজি ﷺ-এর কাছে উপদেশ চাইলে তিনি বারবার একটিই কথা বলেছিলেন: রাগ কোরো না। আমি এই হাদিসটি ফোনের লক স্ক্রিনে লিখে রেখেছি। রাগ উঠলে ফোন হাতে নিলেই চোখে পড়ে, থেমে যাই।',
        arabic: 'لَا تَغْضَبْ',
        reference: 'সহিহ বুখারী : ৬১১৬',
        hoursAgo: 70,
        helpfulBy: ['demo', 'rakib', 'nusrat', 'sakib'],
        markedHelpful: true,
      },
      {
        key: 'r2',
        author: 'rakib',
        body: 'দাঁড়িয়ে থাকলে বসে পড়ি, বসে থাকলে শুয়ে পড়ি: এই নির্দেশনা হাদিসেও এসেছে। শুনতে সহজ, কিন্তু অবস্থান বদলালে সত্যিই মাথা ঠান্ডা হয়। সাথে অফিস থেকে ফিরে দশ মিনিট একা বসে থাকার অভ্যাস করেছি।',
        reference: 'সুনানে আবু দাউদ : ৪৭৮২',
        hoursAgo: 50,
        helpfulBy: ['demo', 'fatima'],
      },
      {
        key: 'r3',
        author: 'karim',
        body: 'যারা এসব বলে তারা আসলে...',
        hoursAgo: 48,
        removed: true,
      },
      {
        key: 'r4',
        author: 'demo',
        body: 'রাকিব ভাই, অফিস থেকে ফিরে দশ মিনিট একা বসার কথাটা খুব কাজের মনে হচ্ছে। আজ থেকেই চেষ্টা করব, ইনশাআল্লাহ।',
        hoursAgo: 46,
        parentKey: 'r2',
        helpfulBy: ['rakib'],
      },
      {
        key: 'r5',
        author: 'sumaiya',
        body: 'আল্লাহ মুত্তাকিদের গুণ বর্ণনায় বলেছেন, তারা ক্রোধ সংবরণ করে এবং মানুষকে ক্ষমা করে। লক্ষ করুন, রাগ না আসা নয়, বরং রাগ সংবরণ করাই প্রশংসিত। তাই রাগ এলে নিজেকে ব্যর্থ ভাববেন না; সংবরণের প্রতিটি চেষ্টাই ইবাদত।',
        arabic: 'وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ',
        reference: 'সূরা আলে ইমরান : ১৩৪',
        hoursAgo: 24,
        helpfulBy: ['demo', 'fatima', 'rakib', 'nusrat', 'sakib', 'tanvir'],
      },
    ],
  },
  {
    slug: 'starting-zuhr-congregation-at-office',
    title: 'অফিসে জোহরের জামাত চালু করতে চাই, কীভাবে শুরু করব?',
    category: 'ibadah',
    author: 'tanvir',
    body: 'আমাদের অফিসে প্রায় ত্রিশজন মুসলিম সহকর্মী আছেন, কিন্তু জামাতের কোনো ব্যবস্থা নেই। কর্তৃপক্ষের কাছে কীভাবে প্রস্তাব দেওয়া যায়, আর কীভাবে শুরু করব?',
    hoursAgo: 30,
    viewCount: 610,
    posts: [
      {
        key: 'o1',
        author: 'rakib',
        body: 'আমরা প্রথমে কয়েকজন মিলে মিটিং রুমে দশ মিনিটের জন্য জামাত শুরু করেছিলাম। নিয়মিততা দেখে পরে কর্তৃপক্ষ নিজেরাই একটি ছোট কক্ষ দিয়েছে।',
        hoursAgo: 28,
        helpfulBy: ['tanvir', 'demo'],
        markedHelpful: true,
      },
      {
        key: 'o2',
        author: 'sakib',
        body: 'লিখিত প্রস্তাবে সময় নির্দিষ্ট করে দিন, যাতে কাজের ক্ষতি না হয়, এটা কর্তৃপক্ষকে আশ্বস্ত করে।',
        hoursAgo: 1,
      },
    ],
  },
  {
    slug: 'marriage-across-madhhabs',
    title: 'ভিন্ন মাযহাবের পরিবারে বিয়ে: পারস্পরিক বোঝাপড়া কীভাবে রাখব?',
    category: 'family-society',
    author: 'nusrat',
    anonymous: true,
    body: 'আমার বিয়ের কথা চলছে এমন একটি পরিবারে, যাঁরা ভিন্ন মাযহাব অনুসরণ করেন। সালাতের কিছু আমল আলাদা। ভবিষ্যতে সন্তানদের শেখানো নিয়েও চিন্তা হচ্ছে। যাঁরা এমন অভিজ্ঞতার মধ্য দিয়ে গেছেন, পরামর্শ দেবেন?',
    hoursAgo: 3,
    viewCount: 1800,
    posts: [
      {
        key: 'm1',
        author: 'fatima',
        body: 'আমাদের পরিবারেও এমন। আমরা শুরুতেই কথা বলে নিয়েছিলাম: যার যার অনুসৃত আমল সে করবে, আর সন্তানদের দুই মতেরই দলিল শেখাব। আলহামদুলিল্লাহ, কোনো সমস্যা হয়নি।',
        hoursAgo: 2,
        helpfulBy: ['nusrat'],
      },
    ],
  },
  {
    slug: 'which-book-to-start-learning-arabic',
    title: 'আরবি শেখা শুরু করব কোন বই দিয়ে?',
    category: 'ilm-study',
    author: 'fatima',
    body: 'কুরআন বুঝে পড়ার জন্য আরবি শিখতে চাই। একদম শুরু থেকে কোন বই বা কোর্স দিয়ে শুরু করা ভালো?',
    hoursAgo: 5,
    viewCount: 140,
    posts: [],
  },
  {
    slug: 'routine-for-waking-up-for-fajr',
    title: 'ফজরে নিয়মিত ওঠার জন্য আপনাদের রুটিন কী?',
    category: 'ibadah',
    author: 'rakib',
    body: 'অনেক চেষ্টা করেও ফজরে নিয়মিত উঠতে পারছি না। আপনাদের কী কী অভ্যাস কাজে দিয়েছে?',
    hoursAgo: 26,
    viewCount: 2300,
    posts: [
      {
        key: 'f1',
        author: 'sakib',
        body: 'ইশার পর মোবাইল দূরে রেখে তাড়াতাড়ি ঘুমানো সবচেয়ে বেশি কাজ করেছে।',
        hoursAgo: 25,
        helpfulBy: ['rakib', 'demo'],
      },
      {
        key: 'f2',
        author: 'demo',
        body: 'ঘুমানোর আগে ওযু করে ঘুমানোর সুন্নাহটা আমার জন্য খুব সহায়ক হয়েছে।',
        hoursAgo: 24,
        helpfulBy: ['rakib'],
      },
      {
        key: 'f3',
        author: 'nusrat',
        body: 'পরিবারের একজন আরেকজনকে জাগিয়ে দেওয়ার দায়িত্ব ভাগ করে নিই।',
        hoursAgo: 22,
      },
    ],
  },
  {
    slug: 'encouraging-children-to-ask-questions',
    title: 'সন্তানকে প্রশ্ন করতে উৎসাহ দেব কীভাবে, যাতে সংশয় না জাগে?',
    category: 'family-society',
    author: 'nusrat',
    body: 'আমার সন্তান দশ বছরের। আল্লাহ ও আখিরাত নিয়ে অনেক প্রশ্ন করে। কীভাবে উত্তর দিলে ওর কৌতূহল আর ঈমান দুটোই সুরক্ষিত থাকবে?',
    hoursAgo: 28,
    viewCount: 95,
    posts: [],
  },
  {
    slug: 'question-on-lesson-8-of-six-pillars',
    title: 'ঈমানের ছয় স্তম্ভ কোর্সের পাঠ ৮ নিয়ে একটি প্রশ্ন',
    category: 'aqidah-iman',
    author: 'sakib',
    body: 'তাকদিরের পাঠে বলা হয়েছে চেষ্টা আমাদের দায়িত্ব। তাহলে যারা চেষ্টা করেও ব্যর্থ হয়, তাদের ক্ষেত্রে বিষয়টি কীভাবে বুঝব?',
    hoursAgo: 48,
    viewCount: 210,
    posts: [
      {
        key: 'q1',
        author: 'tanvir',
        body: 'চেষ্টার পুরস্কার ফলাফলের ওপর নির্ভর করে না, নিয়ত ও প্রচেষ্টার ওপর নির্ভর করে। ব্যর্থতাও তাকদিরের অংশ, যেখানে সবরের সওয়াব আছে।',
        hoursAgo: 46,
        helpfulBy: ['sakib'],
        markedHelpful: true,
      },
    ],
  },
]
