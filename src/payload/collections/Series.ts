import type { CollectionConfig } from 'payload'

import { TAGS } from '@/server/cache/tags'
import { recountPerson } from '@/server/services/counters'

import { anyone } from '../access'
import { menuAccess } from '../access/permissions'
import { slugField } from '../fields'
import { revalidateCollection } from '../hooks/revalidate'

const idOf = (v: unknown) =>
  v && typeof v === 'object' && 'id' in v
    ? (v as { id: number }).id
    : (v as number | null | undefined)

const revalidate = revalidateCollection('series', {
  extraTags: (doc) => (idOf(doc.author) ? [TAGS.doc('people', idOf(doc.author)!)] : []),
})

/** A run of articles by one writer, shown on author profiles (“ধারাবাহিক”). */
export const Series: CollectionConfig = {
  slug: 'series',
  labels: { singular: 'ধারাবাহিক', plural: 'ধারাবাহিক' },
  admin: {
    group: 'ইলম কেন্দ্র',
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'articleCount'],
  },
  access: { read: anyone, ...menuAccess('series') },
  hooks: {
    afterChange: [
      revalidate.afterChange,
      async ({ doc, previousDoc, req, context }) => {
        if (context.skipCounters) return doc
        for (const p of new Set([idOf(doc.author), idOf(previousDoc?.author)].filter(Boolean)))
          await recountPerson(req.payload, p!, req)
        return doc
      },
    ],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    { name: 'title', label: 'নাম', type: 'text', required: true },
    slugField({ prefix: 'series' }),
    { name: 'description', label: 'বিবরণ', type: 'textarea' },
    {
      name: 'author',
      label: 'লেখক',
      type: 'relationship',
      relationTo: 'people',
      required: true,
      index: true,
    },
    { name: 'plannedParts', label: 'মোট পর্ব (পরিকল্পিত)', type: 'number' },
    {
      name: 'articleCount',
      label: 'প্রকাশিত পর্ব',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
