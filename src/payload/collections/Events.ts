import type { CollectionConfig, PayloadRequest } from 'payload'

import { DISTRICT_OPTIONS } from '@/lib/districts'
import { hasRole, STAFF_ROLES } from '@/lib/roles'
import { TAGS } from '@/server/cache/tags'
import { recountEvent, recountPerson } from '@/server/services/counters'

import { adminsOnly, editorsOnly, ownOrRoles, roles, statusPublishedOrStaff } from '../access'
import { searchTextField, slugField } from '../fields'
import { revalidateCollection, safeRevalidate } from '../hooks/revalidate'
import { previewUrl } from '../preview'
import { PUBLISH_STATUS } from './Courses'

const idOf = (v: unknown) =>
  v && typeof v === 'object' && 'id' in v
    ? (v as { id: number }).id
    : (v as number | null | undefined)

const revalidate = revalidateCollection('events', {
  isPublic: (d) => d.status === 'published',
  extraTags: (doc) => [
    TAGS.home,
    ...((doc.speakers as unknown[]) ?? []).map((s) => TAGS.doc('people', idOf(s)!)),
  ],
})

const eventStaff = roles('super_admin', 'shura', 'editor', 'moderator')

/** মজলিস: online or in-person gatherings with capacity-limited registration. */
export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'মজলিস', plural: 'মজলিস' },
  admin: {
    group: 'মজলিস ও সার্কেল',
    useAsTitle: 'title',
    defaultColumns: ['title', 'startsAt', 'mode', 'district', 'seatsTaken', 'capacity', 'status'],
    hidden: ({ user }) => !hasRole(user, ...STAFF_ROLES),
    preview: previewUrl('events'),
  },
  defaultSort: 'startsAt',
  versions: { maxPerDoc: 20 },
  access: {
    read: statusPublishedOrStaff(),
    create: eventStaff,
    update: eventStaff,
    delete: editorsOnly,
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        data.searchText = [
          data.title ?? originalDoc?.title,
          data.summary ?? originalDoc?.summary,
          data.venueName ?? originalDoc?.venueName,
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
        const ids = new Set(
          [...((doc.speakers as unknown[]) ?? []), ...((previousDoc?.speakers as unknown[]) ?? [])]
            .map(idOf)
            .filter(Boolean),
        )
        for (const p of ids) await recountPerson(req.payload, p!, req)
        if (doc.reservedSeats !== previousDoc?.reservedSeats)
          await recountEvent(req.payload, doc.id, req)
        return doc
      },
    ],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    { name: 'title', label: 'শিরোনাম', type: 'text', required: true },
    { name: 'summary', label: 'সংক্ষিপ্ত বিবরণ', type: 'textarea', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'startsAt',
          label: 'শুরু',
          type: 'date',
          required: true,
          index: true,
          admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'endsAt',
          label: 'শেষ',
          type: 'date',
          admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' } },
        },
      ],
    },
    {
      name: 'timeLabel',
      label: 'সময়ের বিবরণ (ঐচ্ছিক)',
      type: 'text',
      admin: {
        description: 'যেমন: বাদ আসর থেকে মাগরিব পর্যন্ত। খালি রাখলে সময় স্বয়ংক্রিয়ভাবে দেখাবে।',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'mode',
          label: 'ধরন',
          type: 'select',
          required: true,
          defaultValue: 'in_person',
          index: true,
          options: [
            { label: 'অনলাইন', value: 'online' },
            { label: 'সরাসরি', value: 'in_person' },
          ],
          admin: { width: '33%' },
        },
        {
          name: 'district',
          label: 'জেলা',
          type: 'select',
          options: DISTRICT_OPTIONS,
          index: true,
          admin: { width: '33%', condition: (d) => d?.mode === 'in_person' },
        },
        {
          name: 'category',
          label: 'বিষয়',
          type: 'relationship',
          relationTo: 'categories',
          index: true,
          admin: { width: '34%' },
        },
      ],
    },
    {
      name: 'venueName',
      label: 'ভেন্যুর নাম',
      type: 'text',
      admin: { condition: (d) => d?.mode === 'in_person' },
    },
    {
      name: 'venueAddress',
      label: 'ঠিকানা',
      type: 'textarea',
      admin: { condition: (d) => d?.mode === 'in_person' },
    },
    {
      name: 'mapUrl',
      label: 'ম্যাপ লিংক',
      type: 'text',
      admin: { condition: (d) => d?.mode === 'in_person' },
    },
    {
      name: 'onlineUrl',
      label: 'অনলাইন সেশনের লিংক',
      type: 'text',
      admin: {
        condition: (d) => d?.mode === 'online',
        description: 'শুধু রেজিস্টার করা ব্যক্তিরা ইমেইলে পাবেন; পাবলিক পাতায় দেখানো হয় না।',
      },
      access: { read: ({ req }) => hasRole(req.user, ...STAFF_ROLES) },
    },
    { name: 'audience', label: 'কাদের জন্য', type: 'textarea', defaultValue: 'সবার জন্য উন্মুক্ত' },
    {
      name: 'separateSeating',
      label: 'ভাই ও বোনদের আলাদা বসার ব্যবস্থা',
      type: 'checkbox',
      defaultValue: false,
    },
    { name: 'allowGuests', label: 'সঙ্গী আনার সুযোগ', type: 'checkbox', defaultValue: true },
    { name: 'description', label: 'মজলিস সম্পর্কে', type: 'richText' },
    {
      name: 'agenda',
      label: 'সূচি',
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'time', label: 'সময়', type: 'text', required: true, admin: { width: '30%' } },
            { name: 'item', label: 'বিষয়', type: 'text', required: true, admin: { width: '70%' } },
          ],
        },
      ],
    },
    {
      name: 'speakers',
      label: 'আলোচক',
      type: 'relationship',
      relationTo: 'people',
      hasMany: true,
      index: true,
    },
    {
      name: 'speakerNotes',
      label: 'আলোচকের ভূমিকা (ঐচ্ছিক)',
      type: 'array',
      admin: { description: 'যেমন: “বোনদের অংশে আলোচনা”। আলোচকের ক্রম অনুযায়ী।' },
      fields: [{ name: 'note', type: 'text' }],
    },
    slugField({ prefix: 'majlis' }),
    {
      name: 'capacity',
      label: 'আসন সংখ্যা',
      type: 'number',
      required: true,
      min: 1,
      defaultValue: 100,
      admin: { position: 'sidebar' },
    },
    {
      name: 'reservedSeats',
      label: 'আগে থেকে সংরক্ষিত আসন',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        position: 'sidebar',
        description: 'মসজিদ বা সহযোগী প্রতিষ্ঠানের মাধ্যমে অফলাইনে নিশ্চিত আসন।',
      },
    },
    {
      name: 'registrationOpen',
      label: 'রেজিস্ট্রেশন চালু',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'isFree',
      label: 'বিনামূল্যে',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'circle',
      label: 'সার্কেল (ঐচ্ছিক)',
      type: 'relationship',
      relationTo: 'circles',
      index: true,
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
      name: 'seatsTaken',
      label: 'পূর্ণ আসন',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'registrationCount',
      label: 'রেজিস্ট্রেশন',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
    { name: 'reminderSentAt', type: 'date', admin: { position: 'sidebar', readOnly: true } },
    searchTextField,
  ],
}

/** Refresh the cached page of one event (tagged by slug) and the listings after its seats changed. */
async function refreshEventPages(req: PayloadRequest, eventId: number | string) {
  const ev = await req.payload.findByID({
    collection: 'events',
    id: eventId,
    select: { slug: true },
    depth: 0,
    overrideAccess: true,
    req,
    disableErrors: true,
  })
  safeRevalidate([
    TAGS.collection('events'),
    TAGS.doc('events', eventId),
    ...(ev?.slug ? [TAGS.doc('events', ev.slug)] : []),
  ])
}

export const EventRegistrations: CollectionConfig = {
  slug: 'event-registrations',
  labels: { singular: 'রেজিস্ট্রেশন', plural: 'মজলিস রেজিস্ট্রেশন' },
  admin: {
    group: 'মজলিস ও সার্কেল',
    useAsTitle: 'code',
    defaultColumns: ['code', 'name', 'phone', 'event', 'seating', 'guests', 'status'],
    hidden: ({ user }) => !hasRole(user, ...STAFF_ROLES),
  },
  defaultSort: '-createdAt',
  hooks: {
    // staff can cancel or remove registrations in the admin: keep the seat count and the cached event page in step
    afterChange: [
      async ({ doc, previousDoc, operation, req, context }) => {
        const eventId = idOf(doc.event)
        if (!eventId) return doc
        const changed =
          operation === 'update' &&
          (doc.status !== previousDoc?.status || doc.guests !== previousDoc?.guests)
        if (changed && !context.skipCounters) await recountEvent(req.payload, eventId, req)
        await refreshEventPages(req, eventId)
        return doc
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        const eventId = idOf(doc.event)
        if (!eventId) return doc
        await recountEvent(req.payload, eventId, req)
        await refreshEventPages(req, eventId)
        return doc
      },
    ],
  },
  access: {
    read: ownOrRoles('user', 'super_admin', 'shura', 'editor', 'moderator'),
    create: adminsOnly,
    update: roles('super_admin', 'shura', 'editor', 'moderator'),
    delete: adminsOnly,
  },
  fields: [
    { name: 'event', type: 'relationship', relationTo: 'events', required: true, index: true },
    { name: 'user', type: 'relationship', relationTo: 'users', index: true },
    {
      name: 'code',
      label: 'রেজিস্ট্রেশন নম্বর',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    { name: 'name', label: 'নাম', type: 'text', required: true },
    { name: 'phone', label: 'মোবাইল', type: 'text', required: true, index: true },
    { name: 'email', label: 'ইমেইল', type: 'email' },
    {
      name: 'seating',
      label: 'বসার ব্যবস্থা',
      type: 'select',
      options: [
        { label: 'ভাইদের অংশ', value: 'brothers' },
        { label: 'বোনদের অংশ', value: 'sisters' },
      ],
    },
    { name: 'guests', label: 'সঙ্গী', type: 'number', defaultValue: 0, min: 0, max: 3 },
    {
      name: 'status',
      label: 'অবস্থা',
      type: 'select',
      defaultValue: 'confirmed',
      index: true,
      options: [
        { label: 'নিশ্চিত', value: 'confirmed' },
        { label: 'বাতিল', value: 'cancelled' },
      ],
    },
    { name: 'reminderSentAt', type: 'date', admin: { readOnly: true } },
  ],
  indexes: [{ fields: ['event', 'phone'], unique: false }],
}
