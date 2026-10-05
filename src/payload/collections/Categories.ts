import type { CollectionConfig } from 'payload'

import { TAGS } from '@/server/cache/tags'

import { anyone, editorsOnly } from '../access'
import { slugField } from '../fields'
import { revalidateCollection } from '../hooks/revalidate'

export const CATEGORY_ICONS = [
  { label: 'কম্পাস (আকীদাহ)', value: 'compass' },
  { label: 'দাঁড়িপাল্লা (ফিকহ)', value: 'scale' },
  { label: 'সূর্যোদয় (ইবাদত)', value: 'sunrise' },
  { label: 'চারাগাছ (তাযকিয়াহ)', value: 'sprout' },
  { label: 'হৃদয় (আখলাক)', value: 'heart' },
  { label: 'ওয়ালেট (লেনদেন)', value: 'wallet' },
  { label: 'মানুষ (সামাজিক)', value: 'users' },
  { label: 'বই', value: 'book' },
  { label: 'দুই কলাম (ইখতিলাফ)', value: 'columns' },
  { label: 'পরিবার', value: 'home' },
  { label: 'ইতিহাস', value: 'landmark' },
  { label: 'মাইক (দাওয়াহ)', value: 'mic' },
]

const revalidate = revalidateCollection('categories', {
  extraTags: () => [
    TAGS.home,
    TAGS.collection('articles'),
    TAGS.collection('questions'),
    TAGS.collection('videos'),
  ],
})

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'বিষয়', plural: 'বিষয়সমূহ' },
  admin: {
    group: 'কনটেন্ট',
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'usedFor', 'articleCount', 'order'],
  },
  defaultSort: 'order',
  access: { read: anyone, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
  hooks: { afterChange: [revalidate.afterChange], afterDelete: [revalidate.afterDelete] },
  fields: [
    { name: 'name', label: 'নাম', type: 'text', required: true },
    slugField({ from: 'name', prefix: 'topic' }),
    { name: 'description', label: 'বিবরণ', type: 'textarea' },
    { name: 'icon', label: 'আইকন', type: 'select', options: CATEGORY_ICONS, defaultValue: 'book' },
    {
      name: 'usedFor',
      label: 'যেখানে ব্যবহৃত',
      type: 'select',
      hasMany: true,
      required: true,
      index: true,
      defaultValue: ['articles'],
      options: [
        { label: 'প্রবন্ধ', value: 'articles' },
        { label: 'প্রশ্নোত্তর', value: 'questions' },
        { label: 'ভিডিও', value: 'videos' },
        { label: 'মজলিস', value: 'events' },
        { label: 'মতপার্থক্য', value: 'ikhtilaf' },
      ],
    },
    {
      name: 'order',
      label: 'ক্রম',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
    {
      type: 'collapsible',
      label: 'পরিসংখ্যান (স্বয়ংক্রিয়)',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'articleCount',
          label: 'প্রকাশিত প্রবন্ধ',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true },
        },
        {
          name: 'questionCount',
          label: 'প্রকাশিত উত্তর',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true },
        },
        {
          name: 'videoCount',
          label: 'ভিডিও',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true },
        },
      ],
    },
  ],
}
