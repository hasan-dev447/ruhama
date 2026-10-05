import type { CollectionConfig } from 'payload'

import { hasRole, STAFF_ROLES } from '@/lib/roles'
import { TAGS } from '@/server/cache/tags'
import { recountCourse } from '@/server/services/counters'

import { contentTeam, editorsOnly, statusPublishedOrStaff } from '../access'
import { slugField } from '../fields'
import { revalidateCollection } from '../hooks/revalidate'
import { PUBLISH_STATUS } from './Courses'

const idOf = (v: unknown) =>
  v && typeof v === 'object' && 'id' in v
    ? (v as { id: number }).id
    : (v as number | null | undefined)

const revalidate = revalidateCollection('lessons', {
  isPublic: (d) => d.status === 'published',
  extraTags: (doc) =>
    idOf(doc.course) ? [TAGS.doc('courses', idOf(doc.course)!), TAGS.collection('courses')] : [],
})

export const Lessons: CollectionConfig = {
  slug: 'lessons',
  labels: { singular: 'পাঠ', plural: 'পাঠ' },
  admin: {
    group: 'শেখার পথ',
    useAsTitle: 'title',
    defaultColumns: ['title', 'course', 'module', 'order', 'status'],
    hidden: ({ user }) => !hasRole(user, ...STAFF_ROLES),
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
    afterChange: [
      revalidate.afterChange,
      async ({ doc, previousDoc, req, context }) => {
        if (context.skipCounters) return doc
        for (const c of new Set([idOf(doc.course), idOf(previousDoc?.course)].filter(Boolean)))
          await recountCourse(req.payload, c!, req)
        return doc
      },
    ],
    afterDelete: [
      revalidate.afterDelete,
      async ({ doc, req }) => {
        if (idOf(doc.course)) await recountCourse(req.payload, idOf(doc.course)!, req)
        return doc
      },
    ],
  },
  fields: [
    { name: 'title', label: 'পাঠের নাম', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'course',
          label: 'কোর্স',
          type: 'relationship',
          relationTo: 'courses',
          required: true,
          index: true,
          admin: { width: '50%' },
        },
        {
          name: 'module',
          label: 'মডিউল নম্বর',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
          admin: { width: '25%' },
        },
        {
          name: 'order',
          label: 'পাঠ নম্বর (কোর্সে)',
          type: 'number',
          required: true,
          min: 1,
          index: true,
          admin: { width: '25%' },
        },
      ],
    },
    {
      name: 'media',
      label: 'অডিও বা ভিডিও',
      type: 'group',
      fields: [
        {
          name: 'kind',
          label: 'ধরন',
          type: 'select',
          defaultValue: 'none',
          options: [
            { label: 'নেই', value: 'none' },
            { label: 'ইউটিউব ভিডিও', value: 'youtube' },
            { label: 'অডিও', value: 'audio' },
          ],
        },
        {
          name: 'youtubeId',
          label: 'ইউটিউব আইডি',
          type: 'text',
          admin: { condition: (_, s) => s?.kind === 'youtube' },
        },
        {
          name: 'audio',
          label: 'অডিও ফাইল',
          type: 'upload',
          relationTo: 'media',
          admin: { condition: (_, s) => s?.kind === 'audio' },
        },
        {
          name: 'durationSeconds',
          label: 'দৈর্ঘ্য (সেকেন্ড)',
          type: 'number',
          admin: { condition: (_, s) => s?.kind !== 'none' },
        },
      ],
    },
    { name: 'content', label: 'পাঠ', type: 'richText', required: true },
    {
      name: 'quiz',
      label: 'নিজেকে যাচাই করুন',
      type: 'array',
      labels: { singular: 'প্রশ্ন', plural: 'প্রশ্ন' },
      fields: [
        { name: 'question', label: 'প্রশ্ন', type: 'text', required: true },
        {
          name: 'options',
          label: 'বিকল্প',
          type: 'array',
          minRows: 2,
          maxRows: 4,
          fields: [{ name: 'text', label: 'বিকল্প', type: 'text', required: true }],
        },
        {
          name: 'correctIndex',
          label: 'সঠিক বিকল্পের নম্বর (১ থেকে)',
          type: 'number',
          required: true,
          min: 1,
          max: 4,
        },
        { name: 'explanation', label: 'ব্যাখ্যা', type: 'textarea' },
      ],
    },
    slugField({ prefix: 'lesson', unique: false }),
    {
      name: 'durationMinutes',
      label: 'পড়ার সময় (মিনিট)',
      type: 'number',
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
  ],
  indexes: [{ fields: ['course', 'slug'], unique: true }],
}
