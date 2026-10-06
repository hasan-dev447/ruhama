import type { Field, GlobalConfig } from 'payload'

import { JOURNEY_STAGES } from '@/lib/journey'
import { hasRole, MODERATOR_ROLES } from '@/lib/roles'
import { TAGS } from '@/server/cache/tags'

import { adminsOnly, anyone, editorsOnly, fieldRoles } from '../access'
import { revalidateGlobal } from '../hooks/revalidate'

import { Integrations } from './integrations'

const ayahGroup = (name: string, label: string): Field => ({
  name,
  label,
  type: 'group',
  fields: [
    { name: 'arabic', label: 'আরবি', type: 'textarea', required: true },
    { name: 'translation', label: 'বাংলা অনুবাদ', type: 'textarea', required: true },
    { name: 'reference', label: 'সূত্র', type: 'text', required: true },
  ],
})

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'সাইট সেটিংস',
  admin: { group: 'সাইট' },
  access: { read: anyone, update: adminsOnly },
  hooks: { afterChange: [revalidateGlobal('site-settings', [TAGS.home])] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'সাধারণ',
          fields: [
            { name: 'footerBlurb', label: 'ফুটারের পরিচিতি', type: 'textarea', required: true },
            {
              name: 'newsletterBlurb',
              label: 'সাপ্তাহিক চিঠির বিবরণ',
              type: 'textarea',
              required: true,
            },
            ayahGroup('footerAyah', 'ফুটারের আয়াত'),
          ],
        },
        {
          label: 'যোগাযোগ',
          fields: [
            { name: 'contactEmail', label: 'ইমেইল', type: 'email' },
            { name: 'contactPhone', label: 'ফোন', type: 'text' },
            { name: 'address', label: 'ঠিকানা', type: 'textarea' },
            {
              name: 'social',
              label: 'সামাজিক মাধ্যম',
              type: 'group',
              fields: [
                { name: 'facebook', type: 'text' },
                { name: 'youtube', type: 'text' },
                { name: 'telegram', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            { name: 'defaultTitle', label: 'ডিফল্ট শিরোনাম', type: 'text' },
            { name: 'defaultDescription', label: 'ডিফল্ট বিবরণ', type: 'textarea' },
            { name: 'ogImage', label: 'ডিফল্ট শেয়ার ছবি', type: 'upload', relationTo: 'media' },
          ],
        },
        {
          label: 'নিবন্ধন ও লগইন',
          fields: [
            {
              name: 'auth',
              type: 'group',
              label: false,
              fields: [
                {
                  name: 'requireEmailVerification',
                  label: 'ইমেইল যাচাই ছাড়া পাসওয়ার্ডে লগইন করা যাবে না',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    description:
                      'চালু থাকলে নতুন সদস্যকে ইমেইলে পাঠানো লিংকে ক্লিক করে ঠিকানা যাচাই করতে হবে। বন্ধ করলে নিবন্ধনের সাথে সাথেই লগইন হয়ে যাবে (যাচাইয়ের ইমেইল তখন পাঠানো হয় না)। ইমেইল সেবা চালু না থাকলে বন্ধ রাখুন। লগইন লিংক, মোবাইল কোড ও Google/Facebook লগইনে এর প্রভাব নেই।',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'হোম পেজ',
  admin: { group: 'সাইট' },
  access: { read: anyone, update: editorsOnly },
  versions: { max: 20 },
  hooks: { afterChange: [revalidateGlobal('home-page', [TAGS.home])] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'হিরো',
          fields: [
            ayahGroup('heroAyah', 'হিরো আয়াত'),
            { name: 'titleLine1', label: 'শিরোনাম (প্রথম লাইন)', type: 'text', required: true },
            {
              name: 'titleLine2',
              label: 'শিরোনাম (দ্বিতীয় লাইন, রঙিন)',
              type: 'text',
              required: true,
            },
            { name: 'subtitle', label: 'উপশিরোনাম', type: 'textarea', required: true },
            {
              type: 'row',
              fields: [
                {
                  name: 'primaryCtaLabel',
                  label: 'প্রধান বাটন',
                  type: 'text',
                  required: true,
                  admin: { width: '50%' },
                },
                {
                  name: 'secondaryCtaLabel',
                  label: 'দ্বিতীয় বাটন',
                  type: 'text',
                  required: true,
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'support',
              label: 'হিরোর নিচের লাইন',
              type: 'group',
              fields: [
                { name: 'arabic', type: 'text' },
                { name: 'text', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'অঙ্গীকার',
          fields: [
            {
              name: 'pledgeEyebrow',
              label: 'ছোট শিরোনাম',
              type: 'text',
              defaultValue: 'আমাদের অঙ্গীকার',
            },
            { name: 'pledgeTitle', label: 'শিরোনাম', type: 'text', required: true },
            {
              name: 'pledges',
              label: 'অঙ্গীকারসমূহ',
              type: 'array',
              minRows: 1,
              maxRows: 6,
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'text', type: 'textarea', required: true },
              ],
            },
          ],
        },
        {
          label: 'যাত্রার ধাপ',
          fields: [
            { name: 'journeyTitle', label: 'শিরোনাম', type: 'text', required: true },
            { name: 'journeyLead', label: 'বিবরণ', type: 'textarea' },
            {
              name: 'journeySteps',
              label: 'আটটি ধাপ',
              type: 'array',
              minRows: 8,
              maxRows: 8,
              fields: [
                {
                  name: 'stage',
                  type: 'select',
                  required: true,
                  options: JOURNEY_STAGES.map((s) => ({ label: s.label, value: s.value })),
                },
                { name: 'title', type: 'text', required: true },
                { name: 'text', type: 'textarea', required: true },
                { name: 'href', label: 'লিংক', type: 'text', required: true },
              ],
            },
          ],
        },
        {
          label: 'পরিবেশ',
          fields: [
            { name: 'valuesTitle', label: 'শিরোনাম', type: 'text', required: true },
            { name: 'valuesLead', label: 'বিবরণ', type: 'textarea' },
            {
              name: 'values',
              label: 'মূল্যবোধ',
              type: 'array',
              fields: [
                {
                  name: 'icon',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'হাত মেলানো', value: 'handshake' },
                    { label: 'বই', value: 'book' },
                    { label: 'বার্তা', value: 'message' },
                    { label: 'অনুসন্ধান', value: 'search' },
                    { label: 'Ruhama চিহ্ন', value: 'mark' },
                    { label: 'মানুষ', value: 'users' },
                  ],
                },
                { name: 'title', type: 'text', required: true },
                { name: 'text', type: 'textarea', required: true },
              ],
            },
          ],
        },
        {
          label: 'অন্যান্য অংশ',
          fields: [
            {
              name: 'featuredIkhtilaf',
              label: 'হোমে দেখানো মতপার্থক্যের বিষয়',
              type: 'relationship',
              relationTo: 'ikhtilaf-topics',
            },
            {
              name: 'ikhtilafPoints',
              label: 'ইখতিলাফ অংশের বুলেট',
              type: 'array',
              fields: [{ name: 'text', type: 'text', required: true }],
            },
            { name: 'ilmLead', label: 'ইলম কেন্দ্র অংশের বিবরণ', type: 'textarea' },
            { name: 'ctaTitle', label: 'শেষের আহ্বান: শিরোনাম', type: 'text', required: true },
            { name: 'ctaText', label: 'শেষের আহ্বান: লেখা', type: 'textarea', required: true },
          ],
        },
      ],
    },
  ],
}

export const AboutPage: GlobalConfig = {
  slug: 'about-page',
  label: 'আমাদের পরিচয় (ঘোষণাপত্র)',
  admin: { group: 'সাইট' },
  access: { read: anyone, update: adminsOnly },
  versions: { max: 30 },
  hooks: { afterChange: [revalidateGlobal('about-page')] },
  fields: [
    { name: 'title', label: 'শিরোনাম', type: 'text', required: true },
    { name: 'lead', label: 'ভূমিকা', type: 'textarea', required: true },
    {
      type: 'row',
      fields: [
        { name: 'version', label: 'সংস্করণ', type: 'text', admin: { width: '33%' } },
        { name: 'publishedLabel', label: 'প্রকাশ', type: 'text', admin: { width: '33%' } },
        {
          name: 'readingTime',
          label: 'পড়ার সময় (মিনিট)',
          type: 'number',
          admin: { width: '34%' },
        },
      ],
    },
    {
      name: 'manifesto',
      label: 'ঘোষণাপত্র',
      type: 'richText',
      required: true,
      admin: {
        description:
          'H2 শিরোনামগুলো সূচিপত্রে দেখাবে। “আমাদের অঙ্গীকার” শিরোনামটি ঘোষণাপত্র অংশের লিংক।',
      },
    },
    { name: 'shuraIntro', label: 'শূরা: পরিচিতি', type: 'textarea', required: true },
    { name: 'adabIntro', label: 'আদব নীতি: পরিচিতি', type: 'textarea', required: true },
    {
      name: 'adabRules',
      label: 'আদব ও ইনসাফ নীতি',
      type: 'array',
      fields: [
        {
          name: 'icon',
          type: 'select',
          defaultValue: 'book',
          options: [
            { label: 'বই', value: 'book' },
            { label: 'হৃদয়', value: 'heart' },
            { label: 'দাঁড়িপাল্লা', value: 'scale' },
            { label: 'নিষেধ', value: 'ban' },
            { label: 'মাইক', value: 'megaphone' },
            { label: 'ব্যক্তি', value: 'user' },
          ],
        },
        {
          name: 'tone',
          type: 'select',
          defaultValue: 'teal',
          options: [
            { label: 'টিল', value: 'teal' },
            { label: 'গোল্ড', value: 'gold' },
          ],
        },
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea', required: true },
      ],
    },
    { name: 'ctaTitle', type: 'text', required: true },
    { name: 'ctaText', type: 'textarea', required: true },
  ],
}

export const AdabPolicy: GlobalConfig = {
  slug: 'adab-policy',
  label: 'আদব নীতিমালা (পূর্ণ)',
  admin: { group: 'সাইট' },
  access: { read: anyone, update: adminsOnly },
  versions: { max: 30 },
  hooks: { afterChange: [revalidateGlobal('adab-policy')] },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'lead', type: 'textarea', required: true },
    { name: 'content', type: 'richText', required: true },
    {
      name: 'enforcement',
      label: 'নীতি ভঙ্গ হলে',
      type: 'array',
      fields: [
        { name: 'step', type: 'text', required: true },
        { name: 'detail', type: 'text' },
      ],
    },
    { name: 'updatedLabel', label: 'সর্বশেষ হালনাগাদ', type: 'text' },
  ],
}

export const ModerationSettings: GlobalConfig = {
  slug: 'moderation-settings',
  label: 'মডারেশন নিয়ম',
  admin: { group: 'ফোরাম', hidden: ({ user }) => !hasRole(user, ...MODERATOR_ROLES) },
  access: {
    read: ({ req }) => hasRole(req.user, ...MODERATOR_ROLES),
    update: ({ req }) => hasRole(req.user, 'super_admin', 'shura', 'moderator'),
  },
  fields: [
    {
      name: 'firstPostsModerated',
      label: 'নতুন সদস্যের প্রথম কয়টি পোস্ট মডারেশনে যাবে',
      type: 'number',
      defaultValue: 3,
      min: 0,
    },
    {
      name: 'reportThreshold',
      label: 'কয়টি রিপোর্টে স্বয়ংক্রিয়ভাবে লুকানো হবে',
      type: 'number',
      defaultValue: 3,
      min: 1,
    },
    { name: 'maxLinks', label: 'এক পোস্টে সর্বোচ্চ লিংক', type: 'number', defaultValue: 2, min: 0 },
    {
      name: 'blockedTerms',
      label: 'নিষিদ্ধ শব্দ (ফ্ল্যাগ হবে)',
      type: 'text',
      hasMany: true,
      access: { read: fieldRoles('super_admin', 'shura', 'moderator') },
      admin: { description: 'এই শব্দ থাকলে পোস্টটি সরাসরি প্রকাশ না হয়ে মডারেশনে যাবে।' },
    },
    {
      name: 'postsPerHour',
      label: 'প্রতি ঘণ্টায় সর্বোচ্চ পোস্ট (একজন সদস্য)',
      type: 'number',
      defaultValue: 10,
      min: 1,
    },
  ],
}

export const GLOBALS = [
  SiteSettings,
  HomePage,
  AboutPage,
  AdabPolicy,
  ModerationSettings,
  Integrations,
]
