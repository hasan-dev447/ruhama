import type { CollectionConfig } from 'payload'

import { stripArabic } from '@/lib/arabic'
import { hasRole, STAFF_ROLES } from '@/lib/roles'
import { TAGS } from '@/server/cache/tags'

import { adminsOnly, anyone, editorsOnly } from '../access'
import { GRADE_OPTIONS } from '../fields'
import { safeRevalidate } from '../hooks/revalidate'

const hidden = ({ user }: { user: unknown }) => !hasRole(user as { role?: unknown }, ...STAFF_ROLES)

export const Surahs: CollectionConfig = {
  slug: 'surahs',
  labels: { singular: 'সূরা', plural: 'সূরা' },
  admin: {
    group: 'কুরআন ও হাদিস',
    useAsTitle: 'nameBangla',
    defaultColumns: ['number', 'nameBangla', 'nameArabic', 'ayahCount'],
    hidden,
  },
  defaultSort: 'number',
  access: { read: anyone, create: adminsOnly, update: editorsOnly, delete: adminsOnly },
  fields: [
    { name: 'number', type: 'number', required: true, unique: true, index: true, min: 1, max: 114 },
    { name: 'nameArabic', type: 'text', required: true },
    { name: 'nameBangla', type: 'text', required: true },
    { name: 'nameLatin', type: 'text', required: true, index: true },
    { name: 'meaning', type: 'text' },
    {
      name: 'revelation',
      type: 'select',
      options: [
        { label: 'মাক্কী', value: 'meccan' },
        { label: 'মাদানী', value: 'medinan' },
      ],
    },
    { name: 'ayahCount', type: 'number', required: true },
  ],
}

export const Ayahs: CollectionConfig = {
  slug: 'ayahs',
  labels: { singular: 'আয়াত', plural: 'আয়াত' },
  admin: {
    group: 'কুরআন ও হাদিস',
    useAsTitle: 'key',
    defaultColumns: ['key', 'translation'],
    listSearchableFields: ['key', 'translation'],
    hidden,
  },
  defaultSort: 'sortKey',
  access: { read: anyone, create: adminsOnly, update: editorsOnly, delete: adminsOnly },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        const arabic = String(data.arabic ?? originalDoc?.arabic ?? '')
        data.arabicPlain = stripArabic(arabic)
        const surah = Number(data.surah ?? originalDoc?.surah)
        const ayah = Number(data.ayah ?? originalDoc?.ayah)
        data.key = `${surah}:${ayah}`
        data.sortKey = surah * 1000 + ayah
        return data
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'surah',
          type: 'number',
          required: true,
          index: true,
          min: 1,
          max: 114,
          admin: { width: '33%' },
        },
        { name: 'ayah', type: 'number', required: true, min: 1, admin: { width: '33%' } },
        { name: 'juz', type: 'number', index: true, admin: { width: '34%' } },
      ],
    },
    { name: 'key', type: 'text', unique: true, index: true, admin: { readOnly: true } },
    { name: 'sortKey', type: 'number', index: true, admin: { hidden: true } },
    { name: 'arabic', label: 'আরবি', type: 'textarea', required: true },
    { name: 'arabicPlain', type: 'textarea', admin: { hidden: true } },
    { name: 'translation', label: 'বাংলা অনুবাদ', type: 'textarea', required: true },
  ],
}

export const HadithCollections: CollectionConfig = {
  slug: 'hadith-collections',
  labels: { singular: 'হাদিস গ্রন্থ', plural: 'হাদিস গ্রন্থ' },
  admin: {
    group: 'কুরআন ও হাদিস',
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'hadithCount'],
    hidden,
  },
  defaultSort: 'order',
  access: { read: anyone, create: adminsOnly, update: editorsOnly, delete: adminsOnly },
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'name', label: 'নাম', type: 'text', required: true },
    { name: 'shortName', label: 'সংক্ষিপ্ত নাম', type: 'text', required: true },
    { name: 'compiler', label: 'সংকলক', type: 'text' },
    { name: 'order', type: 'number', defaultValue: 0 },
    { name: 'hadithCount', type: 'number', defaultValue: 0, admin: { readOnly: true } },
  ],
}

export const Hadiths: CollectionConfig = {
  slug: 'hadiths',
  labels: { singular: 'হাদিস', plural: 'হাদিস' },
  admin: {
    group: 'কুরআন ও হাদিস',
    useAsTitle: 'key',
    defaultColumns: ['key', 'grade', 'text'],
    listSearchableFields: ['key', 'text'],
    hidden,
  },
  defaultSort: 'number',
  access: { read: anyone, create: adminsOnly, update: editorsOnly, delete: adminsOnly },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        data.arabicPlain = stripArabic(String(data.arabic ?? originalDoc?.arabic ?? ''))
        return data
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'book',
          label: 'গ্রন্থ',
          type: 'relationship',
          relationTo: 'hadith-collections',
          required: true,
          index: true,
          admin: { width: '50%' },
        },
        {
          name: 'number',
          label: 'নম্বর',
          type: 'number',
          required: true,
          index: true,
          admin: { width: '25%' },
        },
        { name: 'numberLabel', label: 'নম্বর (লেবেল)', type: 'text', admin: { width: '25%' } },
      ],
    },
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'যেমন bukhari:735' },
    },
    { name: 'chapter', label: 'অধ্যায়', type: 'text' },
    { name: 'narrator', label: 'বর্ণনাকারী', type: 'text' },
    { name: 'arabic', label: 'আরবি', type: 'textarea' },
    { name: 'arabicPlain', type: 'textarea', admin: { hidden: true } },
    { name: 'text', label: 'বাংলা অনুবাদ', type: 'textarea', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'grade',
          label: 'মান',
          type: 'select',
          options: GRADE_OPTIONS,
          defaultValue: 'unknown',
          index: true,
          admin: { width: '50%' },
        },
        { name: 'gradeSource', label: 'মান নির্ধারণ', type: 'text', admin: { width: '50%' } },
      ],
    },
  ],
  indexes: [{ fields: ['book', 'number'] }],
}

export const DailyReminders: CollectionConfig = {
  slug: 'daily-reminders',
  labels: { singular: 'প্রতিদিনের পাথেয়', plural: 'প্রতিদিনের পাথেয়' },
  admin: {
    group: 'কুরআন ও হাদিস',
    defaultColumns: ['kind', 'ayah', 'hadith', 'date', 'active'],
    description:
      'হোম পেজের “আজকের আয়াত ও হাদিস”। নির্দিষ্ট তারিখ দিলে সেদিন দেখাবে, নইলে তালিকা থেকে পালাক্রমে।',
    hidden,
  },
  access: { read: anyone, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
  hooks: {
    afterChange: [
      ({ doc, context }) => (
        context.disableRevalidate || safeRevalidate([TAGS.daily, TAGS.home]),
        doc
      ),
    ],
    afterDelete: [({ doc }) => (safeRevalidate([TAGS.daily, TAGS.home]), doc)],
  },
  fields: [
    {
      name: 'kind',
      label: 'ধরন',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'আয়াত', value: 'ayah' },
        { label: 'হাদিস', value: 'hadith' },
      ],
    },
    {
      name: 'ayah',
      type: 'relationship',
      relationTo: 'ayahs',
      admin: {
        condition: (d) => d?.kind === 'ayah',
        description: 'ধারাবাহিক আয়াতের জন্য শেষ আয়াতও দিতে পারেন।',
      },
    },
    {
      name: 'ayahTo',
      label: 'শেষ আয়াত (ঐচ্ছিক)',
      type: 'relationship',
      relationTo: 'ayahs',
      admin: { condition: (d) => d?.kind === 'ayah' },
    },
    {
      name: 'hadith',
      type: 'relationship',
      relationTo: 'hadiths',
      admin: { condition: (d) => d?.kind === 'hadith' },
    },
    {
      name: 'custom',
      label: 'নিজস্ব পাঠ (ঐচ্ছিক)',
      type: 'group',
      admin: {
        description: 'পূরণ করলে ডাটাবেসের অনুবাদের বদলে এটি দেখাবে, যেমন রিভিউকৃত সাবলীল অনুবাদ।',
      },
      fields: [
        { name: 'arabic', label: 'আরবি', type: 'textarea' },
        { name: 'translation', label: 'বাংলা', type: 'textarea' },
        { name: 'reference', label: 'সূত্র', type: 'text' },
        {
          name: 'narrator',
          label: 'বর্ণনাকারী',
          type: 'text',
          admin: { condition: (d) => d?.kind === 'hadith' },
        },
        {
          name: 'grade',
          label: 'মান',
          type: 'select',
          options: GRADE_OPTIONS,
          admin: { condition: (d) => d?.kind === 'hadith' },
        },
      ],
    },
    {
      name: 'date',
      label: 'নির্দিষ্ট তারিখ',
      type: 'date',
      index: true,
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    { name: 'active', label: 'সক্রিয়', type: 'checkbox', defaultValue: true, index: true },
  ],
}
