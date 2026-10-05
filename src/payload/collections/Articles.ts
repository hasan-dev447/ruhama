import type { Access, CollectionConfig, Where } from 'payload'

import { lexicalToPlainText, readingMinutes, type LexicalState } from '@/lib/lexical'
import { CONTENT_ROLES, hasRole, STAFF_ROLES } from '@/lib/roles'
import { TAGS } from '@/server/cache/tags'
import { recountCategory, recountPerson } from '@/server/services/counters'

import {
  dalilField,
  levelField,
  publishedAtField,
  searchTextField,
  slugField,
  tintField,
} from '../fields'
import { revalidateCollection } from '../hooks/revalidate'
import { livePreviewUrl, previewUrl } from '../preview'
import { workflowFields } from '../workflow/fields'
import { WORKFLOW_HASH_FIELDS } from '../workflow/hash-fields'
import { workflowAfterChange, workflowBeforeChange } from '../workflow/hooks'
import { fillReviewedBy } from '../workflow/reviewed-by'

const HASH_FIELDS = WORKFLOW_HASH_FIELDS.articles

const idOf = (v: unknown) =>
  v && typeof v === 'object' && 'id' in v
    ? (v as { id: number }).id
    : (v as number | null | undefined)

/** Authors see published work plus their own drafts; other staff see everything. */
export const contentRead: Access = ({ req }) => {
  if (hasRole(req.user, 'super_admin', 'shura', 'editor', 'reviewer', 'moderator')) return true
  if (hasRole(req.user, 'author')) {
    return {
      or: [{ _status: { equals: 'published' } }, { createdBy: { equals: req.user!.id } }],
    } as Where
  }
  return { _status: { equals: 'published' } }
}

/** Authors edit only their own drafts (or drafts sent back for changes). */
export const contentUpdate: Access = ({ req }) => {
  if (hasRole(req.user, 'super_admin', 'shura', 'editor')) return true
  if (hasRole(req.user, 'author')) {
    return {
      and: [
        { createdBy: { equals: req.user!.id } },
        { reviewStatus: { in: ['draft', 'needs_changes'] } },
      ],
    } as Where
  }
  return false
}

export const contentDelete: Access = ({ req }) => {
  if (hasRole(req.user, 'super_admin', 'shura', 'editor')) return true
  if (hasRole(req.user, 'author')) {
    return {
      and: [
        { createdBy: { equals: req.user!.id } },
        { reviewStatus: { equals: 'draft' } },
        { _status: { equals: 'draft' } },
      ],
    } as Where
  }
  return false
}

const revalidate = revalidateCollection('articles', {
  extraTags: (doc) => [
    TAGS.home,
    TAGS.collection('categories'),
    TAGS.collection('people'),
    ...(idOf(doc.author) ? [TAGS.doc('people', idOf(doc.author)!)] : []),
  ],
})

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: 'প্রবন্ধ', plural: 'প্রবন্ধ' },
  admin: {
    group: 'ইলম কেন্দ্র',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'author', 'reviewStatus', '_status', 'updatedAt'],
    listSearchableFields: ['title', 'slug'],
    hidden: ({ user }) => !hasRole(user, ...STAFF_ROLES),
    livePreview: { url: livePreviewUrl('articles') },
    preview: previewUrl('articles'),
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
        const content = (data.content ?? originalDoc?.content) as LexicalState
        const body = lexicalToPlainText(content)
        const title = String(data.title ?? originalDoc?.title ?? '')
        const excerpt = String(data.excerpt ?? originalDoc?.excerpt ?? '')
        data.readingTime = readingMinutes(title, excerpt, body)
        data.searchText = [title, excerpt, body].join('\n').slice(0, 60000)
        return data
      },
    ],
    afterChange: [
      workflowAfterChange('articles'),
      revalidate.afterChange,
      async ({ doc, previousDoc, req, context }) => {
        if (context.skipCounters) return doc
        const published = doc._status === 'published' || previousDoc?._status === 'published'
        if (!published) return doc
        const cats = new Set([idOf(doc.category), idOf(previousDoc?.category)].filter(Boolean))
        for (const c of cats) await recountCategory(req.payload, c!, req)
        const people = new Set(
          [
            idOf(doc.author),
            idOf(previousDoc?.author),
            ...((doc.reviewedBy as unknown[]) ?? []).map(idOf),
          ].filter(Boolean),
        )
        for (const p of people) await recountPerson(req.payload, p!, req)
        return doc
      },
    ],
    afterDelete: [
      revalidate.afterDelete,
      async ({ doc, req }) => {
        if (idOf(doc.category)) await recountCategory(req.payload, idOf(doc.category)!, req)
        if (idOf(doc.author)) await recountPerson(req.payload, idOf(doc.author)!, req)
        return doc
      },
    ],
  },
  fields: [
    { name: 'title', label: 'শিরোনাম', type: 'text', required: true },
    {
      name: 'excerpt',
      label: 'সারসংক্ষেপ (লিড)',
      type: 'textarea',
      required: true,
      maxLength: 400,
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'লেখা',
          fields: [
            { name: 'content', label: 'মূল লেখা', type: 'richText', required: true },
            dalilField('references', 'দলিল ও তথ্যসূত্র'),
          ],
        },
        {
          label: 'শ্রেণিবিন্যাস',
          fields: [
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
                  filterOptions: { usedFor: { contains: 'articles' } },
                  admin: { width: '50%' },
                },
                {
                  name: 'author',
                  label: 'লেখক',
                  type: 'relationship',
                  relationTo: 'people',
                  required: true,
                  index: true,
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'tags',
              label: 'ট্যাগ',
              type: 'relationship',
              relationTo: 'tags',
              hasMany: true,
              index: true,
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'series',
                  label: 'ধারাবাহিক',
                  type: 'relationship',
                  relationTo: 'series',
                  index: true,
                  admin: { width: '60%' },
                },
                {
                  name: 'seriesOrder',
                  label: 'পর্ব নম্বর',
                  type: 'number',
                  admin: { width: '40%' },
                },
              ],
            },
            {
              name: 'relatedArticles',
              label: 'সম্পর্কিত প্রবন্ধ (ঐচ্ছিক)',
              type: 'relationship',
              relationTo: 'articles',
              hasMany: true,
              maxRows: 6,
            },
            {
              name: 'coverImage',
              label: 'প্রচ্ছদ ছবি (ঐচ্ছিক)',
              type: 'upload',
              relationTo: 'media',
            },
          ],
        },
      ],
    },
    slugField({ prefix: 'article' }),
    levelField(),
    tintField([
      { label: 'সেজ', value: 'sage' },
      { label: 'গোল্ড', value: 'gold' },
      { label: 'টিল', value: 'teal' },
    ]),
    publishedAtField,
    {
      name: 'reviewedBy',
      label: 'রিভিউ করেছেন (স্বয়ংক্রিয়)',
      type: 'relationship',
      relationTo: 'people',
      hasMany: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'readingTime',
      label: 'পড়ার সময় (মিনিট)',
      type: 'number',
      admin: { position: 'sidebar', readOnly: true },
    },
    ...workflowFields(),
    searchTextField,
  ],
}
