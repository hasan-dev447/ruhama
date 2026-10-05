import type { CollectionConfig } from 'payload'

import { hasRole, STAFF_ROLES } from '@/lib/roles'
import { TAGS } from '@/server/cache/tags'
import { recountCategory, recountPerson, recountPlaylist } from '@/server/services/counters'

import { contentTeam, editorsOnly, statusPublishedOrStaff } from '../access'
import { dalilField, levelField, publishedAtField, searchTextField, slugField } from '../fields'
import { revalidateCollection } from '../hooks/revalidate'
import { previewUrl } from '../preview'
import { PUBLISH_STATUS } from './Courses'

const idOf = (v: unknown) =>
  v && typeof v === 'object' && 'id' in v
    ? (v as { id: number }).id
    : (v as number | null | undefined)

export const VIDEO_TINTS = [
  { label: 'টিল', value: 'teal' },
  { label: 'গাঢ় সবুজ', value: 'deep' },
  { label: 'আম্বার', value: 'umber' },
  { label: 'স্লেট', value: 'slate' },
]

/** Accepts a full YouTube URL or a bare 11-character id and stores the id. */
export function parseYouTubeId(input: string): string | null {
  const v = input.trim()
  if (/^[\w-]{11}$/.test(v)) return v
  try {
    const url = new URL(v)
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1, 12) || null
    const id = url.searchParams.get('v')
    if (id && /^[\w-]{11}$/.test(id)) return id
    const m = url.pathname.match(/\/(embed|shorts|live)\/([\w-]{11})/)
    return m?.[2] ?? null
  } catch {
    return null
  }
}

const revalidate = revalidateCollection('videos', {
  isPublic: (d) => d.status === 'published',
  extraTags: (doc) => [
    TAGS.collection('playlists'),
    ...(idOf(doc.speaker) ? [TAGS.doc('people', idOf(doc.speaker)!)] : []),
    ...(idOf(doc.playlist) ? [TAGS.doc('playlists', idOf(doc.playlist)!)] : []),
  ],
})

export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: { singular: 'ভিডিও', plural: 'ভিডিও' },
  admin: {
    group: 'ভিডিও',
    useAsTitle: 'title',
    defaultColumns: ['title', 'speaker', 'category', 'playlist', 'status'],
    hidden: ({ user }) => !hasRole(user, ...STAFF_ROLES),
    preview: previewUrl('videos'),
  },
  defaultSort: '-publishedAt',
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
        if (typeof data.youtubeId === 'string')
          data.youtubeId = parseYouTubeId(data.youtubeId) ?? data.youtubeId
        const chapters = ((data.chapters ?? originalDoc?.chapters) as { title?: string }[]) ?? []
        data.searchText = [
          data.title ?? originalDoc?.title,
          data.description ?? originalDoc?.description,
          ...chapters.map((c) => c.title),
        ]
          .filter(Boolean)
          .join('\n')
        return data
      },
    ],
    afterChange: [
      revalidate.afterChange,
      async ({ doc, previousDoc, req, context }) => {
        if (context.skipCounters) return doc
        for (const p of new Set([idOf(doc.speaker), idOf(previousDoc?.speaker)].filter(Boolean)))
          await recountPerson(req.payload, p!, req)
        for (const p of new Set([idOf(doc.playlist), idOf(previousDoc?.playlist)].filter(Boolean)))
          await recountPlaylist(req.payload, p!, req)
        for (const c of new Set([idOf(doc.category), idOf(previousDoc?.category)].filter(Boolean)))
          await recountCategory(req.payload, c!, req)
        return doc
      },
    ],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    { name: 'title', label: 'শিরোনাম', type: 'text', required: true },
    {
      name: 'shortTitle',
      label: 'থাম্বনেইলের ছোট শিরোনাম',
      type: 'text',
      admin: { description: 'খালি রাখলে মূল শিরোনাম দেখাবে।' },
    },
    {
      name: 'youtubeId',
      label: 'ইউটিউব লিংক বা আইডি',
      type: 'text',
      required: true,
      index: true,
      validate: (v: unknown) =>
        typeof v === 'string' && parseYouTubeId(v) ? true : 'সঠিক ইউটিউব লিংক দিন',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'speaker',
          label: 'বক্তা',
          type: 'relationship',
          relationTo: 'people',
          required: true,
          index: true,
          admin: { width: '50%' },
        },
        {
          name: 'category',
          label: 'বিষয়',
          type: 'relationship',
          relationTo: 'categories',
          required: true,
          index: true,
          filterOptions: { usedFor: { contains: 'videos' } },
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'playlist',
          label: 'প্লেলিস্ট',
          type: 'relationship',
          relationTo: 'playlists',
          index: true,
          admin: { width: '60%' },
        },
        { name: 'episode', label: 'পর্ব নম্বর', type: 'number', min: 1, admin: { width: '40%' } },
      ],
    },
    { name: 'durationSeconds', label: 'দৈর্ঘ্য (সেকেন্ড)', type: 'number', required: true, min: 1 },
    { name: 'description', label: 'বিবরণ', type: 'textarea' },
    {
      name: 'chapters',
      label: 'অধ্যায়',
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'start',
              label: 'শুরু (সেকেন্ড)',
              type: 'number',
              required: true,
              min: 0,
              admin: { width: '30%' },
            },
            {
              name: 'title',
              label: 'শিরোনাম',
              type: 'text',
              required: true,
              admin: { width: '70%' },
            },
          ],
        },
      ],
    },
    dalilField('references', 'লেকচারে উল্লিখিত দলিল'),
    {
      name: 'relatedArticles',
      label: 'সম্পর্কিত প্রবন্ধ',
      type: 'relationship',
      relationTo: 'articles',
      hasMany: true,
      maxRows: 4,
    },
    slugField({ prefix: 'video' }),
    levelField(),
    {
      name: 'tint',
      label: 'থাম্বনেইলের রং',
      type: 'select',
      defaultValue: 'teal',
      options: VIDEO_TINTS,
      admin: { position: 'sidebar' },
    },
    publishedAtField,
    {
      name: 'viewCount',
      label: 'দেখা হয়েছে',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'ইউটিউব থেকে হালনাগাদ করা সংখ্যা' },
    },
    {
      name: 'reviewed',
      label: 'রিভিউকৃত',
      type: 'checkbox',
      defaultValue: true,
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
    searchTextField,
  ],
}

export const Playlists: CollectionConfig = {
  slug: 'playlists',
  labels: { singular: 'প্লেলিস্ট', plural: 'প্লেলিস্ট' },
  admin: {
    group: 'ভিডিও',
    useAsTitle: 'title',
    defaultColumns: ['title', 'videoCount', 'order'],
    hidden: ({ user }) => !hasRole(user, ...STAFF_ROLES),
  },
  defaultSort: 'order',
  access: { read: () => true, create: contentTeam, update: contentTeam, delete: editorsOnly },
  hooks: {
    afterChange: [revalidateCollection('playlists').afterChange],
    afterDelete: [revalidateCollection('playlists').afterDelete],
  },
  fields: [
    { name: 'title', label: 'নাম', type: 'text', required: true },
    slugField({ prefix: 'playlist' }),
    { name: 'description', label: 'বিবরণ', type: 'textarea' },
    {
      name: 'speakerLabel',
      label: 'বক্তা (লেবেল)',
      type: 'text',
      admin: { placeholder: 'একাধিক বক্তা' },
    },
    levelField(false),
    { name: 'tint', label: 'রং', type: 'select', defaultValue: 'teal', options: VIDEO_TINTS },
    { name: 'order', label: 'ক্রম', type: 'number', defaultValue: 0 },
    {
      name: 'videoCount',
      label: 'ভিডিও সংখ্যা',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
  ],
}
