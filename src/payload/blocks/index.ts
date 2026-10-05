import type { Block } from 'payload'

import { DALIL_TYPES, GRADE_OPTIONS } from '../fields'

/** Quran verse card. Either pick a stored ayah or type the text by hand. */
export const AyahBlock: Block = {
  slug: 'ayah',
  interfaceName: 'AyahBlock',
  labels: { singular: 'আয়াত', plural: 'আয়াত' },
  fields: [
    {
      name: 'ayah',
      label: 'ডাটাবেস থেকে আয়াত (ঐচ্ছিক)',
      type: 'relationship',
      relationTo: 'ayahs',
      admin: {
        description:
          'বাছাই করলে আরবি, অনুবাদ ও সূত্র স্বয়ংক্রিয়ভাবে আসবে। নিচের ঘরগুলো পূরণ করলে সেগুলো অগ্রাধিকার পাবে।',
      },
    },
    { name: 'arabic', label: 'আরবি পাঠ', type: 'textarea' },
    { name: 'translation', label: 'বাংলা অনুবাদ', type: 'textarea' },
    {
      name: 'reference',
      label: 'সূত্র',
      type: 'text',
      admin: { placeholder: 'সূরা আন-নাহল : ১২৫' },
    },
    { name: 'compact', label: 'ছোট আকারে দেখান', type: 'checkbox', defaultValue: false },
  ],
}

export const HadithBlock: Block = {
  slug: 'hadith',
  interfaceName: 'HadithBlock',
  labels: { singular: 'হাদিস', plural: 'হাদিস' },
  fields: [
    {
      name: 'hadith',
      label: 'ডাটাবেস থেকে হাদিস (ঐচ্ছিক)',
      type: 'relationship',
      relationTo: 'hadiths',
    },
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

export const CONTENT_BLOCKS = [
  AyahBlock,
  HadithBlock,
  DalilBlock,
  YouTubeBlock,
  CalloutBlock,
  PullQuoteBlock,
]
