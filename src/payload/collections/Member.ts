import type { CollectionConfig } from 'payload'

import { DISTRICT_OPTIONS } from '@/lib/districts'
import { CONTACT_TOPICS, INTEREST_OPTIONS } from '@/lib/options'
import { hasRole, STAFF_ROLES } from '@/lib/roles'

import { adminsOnly, nobody, ownOrRoles } from '../access'
import { atLevel, menuAccess, menuRead } from '../access/permissions'

const hidden = ({ user }: { user: unknown }) => !hasRole(user as { role?: unknown }, ...STAFF_ROLES)

export const BOOKMARK_TARGETS = [
  'articles',
  'ikhtilaf-topics',
  'videos',
  'questions',
  'ayahs',
  'hadiths',
] as const

/** Saved items. Article bookmarks are also cached by the PWA for offline reading. */
export const Bookmarks: CollectionConfig = {
  slug: 'bookmarks',
  labels: { singular: 'সংরক্ষিত', plural: 'সংরক্ষিত' },
  admin: { group: 'সদস্য কার্যক্রম', hidden: true },
  access: {
    read: ownOrRoles('user', 'super_admin'),
    create: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    {
      name: 'target',
      type: 'relationship',
      relationTo: [...BOOKMARK_TARGETS],
      required: true,
      index: true,
    },
    {
      name: 'targetKey',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'collection:id, used for uniqueness' },
    },
  ],
  indexes: [{ fields: ['user', 'targetKey'], unique: true }],
}

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  labels: { singular: 'নোটিফিকেশন', plural: 'নোটিফিকেশন' },
  admin: {
    group: 'সদস্য কার্যক্রম',
    defaultColumns: ['recipient', 'kind', 'text', 'read', 'createdAt'],
    hidden,
  },
  defaultSort: '-createdAt',
  access: {
    read: menuRead('notifications', { ownField: 'recipient' }),
    ...menuAccess('notifications'),
  },
  fields: [
    { name: 'recipient', type: 'relationship', relationTo: 'users', required: true, index: true },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: ['answer', 'event', 'forum', 'course', 'review', 'system'].map((v) => ({
        label: v,
        value: v,
      })),
    },
    { name: 'text', type: 'textarea', required: true },
    { name: 'link', type: 'text' },
    { name: 'read', type: 'checkbox', defaultValue: false, index: true },
  ],
  indexes: [{ fields: ['recipient', 'read'] }],
}

export const AnswerVotes: CollectionConfig = {
  slug: 'answer-votes',
  labels: { singular: 'উত্তরের মূল্যায়ন', plural: 'উত্তরের মূল্যায়ন' },
  admin: { group: 'প্রশ্নোত্তর', hidden },
  access: {
    read: atLevel('answer-votes', 'view'),
    create: nobody,
    update: nobody,
    delete: atLevel('answer-votes', 'full'),
  },
  fields: [
    {
      name: 'question',
      type: 'relationship',
      relationTo: 'questions',
      required: true,
      index: true,
    },
    {
      name: 'voterKey',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'user id or hashed visitor key' },
    },
    {
      name: 'value',
      type: 'select',
      required: true,
      options: [
        { label: 'উপকারী', value: 'helpful' },
        { label: 'আরও স্পষ্টতা দরকার', value: 'unclear' },
      ],
    },
  ],
  indexes: [{ fields: ['question', 'voterKey'], unique: true }],
}

export const NewsletterSubscribers: CollectionConfig = {
  slug: 'newsletter-subscribers',
  labels: { singular: 'গ্রাহক', plural: 'সাপ্তাহিক চিঠির গ্রাহক' },
  admin: {
    group: 'যোগাযোগ',
    useAsTitle: 'email',
    defaultColumns: ['email', 'status', 'source', 'createdAt'],
    hidden,
  },
  access: {
    read: atLevel('newsletter-subscribers', 'view'),
    ...menuAccess('newsletter-subscribers'),
  },
  fields: [
    { name: 'email', type: 'email', required: true, unique: true, index: true },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'subscribed',
      index: true,
      options: [
        { label: 'সক্রিয়', value: 'subscribed' },
        { label: 'বাতিল', value: 'unsubscribed' },
      ],
    },
    { name: 'source', type: 'text' },
    { name: 'user', type: 'relationship', relationTo: 'users' },
    { name: 'unsubscribeToken', type: 'text', index: true, admin: { readOnly: true } },
  ],
}

export const Volunteers: CollectionConfig = {
  slug: 'volunteers',
  labels: { singular: 'স্বেচ্ছাসেবক আবেদন', plural: 'যুক্ত হওয়ার আবেদন' },
  admin: {
    group: 'যোগাযোগ',
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'district', 'interests', 'status', 'createdAt'],
    hidden,
  },
  defaultSort: '-createdAt',
  access: {
    read: atLevel('volunteers', 'view'),
    ...menuAccess('volunteers'),
  },
  fields: [
    { name: 'name', label: 'নাম', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'phone', label: 'মোবাইল', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'email', label: 'ইমেইল', type: 'email', admin: { width: '50%' } },
      ],
    },
    {
      name: 'district',
      label: 'জেলা',
      type: 'select',
      required: true,
      index: true,
      options: DISTRICT_OPTIONS,
    },
    {
      name: 'interests',
      label: 'আগ্রহ',
      type: 'select',
      hasMany: true,
      options: INTEREST_OPTIONS.map((o) => ({ ...o })),
    },
    { name: 'message', label: 'বার্তা', type: 'textarea' },
    { name: 'user', type: 'relationship', relationTo: 'users' },
    {
      name: 'status',
      label: 'অবস্থা',
      type: 'select',
      defaultValue: 'new',
      index: true,
      options: [
        { label: 'নতুন', value: 'new' },
        { label: 'যোগাযোগ করা হয়েছে', value: 'contacted' },
        { label: 'সক্রিয়', value: 'active' },
        { label: 'বন্ধ', value: 'closed' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'notes', label: 'অভ্যন্তরীণ নোট', type: 'textarea', admin: { position: 'sidebar' } },
  ],
}

export const ContactMessages: CollectionConfig = {
  slug: 'contact-messages',
  labels: { singular: 'বার্তা', plural: 'যোগাযোগের বার্তা' },
  admin: {
    group: 'যোগাযোগ',
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'name', 'email', 'status', 'createdAt'],
    hidden,
  },
  defaultSort: '-createdAt',
  access: {
    read: atLevel('contact-messages', 'view'),
    ...menuAccess('contact-messages'),
  },
  fields: [
    { name: 'name', label: 'নাম', type: 'text', required: true },
    { name: 'email', label: 'ইমেইল', type: 'email', required: true },
    { name: 'phone', label: 'মোবাইল', type: 'text' },
    {
      name: 'topic',
      label: 'বিষয়',
      type: 'select',
      defaultValue: 'general',
      options: CONTACT_TOPICS.map((o) => ({ ...o })),
    },
    { name: 'subject', label: 'শিরোনাম', type: 'text', required: true },
    { name: 'message', label: 'বার্তা', type: 'textarea', required: true },
    { name: 'user', type: 'relationship', relationTo: 'users' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      index: true,
      options: [
        { label: 'নতুন', value: 'new' },
        { label: 'উত্তর দেওয়া হয়েছে', value: 'replied' },
        { label: 'বন্ধ', value: 'closed' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}

/** Fixed-window counters for rate limiting (login, OTP, forms). Internal only. */
export const RateLimits: CollectionConfig = {
  slug: 'rate-limits',
  admin: { hidden: true },
  access: { read: nobody, create: nobody, update: nobody, delete: nobody },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true, index: true },
    { name: 'count', type: 'number', required: true, defaultValue: 0 },
    { name: 'resetAt', type: 'date', required: true, index: true },
  ],
}
