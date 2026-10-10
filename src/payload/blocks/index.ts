import type { Block } from 'payload'

import { DALIL_TYPES, GRADE_OPTIONS } from '../fields'

const PREVIEW = '@/payload/components/scripture-preview#ScripturePreview'

/** Quran verse card. Pick a stored ayah (its text comes from the database) or write it by hand. */
export const AyahBlock: Block = {
  slug: 'ayah',
  interfaceName: 'AyahBlock',
  labels: { singular: 'আয়াত', plural: 'আয়াত' },
  fields: [
    {
      name: 'ayah',
      label: 'ডাটাবেস থেকে আয়াত বেছে নিন',
      type: 'relationship',
      relationTo: 'ayahs',
      admin: {
        allowCreate: false,
        description:
          'খুঁজতে সূরার নাম (যেমন বাকারা), সূরা:আয়াত (যেমন 2:255) বা অনুবাদের কোনো শব্দ লিখুন। বাছাই করলে আরবি, অনুবাদ ও সূত্র ডাটাবেস থেকেই দেখাবে, নিচে আর কিছু লিখতে হবে না।',
      },
    },
    {
      name: 'preview',
      type: 'ui',
      admin: { components: { Field: { path: PREVIEW, clientProps: { kind: 'ayah' } } } },
    },
    {
      type: 'collapsible',
      label: 'নিজের মতো লিখতে চাইলে (ঐচ্ছিক)',
      admin: {
        initCollapsed: true,
        description:
          'ডাটাবেস থেকে না বেছে নিজে লিখতে, অথবা বাছাই করা আয়াতের অনুবাদ বা সূত্র বদলাতে। এখানে যা লিখবেন সেটিই দেখাবে।',
      },
      fields: [
        { name: 'arabic', label: 'আরবি পাঠ', type: 'textarea' },
        { name: 'translation', label: 'বাংলা অনুবাদ', type: 'textarea' },
        {
          name: 'reference',
          label: 'সূত্র',
          type: 'text',
          admin: { placeholder: 'সূরা আন-নাহল : ১২৫' },
        },
      ],
    },
    {
      name: 'compact',
      label: 'ছোট আকারে দেখান',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'লেখার মাঝে ছোট, বাম দিকে সাজানো কার্ড; বড় সাজসজ্জা ছাড়া।' },
    },
  ],
}

export const HadithBlock: Block = {
  slug: 'hadith',
  interfaceName: 'HadithBlock',
  labels: { singular: 'হাদিস', plural: 'হাদিস' },
  fields: [
    {
      name: 'hadith',
      label: 'ডাটাবেস থেকে হাদিস বেছে নিন',
      type: 'relationship',
      relationTo: 'hadiths',
      admin: {
        allowCreate: false,
        description:
          'খুঁজতে গ্রন্থ ও নম্বর (যেমন বুখারী 1) বা হাদিসের কোনো শব্দ লিখুন। বাছাই করলে মতন, অনুবাদ, বর্ণনাকারী, সূত্র ও মান ডাটাবেস থেকেই দেখাবে।',
      },
    },
    {
      name: 'preview',
      type: 'ui',
      admin: { components: { Field: { path: PREVIEW, clientProps: { kind: 'hadith' } } } },
    },
    {
      type: 'collapsible',
      label: 'নিজের মতো লিখতে চাইলে (ঐচ্ছিক)',
      admin: {
        initCollapsed: true,
        description:
          'ডাটাবেস থেকে না বেছে নিজে লিখতে, অথবা বাছাই করা হাদিসের কোনো অংশ বদলাতে। এখানে যা লিখবেন সেটিই দেখাবে।',
      },
      fields: [
        { name: 'arabic', label: 'আরবি মতন', type: 'textarea' },
        { name: 'text', label: 'বাংলা অনুবাদ', type: 'textarea' },
        {
          type: 'row',
          fields: [
            { name: 'narrator', label: 'বর্ণনাকারী', type: 'text', admin: { width: '50%' } },
            {
              name: 'source',
              label: 'গ্রন্থ ও নম্বর',
              type: 'text',
              admin: { width: '50%', placeholder: 'সহিহ মুসলিম : ২৫৯৪' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'grade',
              label: 'মান',
              type: 'select',
              options: GRADE_OPTIONS,
              admin: { width: '50%' },
            },
            {
              name: 'gradeNote',
              label: 'মানের বিবরণ (ঐচ্ছিক)',
              type: 'text',
              admin: { width: '50%', placeholder: 'ইমাম তিরমিযী: হাসান' },
            },
          ],
        },
      ],
    },
  ],
}

export const DalilBlock: Block = {
  slug: 'dalil',
  interfaceName: 'DalilBlock',
  labels: { singular: 'দলিল বক্স', plural: 'দলিল বক্স' },
  fields: [
    { name: 'title', label: 'শিরোনাম', type: 'text', defaultValue: 'দলিল ও তথ্যসূত্র' },
    {
      name: 'items',
      label: 'দলিলসমূহ',
      type: 'array',
      minRows: 1,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'type',
              label: 'ধরন',
              type: 'select',
              required: true,
              defaultValue: 'quran',
              options: DALIL_TYPES,
              admin: { width: '25%' },
            },
            {
              name: 'citation',
              label: 'সূত্র',
              type: 'text',
              required: true,
              admin: { width: '40%' },
            },
            { name: 'note', label: 'বিবরণ', type: 'text', admin: { width: '35%' } },
          ],
        },
        { name: 'url', label: 'লিংক (ঐচ্ছিক)', type: 'text' },
      ],
    },
  ],
}

export const YouTubeBlock: Block = {
  slug: 'youtube',
  interfaceName: 'YouTubeBlock',
  labels: { singular: 'ইউটিউব ভিডিও', plural: 'ইউটিউব ভিডিও' },
  fields: [
    {
      name: 'url',
      label: 'ইউটিউব লিংক বা ভিডিও আইডি',
      type: 'text',
      required: true,
      validate: (value: unknown) =>
        typeof value === 'string' && /^([\w-]{11}|https?:\/\/\S+)$/.test(value.trim())
          ? true
          : 'সঠিক ইউটিউব লিংক বা ১১ অক্ষরের আইডি দিন',
      admin: {
        components: {
          Field: {
            path: '@/payload/components/youtube/youtube-field#YouTubeField',
            clientProps: { store: 'url', titleField: 'title' },
          },
        },
      },
    },
    { name: 'title', label: 'শিরোনাম', type: 'text', required: true },
    { name: 'start', label: 'শুরুর সময় (সেকেন্ড)', type: 'number', min: 0 },
  ],
}

export const CalloutBlock: Block = {
  slug: 'callout',
  interfaceName: 'CalloutBlock',
  labels: { singular: 'কলআউট', plural: 'কলআউট' },
  fields: [
    {
      name: 'tone',
      label: 'ধরন',
      type: 'select',
      defaultValue: 'note',
      options: [
        { label: 'নোট', value: 'note' },
        { label: 'গুরুত্বপূর্ণ', value: 'gold' },
        { label: 'সতর্কতা', value: 'warning' },
      ],
    },
    { name: 'title', label: 'শিরোনাম', type: 'text' },
    { name: 'body', label: 'লেখা', type: 'textarea', required: true },
  ],
}

export const PullQuoteBlock: Block = {
  slug: 'pullQuote',
  interfaceName: 'PullQuoteBlock',
  labels: { singular: 'উদ্ধৃতি', plural: 'উদ্ধৃতি' },
  fields: [{ name: 'text', label: 'উদ্ধৃতি', type: 'textarea', required: true }],
}

/** Two to four pictures side by side, enlarged on a tap. */
export const GalleryBlock: Block = {
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  labels: { singular: 'ছবির গ্যালারি', plural: 'ছবির গ্যালারি' },
  fields: [
    {
      name: 'images',
      label: 'ছবি',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
      minRows: 2,
      maxRows: 12,
      filterOptions: { mimeType: { contains: 'image' } },
      admin: { description: 'অন্তত ২টি। যে ক্রমে বাছবেন সেই ক্রমে দেখাবে; টেনে ক্রম বদলানো যায়।' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'columns',
          label: 'এক সারিতে কয়টি',
          type: 'select',
          defaultValue: '3',
          options: [
            { label: '২টি', value: '2' },
            { label: '৩টি', value: '3' },
            { label: '৪টি', value: '4' },
          ],
          admin: { width: '50%', isClearable: false, description: 'মোবাইলে সারিতে ২টি করে।' },
        },
        {
          name: 'aspect',
          label: 'ছবির অনুপাত',
          type: 'select',
          defaultValue: '4/3',
          options: [
            { label: '4:3', value: '4/3' },
            { label: 'বর্গ 1:1', value: '1/1' },
            { label: 'চওড়া 16:9', value: '16/9' },
            { label: 'লম্বা 3:4', value: '3/4' },
          ],
          admin: {
            width: '50%',
            isClearable: false,
            description: 'সব ছবি একই মাপে কেটে সাজানো হয়; বড় করে দেখলে পুরো ছবি।',
          },
        },
      ],
    },
    { name: 'caption', label: 'ক্যাপশন (ঐচ্ছিক)', type: 'text' },
  ],
}

export const CONTENT_BLOCKS = [
  AyahBlock,
  HadithBlock,
  DalilBlock,
  YouTubeBlock,
  GalleryBlock,
  CalloutBlock,
  PullQuoteBlock,
]
