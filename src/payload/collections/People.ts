import type { CollectionConfig } from 'payload'

import { STAFF_ROLES } from '@/lib/roles'
import { TAGS } from '@/server/cache/tags'

import { anyone, fieldRoles } from '../access'
import { menuAccess } from '../access/permissions'

const staffField = fieldRoles(...STAFF_ROLES)
import { searchTextField, slugField } from '../fields'
import { revalidateCollection } from '../hooks/revalidate'

const revalidate = revalidateCollection('people', {
  isPublic: (doc) => doc.active !== false,
  extraTags: () => [
    TAGS.global('about-page'),
    TAGS.collection('articles'),
    TAGS.collection('videos'),
  ],
})

/**
 * Scholars, writers and speakers. Profiles exist for transparency
 * (who writes and who reviews), never for personality cults.
 */
export const People: CollectionConfig = {
  slug: 'people',
  labels: { singular: 'ব্যক্তি', plural: 'আলিম, লেখক ও বক্তা' },
  admin: {
    group: 'মানুষ',
    useAsTitle: 'name',
    defaultColumns: ['name', 'kinds', 'title', 'verified', 'active', 'pendingAt'],
    listSearchableFields: ['name', 'title'],
    // "পাবলিক পাতা দেখুন" beside Save, opens the person's page on the site in a new tab
    components: {
      edit: { beforeDocumentControls: ['@/payload/components/public-page-link#PublicPageLink'] },
    },
  },
  defaultSort: 'name',
  access: { read: anyone, ...menuAccess('people') },
  hooks: {
    beforeChange: [
      ({ data }) => {
        data.searchText = [
          data.name,
          data.title,
          data.specialty,
          data.bio,
          ...((data.expertise as string[]) ?? []),
        ]
          .filter(Boolean)
          .join('\n')
        return data
      },
    ],
    afterChange: [revalidate.afterChange],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', label: 'নাম', type: 'text', required: true, admin: { width: '60%' } },
        {
          name: 'avatarTone',
          label: 'অ্যাভাটারের রং',
          type: 'select',
          defaultValue: 'teal',
          options: [
            { label: 'টিল', value: 'teal' },
            { label: 'গোল্ড', value: 'gold' },
          ],
          admin: { width: '40%' },
        },
      ],
    },
    slugField({ from: 'name', prefix: 'person' }),
    {
      name: 'kinds',
      label: 'ভূমিকা',
      type: 'select',
      hasMany: true,
      required: true,
      index: true,
      defaultValue: ['scholar'],
      options: [
        { label: 'আলিম প্যানেল', value: 'scholar' },
        { label: 'লেখক', value: 'author' },
        { label: 'রিভিউয়ার', value: 'reviewer' },
        { label: 'বক্তা', value: 'speaker' },
      ],
    },
    { name: 'title', label: 'পদবি', type: 'text', admin: { placeholder: 'ইলমি রিভিউ প্রধান' } },
    {
      name: 'specialty',
      label: 'বিশেষ ক্ষেত্র (এক লাইনে)',
      type: 'text',
      admin: { placeholder: 'হাদিস ও উলুমুল হাদিস' },
    },
    {
      name: 'shuraRole',
      label: 'শূরায় দায়িত্ব',
      type: 'text',
      admin: { description: 'শূরা সদস্য হলে পূরণ করুন; “আমাদের পরিচয়” পাতায় দেখাবে।' },
    },
    {
      name: 'shuraOrder',
      label: 'শূরা তালিকায় ক্রম',
      type: 'number',
      admin: { condition: (d) => Boolean(d?.shuraRole) },
    },
    {
      name: 'verified',
      label: 'যাচাইকৃত',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'active',
      label: 'সক্রিয় (পাবলিক)',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'photo',
      label: 'ছবি (ঐচ্ছিক)',
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
        description: 'ডিজাইন নীতি অনুযায়ী সাধারণত আদ্যক্ষর ব্যবহৃত হয়।',
      },
    },
    {
      // changes the member made to their own profile, waiting for approval (people menu's rule)
      name: 'pendingPanel',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '@/payload/components/pending-profile#PendingProfilePanel' },
      },
    },
    {
      name: 'user',
      label: 'অ্যাকাউন্ট',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'এই প্রোফাইলের মানুষটি নিজে যে অ্যাকাউন্টে লগইন করেন। শুধু তাঁর নিজের অ্যাকাউন্ট বাছাই করুন; অ্যাকাউন্ট না থাকলে খালি রাখুন। রোল দিলে এটি নিজে থেকেও যুক্ত হয়।',
      },
    },
    {
      name: 'pendingChanges',
      type: 'json',
      // never public: only the team that approves sees what is waiting
      access: { read: staffField },
      admin: { hidden: true },
    },
    {
      name: 'pendingAt',
      label: 'অনুমোদন বাকি (জমার সময়)',
      type: 'date',
      index: true,
      access: { read: staffField },
      admin: { readOnly: true, condition: () => false },
    },
    { name: 'bio', label: 'পরিচিতি', type: 'textarea' },
    {
      type: 'row',
      fields: [
        {
          name: 'joinedLabel',
          label: 'যোগদান',
          type: 'text',
          admin: { width: '50%', placeholder: 'রবিউল আউয়াল ১৪৪৮' },
        },
        {
          name: 'location',
          label: 'অবস্থান',
          type: 'text',
          admin: { width: '50%', placeholder: 'খুলনা' },
        },
      ],
    },
    {
      name: 'education',
      label: 'শিক্ষা ও প্রশিক্ষণ',
      type: 'array',
      fields: [
        { name: 'degree', label: 'ডিগ্রি', type: 'text', required: true },
        { name: 'institution', label: 'প্রতিষ্ঠান', type: 'text' },
      ],
    },
    { name: 'expertise', label: 'বিশেষজ্ঞতা', type: 'text', hasMany: true },
    {
      name: 'roleNotes',
      label: 'Ruhama-তে ভূমিকার বিবরণ',
      type: 'array',
      fields: [
        {
          name: 'role',
          type: 'select',
          required: true,
          options: [
            { label: 'লেখক', value: 'author' },
            { label: 'রিভিউয়ার', value: 'reviewer' },
            { label: 'বক্তা', value: 'speaker' },
          ],
        },
        { name: 'note', type: 'text', required: true },
      ],
    },
    {
      name: 'disclaimer',
      label: 'প্রোফাইল নোট',
      type: 'textarea',
      admin: {
        description: 'যেমন: “ইনি আলিম প্যানেলের সদস্য নন; প্রতিটি লেখা প্যানেলের আলিম রিভিউ করেন।”',
      },
    },
    searchTextField,
    {
      type: 'collapsible',
      label: 'পরিসংখ্যান (স্বয়ংক্রিয়)',
      admin: { initCollapsed: true },
      fields: [
        { name: 'articleCount', type: 'number', defaultValue: 0, admin: { readOnly: true } },
        { name: 'answerCount', type: 'number', defaultValue: 0, admin: { readOnly: true } },
        { name: 'lectureCount', type: 'number', defaultValue: 0, admin: { readOnly: true } },
        { name: 'reviewedCount', type: 'number', defaultValue: 0, admin: { readOnly: true } },
        { name: 'eventTalkCount', type: 'number', defaultValue: 0, admin: { readOnly: true } },
        { name: 'seriesCount', type: 'number', defaultValue: 0, admin: { readOnly: true } },
      ],
    },
  ],
}
