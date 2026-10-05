import type { Access, CollectionConfig, Where } from 'payload'

import { DISTRICT_OPTIONS } from '@/lib/districts'
import { hasRole, STAFF_ROLES } from '@/lib/roles'
import { TAGS } from '@/server/cache/tags'
import { recountCircle, recountMeetup } from '@/server/services/counters'

import { adminsOnly, editorsOnly, roles, statusPublishedOrStaff } from '../access'
import { slugField } from '../fields'
import { revalidateCollection, safeRevalidate } from '../hooks/revalidate'
import { PUBLISH_STATUS } from './Courses'

const idOf = (v: unknown) =>
  v && typeof v === 'object' && 'id' in v
    ? (v as { id: number }).id
    : (v as number | null | undefined)
const circleStaff = roles('super_admin', 'shura', 'editor', 'moderator')
const hiddenForMembers = ({ user }: { user: unknown }) =>
  !hasRole(user as { role?: unknown }, ...STAFF_ROLES)

const revalidate = revalidateCollection('circles', { isPublic: (d) => d.status === 'published' })

export const CIRCLE_TYPES = [
  { label: 'ভাইদের', value: 'brothers' },
  { label: 'বোনদের', value: 'sisters' },
  { label: 'পারিবারিক', value: 'family' },
]

/** Local study circles across Bangladesh's 64 districts. */
export const Circles: CollectionConfig = {
  slug: 'circles',
  labels: { singular: 'সার্কেল', plural: 'স্থানীয় সার্কেল' },
  admin: {
    group: 'মজলিস ও সার্কেল',
    useAsTitle: 'name',
    defaultColumns: ['name', 'district', 'type', 'memberCount', 'status'],
    hidden: hiddenForMembers,
  },
  defaultSort: 'name',
  access: {
    read: statusPublishedOrStaff(),
    create: circleStaff,
    update: circleStaff,
    delete: editorsOnly,
  },
  hooks: {
    afterChange: [
      revalidate.afterChange,
      async ({ doc, previousDoc, req, context }) => {
        if (!context.skipCounters && doc.offlineMembers !== previousDoc?.offlineMembers)
          await recountCircle(req.payload, doc.id, req)
        return doc
      },
    ],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    { name: 'name', label: 'নাম', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'district',
          label: 'জেলা',
          type: 'select',
          required: true,
          index: true,
          options: DISTRICT_OPTIONS,
          admin: { width: '34%' },
        },
        {
          name: 'type',
          label: 'ধরন',
          type: 'select',
          required: true,
          index: true,
          options: CIRCLE_TYPES,
          admin: { width: '33%' },
        },
        { name: 'area', label: 'এলাকা', type: 'text', admin: { width: '33%' } },
      ],
    },
    { name: 'focus', label: 'আলোচনার বিষয়', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'frequency',
          label: 'নিয়মিততা',
          type: 'select',
          required: true,
          options: [
            { label: 'সাপ্তাহিক', value: 'weekly' },
            { label: 'পাক্ষিক', value: 'fortnightly' },
            { label: 'মাসিক', value: 'monthly' },
          ],
          admin: { width: '40%' },
        },
        {
          name: 'scheduleLabel',
          label: 'সময়',
          type: 'text',
          required: true,
          admin: { width: '60%', placeholder: 'শুক্রবার বাদ মাগরিব' },
        },
      ],
    },
    { name: 'description', label: 'পরিচিতি', type: 'textarea', required: true },
    { name: 'venue', label: 'বৈঠকের স্থান', type: 'text' },
    {
      name: 'sinceLabel',
      label: 'কবে থেকে চলছে',
      type: 'text',
      admin: { placeholder: 'রবিউল আউয়াল ১৪৪৮' },
    },
    {
      name: 'memberUnit',
      label: 'সদস্য গণনা',
      type: 'select',
      defaultValue: 'people',
      options: [
        { label: 'জন', value: 'people' },
        { label: 'পরিবার', value: 'families' },
      ],
    },
    {
      name: 'format',
      label: 'একটি বৈঠকে যা হয়',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'detail', type: 'text' },
      ],
    },
    {
      name: 'rules',
      label: 'সার্কেলের আদব',
      type: 'array',
      fields: [{ name: 'rule', type: 'text', required: true }],
    },
    {
      name: 'team',
      label: 'সমন্বয়ক দল',
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', type: 'text', required: true, admin: { width: '40%' } },
            { name: 'role', type: 'text', required: true, admin: { width: '35%' } },
            { name: 'user', type: 'relationship', relationTo: 'users', admin: { width: '25%' } },
          ],
        },
      ],
    },
    slugField({ from: 'name', prefix: 'circle' }),
    {
      name: 'coordinator',
      label: 'সমন্বয়ক অ্যাকাউন্ট',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      label: 'অবস্থা',
      type: 'select',
      defaultValue: 'published',
      index: true,
      options: PUBLISH_STATUS,
      admin: { position: 'sidebar' },
    },
    {
      name: 'offlineMembers',
      label: 'প্ল্যাটফর্মের বাইরের সদস্য',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: { position: 'sidebar', description: 'যাঁরা নিয়মিত আসেন কিন্তু অ্যাকাউন্ট নেই।' },
    },
    {
      name: 'memberCount',
      label: 'সদস্য',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}

export const CircleMeetups: CollectionConfig = {
  slug: 'circle-meetups',
  labels: { singular: 'বৈঠক', plural: 'সার্কেলের বৈঠক' },
  admin: {
    group: 'মজলিস ও সার্কেল',
    useAsTitle: 'topic',
    defaultColumns: ['topic', 'circle', 'startsAt', 'attendingCount'],
    hidden: hiddenForMembers,
  },
  defaultSort: 'startsAt',
  access: { read: () => true, create: circleStaff, update: circleStaff, delete: circleStaff },
  hooks: {
    afterChange: [
      ({ doc, context }) => {
        const circleId = idOf(doc.circle)
        if (!context.disableRevalidate && circleId)
          safeRevalidate([TAGS.doc('circles', circleId), TAGS.collection('circles')])
        return doc
      },
    ],
  },
  fields: [
    { name: 'circle', type: 'relationship', relationTo: 'circles', required: true, index: true },
    {
      name: 'startsAt',
      label: 'সময়',
      type: 'date',
      required: true,
      index: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    { name: 'topic', label: 'আলোচ্য বিষয়', type: 'text', required: true },
    {
      name: 'meta',
      label: 'অতিরিক্ত তথ্য',
      type: 'text',
      admin: { placeholder: 'শুক্রবার বাদ মাগরিব · মজলিসের ভেন্যুতে' },
    },
    {
      name: 'attendingCount',
      label: 'আসছেন',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
  ],
}

const ownMembership: Access = ({ req }) => {
  if (!req.user) return false
  if (hasRole(req.user, 'super_admin', 'shura', 'editor', 'moderator')) return true
  return {
    or: [{ user: { equals: req.user.id } }, { 'circle.coordinator': { equals: req.user.id } }],
  } as Where
}

export const CircleMemberships: CollectionConfig = {
  slug: 'circle-memberships',
  labels: { singular: 'যুক্ত হওয়ার অনুরোধ', plural: 'সার্কেল সদস্যপদ' },
  admin: {
    group: 'মজলিস ও সার্কেল',
    defaultColumns: ['user', 'circle', 'status', 'createdAt'],
    hidden: hiddenForMembers,
  },
  defaultSort: '-createdAt',
  access: { read: ownMembership, create: adminsOnly, update: circleStaff, delete: adminsOnly },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req, context }) => {
        if (context.skipCounters) return doc
        if (doc.status !== previousDoc?.status)
          await recountCircle(req.payload, idOf(doc.circle)!, req)
        return doc
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        await recountCircle(req.payload, idOf(doc.circle)!, req)
        return doc
      },
    ],
  },
  fields: [
    { name: 'circle', type: 'relationship', relationTo: 'circles', required: true, index: true },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'message', label: 'বার্তা', type: 'textarea' },
    {
      name: 'status',
      label: 'অবস্থা',
      type: 'select',
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'অপেক্ষমাণ', value: 'pending' },
        { label: 'অনুমোদিত', value: 'approved' },
        { label: 'প্রত্যাখ্যাত', value: 'rejected' },
        { label: 'বাতিল', value: 'cancelled' },
      ],
    },
  ],
  indexes: [{ fields: ['circle', 'user'], unique: true }],
}

export const MeetupRsvps: CollectionConfig = {
  slug: 'meetup-rsvps',
  labels: { singular: 'বৈঠকে উপস্থিতি', plural: 'বৈঠকে উপস্থিতি' },
  admin: { group: 'মজলিস ও সার্কেল', hidden: hiddenForMembers },
  access: {
    read: ({ req }) =>
      req.user
        ? hasRole(req.user, ...STAFF_ROLES)
          ? true
          : { user: { equals: req.user.id } }
        : false,
    create: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  hooks: {
    afterChange: [
      async ({ doc, req }) => (await recountMeetup(req.payload, idOf(doc.meetup)!, req), doc),
    ],
    afterDelete: [
      async ({ doc, req }) => (await recountMeetup(req.payload, idOf(doc.meetup)!, req), doc),
    ],
  },
  fields: [
    {
      name: 'meetup',
      type: 'relationship',
      relationTo: 'circle-meetups',
      required: true,
      index: true,
    },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
  ],
  indexes: [{ fields: ['meetup', 'user'], unique: true }],
}
