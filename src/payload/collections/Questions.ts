import type { CollectionConfig, Where } from 'payload'

import { DISTRICT_OPTIONS } from '@/lib/districts'
import { lexicalToPlainText, type LexicalState } from '@/lib/lexical'
import { TAGS } from '@/server/cache/tags'
import { can } from '@/server/permissions'
import { recountCategory, recountPerson } from '@/server/services/counters'

import { atLevel, fieldAbility, menuAccess, menuRead } from '../access/permissions'
import { dalilField, publishedAtField, searchTextField, slugField } from '../fields'
import { revalidateCollection } from '../hooks/revalidate'
import { livePreviewUrl, previewUrl } from '../preview'
import { workflowFields } from '../workflow/fields'
import { WORKFLOW_HASH_FIELDS } from '../workflow/hash-fields'
import { workflowAfterChange, workflowBeforeChange } from '../workflow/hooks'
import { fillReviewedBy } from '../workflow/reviewed-by'
import { ownDraftEdit } from './Articles'

const HASH_FIELDS = WORKFLOW_HASH_FIELDS.questions

const idOf = (v: unknown) =>
  v && typeof v === 'object' && 'id' in v
    ? (v as { id: number }).id
    : (v as number | null | undefined)

/**
 * Members see published answers and their own questions; "নিজের" adds the questions given to them
 * and their own drafts; "দেখা" or more, everything (রোল ও অনুমতি page).
 */
const read = menuRead('questions', {
  publicWhere: { _status: { equals: 'published' } },
  ownField: 'askedBy',
  ownWhere: (id): Where => ({
    or: [{ assignedTo: { equals: id } }, { createdBy: { equals: id } }],
  }),
})

/** "নিজের": a question given to them, or their own draft (or one sent back). */
const ownEdit = (id: number | string): Where => ({
  or: [{ assignedTo: { equals: id } }, ownDraftEdit(id)],
})

const revalidate = revalidateCollection('questions', {
  extraTags: (doc) => [
    TAGS.collection('categories'),
    ...(idOf(doc.answeredBy) ? [TAGS.doc('people', idOf(doc.answeredBy)!)] : []),
  ],
})

export const MODERATION_OPTIONS = [
  { label: 'অপেক্ষমাণ', value: 'pending' },
  { label: 'উত্তরের জন্য গৃহীত', value: 'accepted' },
  { label: 'প্রত্যাখ্যাত', value: 'rejected' },
  { label: 'আগে উত্তর দেওয়া হয়েছে', value: 'duplicate' },
]

/**
 * Member questions answered by the scholar panel. The answer goes through the
 * same two-reviewer workflow as articles before it becomes public.
 */
export const Questions: CollectionConfig = {
  slug: 'questions',
  labels: { singular: 'প্রশ্ন', plural: 'প্রশ্নোত্তর' },
  admin: {
    group: 'প্রশ্নোত্তর',
    useAsTitle: 'title',
    defaultColumns: ['title', 'moderation', 'assignedTo', 'reviewStatus', '_status', 'createdAt'],
    listSearchableFields: ['title'],
    livePreview: { url: livePreviewUrl('questions') },
    preview: previewUrl('questions'),
  },
  defaultSort: '-createdAt',
  versions: { drafts: { autosave: { interval: 1500 }, validate: false }, maxPerDoc: 30 },
  access: {
    read,
    readVersions: atLevel('questions', 'view'),
    // members ask through the Q&A service (/api/v1/questions), never raw REST
    ...menuAccess('questions', { ownUpdate: ownEdit }),
  },
  hooks: {
    beforeChange: [
      workflowBeforeChange(HASH_FIELDS),
      async ({ data, originalDoc, operation, req, context }) => {
        if (context.questionIntake && operation === 'create') data.createdBy = null
        // the first staff member who works on the answer becomes its author
        if (
          !data.createdBy &&
          !context.questionIntake &&
          req.user &&
          data.answer &&
          (await can(req.user, 'questions.answer'))
        ) {
          data.createdBy = req.user.id
        }
        const answerText = lexicalToPlainText((data.answer ?? originalDoc?.answer) as LexicalState)
        data.searchText = [
          data.title ?? originalDoc?.title,
          data.body ?? originalDoc?.body,
          answerText,
        ]
          .filter(Boolean)
          .join('\n')
          .slice(0, 40000)
        data.answerExcerpt = answerText.replace(/\s+/g, ' ').slice(0, 220)
        return data
      },
      fillReviewedBy,
    ],
    afterChange: [
      workflowAfterChange('questions'),
      revalidate.afterChange,
      async ({ doc, previousDoc, req, context }) => {
        if (context.skipCounters) return doc
        if (doc._status !== 'published' && previousDoc?._status !== 'published') return doc
        for (const c of new Set([idOf(doc.category), idOf(previousDoc?.category)].filter(Boolean)))
          await recountCategory(req.payload, c!, req)
        const people = new Set(
          [idOf(doc.answeredBy), ...((doc.reviewedBy as unknown[]) ?? []).map(idOf)].filter(
            Boolean,
          ),
        )
        for (const p of people) await recountPerson(req.payload, p!, req)
        return doc
      },
    ],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'প্রশ্ন',
          fields: [
            { name: 'title', label: 'প্রশ্ন (এক লাইনে)', type: 'text', required: true },
            { name: 'body', label: 'বিস্তারিত', type: 'textarea' },
            {
              type: 'row',
              fields: [
                {
                  name: 'category',
                  label: 'বিষয়',
                  type: 'relationship',
                  relationTo: 'categories',
                  required: true,
                  index: true,
                  filterOptions: { usedFor: { contains: 'questions' } },
                  admin: { width: '50%' },
                },
                { name: 'subTopic', label: 'উপবিষয়', type: 'text', admin: { width: '50%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'askedBy',
                  label: 'প্রশ্নকারী',
                  type: 'relationship',
                  relationTo: 'users',
                  index: true,
                  admin: { width: '40%', readOnly: true },
                },
                {
                  name: 'anonymous',
                  label: 'নাম প্রকাশে অনিচ্ছুক',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: { width: '30%' },
                },
                {
                  name: 'askerDistrict',
                  label: 'প্রশ্নকারীর জেলা',
                  type: 'select',
                  options: DISTRICT_OPTIONS,
                  admin: { width: '30%' },
                },
              ],
            },
          ],
        },
        {
          label: 'উত্তর',
          fields: [
            {
              name: 'answeredBy',
              label: 'উত্তর দিয়েছেন',
              type: 'relationship',
              relationTo: 'people',
              index: true,
              access: {
                update: fieldAbility('questions.answer'),
                create: fieldAbility('questions.answer'),
              },
            },
            {
              name: 'answer',
              label: 'উত্তর',
              type: 'richText',
              access: {
                update: fieldAbility('questions.answer'),
                create: fieldAbility('questions.answer'),
              },
            },
            dalilField('references', 'দলিল ও তথ্যসূত্র'),
            {
              name: 'relatedQuestions',
              label: 'সম্পর্কিত প্রশ্ন',
              type: 'relationship',
              relationTo: 'questions',
              hasMany: true,
              maxRows: 6,
            },
          ],
        },
      ],
    },
    slugField({ prefix: 'question' }),
    {
      name: 'moderation',
      label: 'মডারেশন',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: MODERATION_OPTIONS,
      admin: { position: 'sidebar' },
    },
    {
      name: 'moderationNote',
      label: 'মডারেশন নোট (প্রশ্নকারী দেখবেন)',
      type: 'textarea',
      admin: { position: 'sidebar' },
    },
    {
      name: 'assignedTo',
      label: 'উত্তরদাতা অ্যাকাউন্ট',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      filterOptions: () => ({
        role: { in: ['author', 'reviewer', 'shura', 'super_admin', 'editor'] },
      }),
      admin: { position: 'sidebar' },
    },
    publishedAtField,
    {
      name: 'reviewedBy',
      label: 'রিভিউ করেছেন',
      type: 'relationship',
      relationTo: 'people',
      hasMany: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    { name: 'answerExcerpt', type: 'text', admin: { hidden: true } },
    {
      name: 'helpfulYes',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'helpfulNo',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
    ...workflowFields(),
    searchTextField,
  ],
}
