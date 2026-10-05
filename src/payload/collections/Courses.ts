import type { CollectionConfig } from 'payload'

import { JOURNEY_STAGES } from '@/lib/journey'
import { hasRole, STAFF_ROLES } from '@/lib/roles'

import { contentTeam, editorsOnly, statusPublishedOrStaff } from '../access'
import { levelField, searchTextField, slugField } from '../fields'
import { revalidateCollection } from '../hooks/revalidate'
import { previewUrl } from '../preview'

const revalidate = revalidateCollection('courses', { isPublic: (d) => d.status === 'published' })

export const PUBLISH_STATUS = [
  { label: 'খসড়া', value: 'draft' },
  { label: 'প্রকাশিত', value: 'published' },
]

export const Courses: CollectionConfig = {
  slug: 'courses',
  labels: { singular: 'কোর্স', plural: 'কোর্স' },
  admin: {
    group: 'শেখার পথ',
    useAsTitle: 'title',
    defaultColumns: ['title', 'journeyStage', 'level', 'lessonCount', 'enrolledCount', 'status'],
    hidden: ({ user }) => !hasRole(user, ...STAFF_ROLES),
    preview: previewUrl('courses'),
  },
  defaultSort: 'order',
  versions: { maxPerDoc: 20 },
  access: {
    read: statusPublishedOrStaff(),
    create: contentTeam,
    update: contentTeam,
    delete: editorsOnly,
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        data.searchText = [
          data.title ?? originalDoc?.title,
          data.description ?? originalDoc?.description,
        ]
          .filter(Boolean)
          .join('\n')
        return data
      },
    ],
    afterChange: [revalidate.afterChange],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    { name: 'title', label: 'কোর্সের নাম', type: 'text', required: true },
    { name: 'description', label: 'সংক্ষিপ্ত বিবরণ', type: 'textarea', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'journeyStage',
          label: 'যাত্রার ধাপ',
          type: 'select',
          required: true,
          index: true,
          options: JOURNEY_STAGES.map((s) => ({ label: s.label, value: s.value })),
          admin: { width: '50%' },
        },
        {
          name: 'instructor',
          label: 'শিক্ষক',
          type: 'relationship',
          relationTo: 'people',
          index: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'modules',
      label: 'মডিউল',
      type: 'array',
      minRows: 1,
      labels: { singular: 'মডিউল', plural: 'মডিউল' },
      admin: { description: 'পাঠগুলো “পাঠ” সংগ্রহে তৈরি করে মডিউল নম্বর দিয়ে যুক্ত করুন।' },
      fields: [
        { name: 'title', label: 'মডিউলের নাম', type: 'text', required: true },
        { name: 'summary', label: 'সারসংক্ষেপ', type: 'textarea' },
      ],
    },
    { name: 'durationMinutes', label: 'মোট সময় (মিনিট)', type: 'number', min: 0 },
    slugField({ prefix: 'course' }),
    levelField(),
    {
      name: 'tint',
      label: 'কার্ডের রং',
      type: 'select',
      defaultValue: 'sage',
      options: [
        { label: 'সেজ', value: 'sage' },
        { label: 'গোল্ড', value: 'gold' },
        { label: 'টিল', value: 'teal' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'order',
      label: 'ক্রম',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      label: 'অবস্থা',
      type: 'select',
      defaultValue: 'draft',
      index: true,
      options: PUBLISH_STATUS,
      admin: { position: 'sidebar' },
    },
    {
      name: 'reviewedBy',
      label: 'রিভিউ করেছেন',
      type: 'relationship',
      relationTo: 'people',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'lessonCount',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'enrolledCount',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true, position: 'sidebar' },
    },
    searchTextField,
  ],
}
