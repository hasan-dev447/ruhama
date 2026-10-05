import type { Field, FieldHook, TextField } from 'payload'

import { slugify } from '@/lib/utils'

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8)
}

const formatSlug =
  (fallbackField: string, prefix: string): FieldHook =>
  ({ value, data, originalDoc }) => {
    if (typeof value === 'string' && value.trim()) return slugify(value)
    if (originalDoc?.slug) return originalDoc.slug
    const source = data?.[fallbackField] ?? originalDoc?.[fallbackField]
    const fromTitle = typeof source === 'string' ? slugify(source) : ''
    return fromTitle || `${prefix}-${randomSuffix()}`
  }

/** Readable English slug. Bangla titles cannot be transliterated reliably, so editors type it. */
export function slugField(
  opts: { from?: string; prefix?: string; unique?: boolean } = {},
): TextField {
  const { from = 'title', prefix = 'item', unique = true } = opts
  return {
    name: 'slug',
    label: 'স্লাগ (URL)',
    type: 'text',
    index: true,
    unique,
    admin: {
      position: 'sidebar',
      description: 'ইংরেজি ছোট হাতের অক্ষর ও হাইফেন, যেমন: sunnah-of-respectful-disagreement',
    },
    hooks: { beforeValidate: [formatSlug(from, prefix)] },
    validate: (value: unknown) => {
      if (typeof value !== 'string' || !value) return true
      return SLUG_RE.test(value) || 'শুধু ইংরেজি ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন ব্যবহার করুন'
    },
  }
}

export const LEVEL_OPTIONS = [
  { label: 'প্রাথমিক', value: 'beginner' },
  { label: 'মধ্যম', value: 'intermediate' },
  { label: 'উচ্চ', value: 'advanced' },
]

export const levelField = (required = true): Field => ({
  name: 'level',
  label: 'স্তর',
  type: 'select',
  required,
  defaultValue: 'beginner',
  index: true,
  options: LEVEL_OPTIONS,
  admin: { position: 'sidebar' },
})

export const tintField = (options: { label: string; value: string }[], name = 'tint'): Field => ({
  name,
  label: 'রঙের ধরন',
  type: 'select',
  defaultValue: options[0]?.value,
  options,
  admin: { position: 'sidebar' },
})

export const publishedAtField: Field = {
  name: 'publishedAt',
  label: 'প্রকাশের তারিখ',
  type: 'date',
  index: true,
  admin: {
    position: 'sidebar',
    date: { pickerAppearance: 'dayAndTime' },
  },
}

/** Dalil / reference list shown in the design's `.dalil-box`. */
export const DALIL_TYPES = [
  { label: 'কুরআন', value: 'quran' },
  { label: 'হাদিস', value: 'hadith' },
  { label: 'মতপার্থক্য', value: 'ikhtilaf' },
  { label: 'আসার', value: 'athar' },
  { label: 'গ্রন্থ', value: 'book' },
  { label: 'অন্যান্য', value: 'other' },
]

export const dalilField = (name = 'references', label = 'দলিল ও তথ্যসূত্র'): Field => ({
  name,
  label,
  type: 'array',
  labels: { singular: 'দলিল', plural: 'দলিলসমূহ' },
  admin: { initCollapsed: true },
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
          admin: { width: '40%', placeholder: 'সূরা আন-নাহল : ১২৫' },
        },
        { name: 'note', label: 'সংক্ষিপ্ত বিবরণ', type: 'text', admin: { width: '35%' } },
      ],
    },
    {
      name: 'url',
      label: 'লিংক (ঐচ্ছিক)',
      type: 'text',
      admin: { description: 'সাইটের ভেতরের লিংক হলে /ikhtilaf/... এভাবে লিখুন' },
    },
  ],
})

/** Plain-text search body, recomputed by a beforeChange hook on every save. */
export const searchTextField: Field = {
  name: 'searchText',
  type: 'textarea',
  admin: { hidden: true },
}

export const GRADE_OPTIONS = [
  { label: 'সহিহ', value: 'sahih' },
  { label: 'হাসান', value: 'hasan' },
  { label: 'যঈফ', value: 'daif' },
  { label: 'মাওযু', value: 'mawdu' },
  { label: 'উল্লেখ নেই', value: 'unknown' },
]
