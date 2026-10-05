import type { CollectionConfig } from 'payload'

import { readingMinutes } from '@/lib/lexical'
import { CONTENT_ROLES, hasRole, STAFF_ROLES } from '@/lib/roles'
import { TAGS } from '@/server/cache/tags'
import { recountPerson } from '@/server/services/counters'

import {
  dalilField,
  GRADE_OPTIONS,
  levelField,
  publishedAtField,
  searchTextField,
  slugField,
} from '../fields'
import { revalidateCollection } from '../hooks/revalidate'
import { livePreviewUrl, previewUrl } from '../preview'
import { workflowFields } from '../workflow/fields'
import { WORKFLOW_HASH_FIELDS } from '../workflow/hash-fields'
import { workflowAfterChange, workflowBeforeChange } from '../workflow/hooks'
import { fillReviewedBy } from '../workflow/reviewed-by'
import { contentDelete, contentRead, contentUpdate } from './Articles'

const HASH_FIELDS = WORKFLOW_HASH_FIELDS['ikhtilaf-topics']

const idOf = (v: unknown) =>
  v && typeof v === 'object' && 'id' in v
    ? (v as { id: number }).id
    : (v as number | null | undefined)

const revalidate = revalidateCollection('ikhtilaf-topics', {
  extraTags: () => [TAGS.home, TAGS.global('home-page')],
})

type Opinion = {
  title?: string
  holders?: string
  evidence?: { arabic?: string; text?: string }
  understanding?: string
}

/**
 * Topics where scholars hold differing, evidence-based views.
 * Every opinion gets equal space and its own evidence; no opinion is labelled right or wrong.
 */
export const IkhtilafTopics: CollectionConfig = {
  slug: 'ikhtilaf-topics',
  labels: { singular: 'মতপার্থক্যের বিষয়', plural: 'মতপার্থক্যের বিষয়' },
  admin: {
    group: 'ইলম কেন্দ্র',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'reviewStatus', '_status', 'updatedAt'],
    hidden: ({ user }) => !hasRole(user, ...STAFF_ROLES),
    livePreview: { url: livePreviewUrl('ikhtilaf-topics') },
    preview: previewUrl('ikhtilaf-topics'),
  },
  defaultSort: '-publishedAt',
  versions: { drafts: { autosave: { interval: 1500 }, validate: false }, maxPerDoc: 50 },
  access: {
    read: contentRead,
    readVersions: ({ req }) => hasRole(req.user, ...STAFF_ROLES),
    create: ({ req }) => hasRole(req.user, ...CONTENT_ROLES),
    update: contentUpdate,
    delete: contentDelete,
  },
  hooks: {
    beforeChange: [
      workflowBeforeChange(HASH_FIELDS),
      fillReviewedBy,
      ({ data, originalDoc }) => {
        const opinions = ((data.opinions ?? originalDoc?.opinions) as Opinion[]) ?? []
        const parts = [
          data.title ?? originalDoc?.title,
          data.lead ?? originalDoc?.lead,
          ...(((data.consensus ?? originalDoc?.consensus) as { point?: string }[]) ?? []).map(
            (c) => c.point,
          ),
          ...opinions.flatMap((o) => [o.title, o.holders, o.evidence?.text, o.understanding]),
          ...(((data.conduct ?? originalDoc?.conduct) as { point?: string }[]) ?? []).map(
            (c) => c.point,
          ),
        ]
          .filter(Boolean)
          .map(String)
        data.searchText = parts.join('\n')
        data.readingTime = readingMinutes(...parts)
        return data
      },
    ],
    afterChange: [
      workflowAfterChange('ikhtilaf-topics'),
      revalidate.afterChange,
      async ({ doc, req, context }) => {
        if (context.skipCounters || doc._status !== 'published') return doc
        for (const p of ((doc.reviewedBy as unknown[]) ?? []).map(idOf).filter(Boolean))
          await recountPerson(req.payload, p!, req)
        return doc
      },
    ],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    { name: 'title', label: 'বিষয়', type: 'text', required: true },
    { name: 'lead', label: 'ভূমিকা', type: 'textarea', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          label: 'মূল বিষয়',
          type: 'relationship',
          relationTo: 'categories',
          required: true,
          index: true,
          admin: { width: '50%' },
        },
        {
          name: 'subTopic',
          label: 'উপবিষয়',
          type: 'text',
          admin: { width: '50%', placeholder: 'সালাত' },
        },
      ],
    },
    {
      name: 'readFirst',
      label: '“পড়ার আগে” নোট',
      type: 'textarea',
      defaultValue:
        'সবগুলো মতই ইজতিহাদের বৈধ পরিসরে। এই পৃষ্ঠা ফতোয়া নয়; নিজের আমলের জন্য আপনার আস্থাভাজন আলিমের পরামর্শ নিন।',
    },
    {
      name: 'consensus',
      label: 'যেখানে সবাই একমত',
      type: 'array',
      fields: [{ name: 'point', label: 'বিষয়', type: 'textarea', required: true }],
    },
    {
      name: 'opinions',
      label: 'মতসমূহ (সমান গুরুত্বে)',
      type: 'array',
      minRows: 2,
      required: true,
      labels: { singular: 'মত', plural: 'মতসমূহ' },
      fields: [
        { name: 'title', label: 'মতের সারকথা', type: 'text', required: true },
        { name: 'holders', label: 'যাঁরা এই মত পোষণ করেন', type: 'textarea', required: true },
        {
          name: 'evidence',
          label: 'প্রধান দলিল',
          type: 'group',
          fields: [
            {
              name: 'kind',
              label: 'ধরন',
              type: 'select',
              defaultValue: 'hadith',
              options: [
                { label: 'হাদিস', value: 'hadith' },
                { label: 'আয়াত', value: 'ayah' },
              ],
            },
            { name: 'arabic', label: 'আরবি', type: 'textarea' },
            { name: 'text', label: 'বাংলা অনুবাদ', type: 'textarea', required: true },
            {
              type: 'row',
              fields: [
                { name: 'narrator', label: 'বর্ণনাকারী', type: 'text', admin: { width: '50%' } },
                {
                  name: 'source',
                  label: 'সূত্র',
                  type: 'text',
                  required: true,
                  admin: { width: '50%' },
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
                { name: 'gradeNote', label: 'মানের বিবরণ', type: 'text', admin: { width: '50%' } },
              ],
            },
          ],
        },
        { name: 'understanding', label: 'অন্য দলিলগুলো যেভাবে বোঝেন', type: 'textarea' },
        {
          name: 'citations',
          label: 'দলিল ট্যাগ',
          type: 'text',
          hasMany: true,
          admin: { description: 'যেমন: বুখারী : ৭৩৫' },
        },
      ],
    },
    {
      name: 'conduct',
      label: 'এই মতভেদে আমাদের আচরণ',
      type: 'array',
      minRows: 1,
      required: true,
      fields: [{ name: 'point', label: 'নির্দেশনা', type: 'textarea', required: true }],
    },
    dalilField('references', 'পূর্ণ তথ্যসূত্র'),
    {
      name: 'relatedTopics',
      label: 'সম্পর্কিত বিষয়',
      type: 'relationship',
      relationTo: 'ikhtilaf-topics',
      hasMany: true,
      maxRows: 6,
    },
    slugField({ prefix: 'ikhtilaf' }),
    levelField(),
    publishedAtField,
    {
      name: 'reviewNote',
      label: 'রিভিউ নোট (পাবলিক)',
      type: 'text',
      admin: { position: 'sidebar', placeholder: 'দুই ভিন্ন ধারার দুইজন আলিম রিভিউ করেছেন' },
    },
    {
      name: 'reviewedBy',
      label: 'রিভিউ করেছেন',
      type: 'relationship',
      relationTo: 'people',
      hasMany: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'readingTime',
      label: 'পড়ার সময়',
      type: 'number',
      admin: { position: 'sidebar', readOnly: true },
    },
    ...workflowFields(),
    searchTextField,
  ],
}
