import type { Access, CollectionConfig, Where } from 'payload'

import { hasRole, MODERATOR_ROLES, STAFF_ROLES } from '@/lib/roles'
import { atLeast } from '@/lib/permissions'
import { TAGS } from '@/server/cache/tags'
import { can, levelOf } from '@/server/permissions'
import { recountForumCategory, recountPostHelpful, recountThread } from '@/server/services/counters'

import { adminsOnly, anyone, ownOrRoles } from '../access'
import { atLevel, menuAccess } from '../access/permissions'
import { safeRevalidate } from '../hooks/revalidate'
import { slugField } from '../fields'

const idOf = (v: unknown) =>
  v && typeof v === 'object' && 'id' in v
    ? (v as { id: number }).id
    : (v as number | null | undefined)
const hidden = ({ user }: { user: unknown }) => !hasRole(user as { role?: unknown }, ...STAFF_ROLES)

/** Members see published, non-deleted content plus their own pending posts; moderators see everything. */
const forumRead =
  (slug: string): Access =>
  async ({ req }) => {
    if (await can(req.user, 'forum.moderate')) return true
    if (atLeast(await levelOf(req.user, slug), 'view')) return true
    const visible: Where = {
      and: [{ status: { equals: 'published' } }, { deletedAt: { exists: false } }],
    }
    if (req.user)
      return {
        or: [
          visible,
          { and: [{ author: { equals: req.user.id } }, { deletedAt: { exists: false } }] },
        ],
      } as Where
    return visible
  }

export const ForumCategories: CollectionConfig = {
  slug: 'forum-categories',
  labels: { singular: 'ফোরাম বিভাগ', plural: 'ফোরাম বিভাগ' },
  admin: {
    group: 'ফোরাম',
    useAsTitle: 'name',
    defaultColumns: ['name', 'threadCount', 'order'],
    hidden,
  },
  defaultSort: 'order',
  access: { read: anyone, ...menuAccess('forum-categories') },
  hooks: {
    afterChange: [({ doc }) => (safeRevalidate([TAGS.collection('forum-categories')]), doc)],
  },
  fields: [
    { name: 'name', label: 'নাম', type: 'text', required: true },
    slugField({ from: 'name', prefix: 'forum' }),
    { name: 'description', label: 'বিবরণ', type: 'textarea' },
    { name: 'order', label: 'ক্রম', type: 'number', defaultValue: 0 },
    {
      name: 'threadCount',
      label: 'আলোচনা',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
  ],
}

const FORUM_STATUS = [
  { label: 'প্রকাশিত', value: 'published' },
  { label: 'মডারেশনে', value: 'pending' },
  { label: 'লুকানো (রিপোর্টের কারণে)', value: 'hidden' },
  { label: 'সরানো হয়েছে', value: 'removed' },
]

export const ForumThreads: CollectionConfig = {
  slug: 'forum-threads',
  labels: { singular: 'আলোচনা', plural: 'ফোরাম আলোচনা' },
  admin: {
    group: 'ফোরাম',
    useAsTitle: 'title',
    defaultColumns: [
      'title',
      'category',
      'author',
      'status',
      'replyCount',
      'reportCount',
      'lastActivityAt',
    ],
    hidden,
  },
  defaultSort: '-lastActivityAt',
  access: {
    read: forumRead('forum-threads'),
    // members post through the forum service so moderation rules always apply
    ...menuAccess('forum-threads'),
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req, context }) => {
        if (
          !context.skipCounters &&
          (doc.status !== previousDoc?.status || idOf(doc.category) !== idOf(previousDoc?.category))
        ) {
          for (const c of new Set(
            [idOf(doc.category), idOf(previousDoc?.category)].filter(Boolean),
          ))
            await recountForumCategory(req.payload, c!, req)
        }
        safeRevalidate([TAGS.collection('forum-threads'), TAGS.doc('forum-threads', doc.id)])
        return doc
      },
    ],
  },
  fields: [
    { name: 'title', label: 'শিরোনাম', type: 'text', required: true, maxLength: 180 },
    slugField({ prefix: 'thread', unique: false }),
    {
      name: 'category',
      label: 'বিভাগ',
      type: 'relationship',
      relationTo: 'forum-categories',
      required: true,
      index: true,
    },
    // empty only after the author deletes their account (shown as "অজ্ঞাত সদস্য"); the forum service always sets it
    { name: 'author', label: 'লেখক', type: 'relationship', relationTo: 'users', index: true },
    { name: 'anonymous', label: 'নাম প্রকাশে অনিচ্ছুক', type: 'checkbox', defaultValue: false },
    { name: 'body', label: 'বিস্তারিত', type: 'textarea', required: true, maxLength: 8000 },
    {
      name: 'status',
      label: 'অবস্থা',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: FORUM_STATUS,
      admin: { position: 'sidebar' },
    },
    {
      name: 'flagReasons',
      label: 'স্বয়ংক্রিয় ফ্ল্যাগের কারণ',
      type: 'text',
      hasMany: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'pinned',
      label: 'পিন করা',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'locked',
      label: 'নতুন উত্তর বন্ধ',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'helpfulPost',
      label: 'সহায়ক উত্তর',
      type: 'relationship',
      relationTo: 'forum-posts',
      admin: { position: 'sidebar' },
    },
    {
      name: 'modNote',
      label: 'মডারেটর নোট',
      type: 'group',
      fields: [
        { name: 'text', label: 'নোট', type: 'textarea' },
        { name: 'by', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
        { name: 'at', type: 'date', admin: { readOnly: true } },
      ],
    },
    {
      name: 'replyCount',
      type: 'number',
      defaultValue: 0,
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'viewCount',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'reportCount',
      type: 'number',
      defaultValue: 0,
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'lastActivityAt',
      type: 'date',
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'lastReplyBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'deletedAt',
      label: 'মুছে ফেলা হয়েছে',
      type: 'date',
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'deletedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}

export const ForumPosts: CollectionConfig = {
  slug: 'forum-posts',
  labels: { singular: 'উত্তর', plural: 'ফোরাম উত্তর' },
  admin: {
    group: 'ফোরাম',
    defaultColumns: ['thread', 'author', 'status', 'helpfulCount', 'reportCount', 'createdAt'],
    hidden,
  },
  defaultSort: 'createdAt',
  access: { read: forumRead('forum-posts'), ...menuAccess('forum-posts') },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req, context }) => {
        if (!context.skipCounters && doc.status !== previousDoc?.status)
          await recountThread(req.payload, idOf(doc.thread)!, req)
        safeRevalidate([TAGS.doc('forum-threads', idOf(doc.thread)!)])
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'thread',
      type: 'relationship',
      relationTo: 'forum-threads',
      required: true,
      index: true,
    },
    {
      name: 'parent',
      label: 'যে উত্তরের জবাব',
      type: 'relationship',
      relationTo: 'forum-posts',
      index: true,
    },
    { name: 'author', type: 'relationship', relationTo: 'users', index: true },
    { name: 'body', label: 'লেখা', type: 'textarea', required: true, maxLength: 6000 },
    { name: 'arabic', label: 'আরবি উদ্ধৃতি', type: 'text' },
    { name: 'reference', label: 'সূত্র', type: 'text' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'published',
      index: true,
      options: FORUM_STATUS,
      admin: { position: 'sidebar' },
    },
    {
      name: 'flagReasons',
      type: 'text',
      hasMany: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'helpfulCount',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'markedHelpful',
      label: 'আলোচনা শুরুকারী সহায়ক চিহ্নিত করেছেন',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'reportCount',
      type: 'number',
      defaultValue: 0,
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    { name: 'removedReason', label: 'সরানোর কারণ', type: 'text', admin: { position: 'sidebar' } },
    { name: 'deletedAt', type: 'date', index: true, admin: { position: 'sidebar' } },
    {
      name: 'deletedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}

export const ForumReactions: CollectionConfig = {
  slug: 'forum-reactions',
  labels: { singular: 'সহায়ক চিহ্ন', plural: 'সহায়ক চিহ্ন' },
  admin: { group: 'ফোরাম', hidden: true },
  access: {
    read: ownOrRoles('user', ...MODERATOR_ROLES),
    create: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  hooks: {
    afterChange: [
      async ({ doc, req }) => (await recountPostHelpful(req.payload, idOf(doc.post)!, req), doc),
    ],
    afterDelete: [
      async ({ doc, req }) => (await recountPostHelpful(req.payload, idOf(doc.post)!, req), doc),
    ],
  },
  fields: [
    { name: 'post', type: 'relationship', relationTo: 'forum-posts', required: true, index: true },
    {
      name: 'thread',
      type: 'relationship',
      relationTo: 'forum-threads',
      required: true,
      index: true,
    },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
  ],
  indexes: [{ fields: ['post', 'user'], unique: true }],
}

export const REPORT_REASONS = [
  { label: 'কটাক্ষ বা অসম্মানজনক ভাষা', value: 'disrespect' },
  { label: 'উৎসবিহীন বা ভুল দলিল', value: 'unsourced' },
  { label: 'দলীয় বা রাজনৈতিক প্রচারণা', value: 'partisan' },
  { label: 'স্প্যাম বা বিজ্ঞাপন', value: 'spam' },
]

export const Reports: CollectionConfig = {
  slug: 'reports',
  labels: { singular: 'রিপোর্ট', plural: 'মডারেশন কিউ' },
  admin: {
    group: 'ফোরাম',
    defaultColumns: ['targetType', 'reason', 'status', 'createdAt'],
    description: 'রিপোর্টকারীর পরিচয় শুধু মডারেটররা দেখতে পান।',
    hidden,
  },
  defaultSort: '-createdAt',
  access: { read: atLevel('reports', 'view'), ...menuAccess('reports') },
  fields: [
    {
      name: 'targetType',
      label: 'ধরন',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'আলোচনা', value: 'thread' },
        { label: 'উত্তর', value: 'post' },
      ],
    },
    { name: 'thread', type: 'relationship', relationTo: 'forum-threads', index: true },
    { name: 'post', type: 'relationship', relationTo: 'forum-posts', index: true },
    { name: 'reporter', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'reason', label: 'কারণ', type: 'select', required: true, options: REPORT_REASONS },
    { name: 'note', label: 'বিবরণ', type: 'textarea' },
    {
      name: 'status',
      label: 'অবস্থা',
      type: 'select',
      required: true,
      defaultValue: 'open',
      index: true,
      options: [
        { label: 'খোলা', value: 'open' },
        { label: 'ব্যবস্থা নেওয়া হয়েছে', value: 'actioned' },
        { label: 'বাতিল', value: 'dismissed' },
      ],
    },
    { name: 'resolution', label: 'সিদ্ধান্তের নোট', type: 'textarea' },
    { name: 'resolvedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
    { name: 'resolvedAt', type: 'date', admin: { readOnly: true } },
  ],
}
