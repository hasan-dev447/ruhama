import type { Access, CollectionConfig, Where } from 'payload'

import { DISTRICT_OPTIONS } from '@/lib/districts'
import { lexicalToPlainText, type LexicalState } from '@/lib/lexical'
import { CONTENT_ROLES, hasRole, STAFF_ROLES } from '@/lib/roles'
import { TAGS } from '@/server/cache/tags'
import { recountCategory, recountPerson } from '@/server/services/counters'

import { fieldRoles } from '../access'
import { dalilField, publishedAtField, searchTextField, slugField } from '../fields'
import { revalidateCollection } from '../hooks/revalidate'
import { livePreviewUrl, previewUrl } from '../preview'
import { workflowFields } from '../workflow/fields'
import { WORKFLOW_HASH_FIELDS } from '../workflow/hash-fields'
import { workflowAfterChange, workflowBeforeChange } from '../workflow/hooks'
import { fillReviewedBy } from '../workflow/reviewed-by'

const HASH_FIELDS = WORKFLOW_HASH_FIELDS.questions

const idOf = (v: unknown) =>
  v && typeof v === 'object' && 'id' in v
    ? (v as { id: number }).id
    : (v as number | null | undefined)

const read: Access = ({ req }) => {
  if (hasRole(req.user, ...STAFF_ROLES)) return true
  if (req.user)
    return {
      or: [{ _status: { equals: 'published' } }, { askedBy: { equals: req.user.id } }],
    } as Where
  return { _status: { equals: 'published' } }
}

const update: Access = ({ req }) => {
  if (hasRole(req.user, 'super_admin', 'shura', 'editor', 'moderator')) return true
  if (hasRole(req.user, 'author', 'reviewer')) {
    return {
      or: [
        { assignedTo: { equals: req.user!.id } },
        {
          and: [
            { createdBy: { equals: req.user!.id } },
            { reviewStatus: { in: ['draft', 'needs_changes'] } },
          ],
        },
      ],
    } as Where
  }
  return false
}

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
    hidden: ({ user }) => !hasRole(user, ...STAFF_ROLES),
    livePreview: { url: livePreviewUrl('questions') },
    preview: previewUrl('questions'),
  },
  defaultSort: '-createdAt',
  versions: { drafts: { autosave: { interval: 1500 }, validate: false }, maxPerDoc: 30 },
  access: {
    read,
    readVersions: ({ req }) => hasRole(req.user, ...STAFF_ROLES),
    // members ask through the Q&A service (/api/v1/questions), never raw REST
    create: ({ req }) => hasRole(req.user, ...CONTENT_ROLES),
    update,
    delete: ({ req }) => hasRole(req.user, 'super_admin', 'shura', 'editor'),
  },
  hooks: {
    beforeChange: [
      workflowBeforeChange(HASH_FIELDS),
      ({ data, originalDoc, operation, req, context }) => {
        if (context.questionIntake && operation === 'create') data.createdBy = null
        // the first staff member who works on the answer becomes its author
        if (
          !data.createdBy &&
          !context.questionIntake &&
          req.user &&
          hasRole(req.user, ...CONTENT_ROLES) &&
          data.answer
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
                update: fieldRoles(...CONTENT_ROLES),
                create: fieldRoles(...CONTENT_ROLES),
              },
            },
            {
              name: 'answer',
              label: 'উত্তর',
              type: 'richText',
              access: {
                update: fieldRoles(...CONTENT_ROLES),
                create: fieldRoles(...CONTENT_ROLES),
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
