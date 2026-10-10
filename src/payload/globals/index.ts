import type { Field, GlobalConfig } from 'payload'

import { JOURNEY_STAGES } from '@/lib/journey'
import { TAGS } from '@/server/cache/tags'

import { atLevel, fieldAtLevel, globalAccess } from '../access/permissions'
import { revalidateGlobal } from '../hooks/revalidate'

import { CollectionRules } from './collection-rules'
import { RolePermissions } from './role-permissions'
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
  access: globalAccess('site-settings'),
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

/** Where a button goes: a page on the site (/about), a section of the page (#journey) or a full https link. */
const ctaLinkField = (name: string, label: string, fallback: string): Field => ({
  name,
  label,
  type: 'text',
  defaultValue: fallback,
  validate: (value: unknown) =>
    !value ||
    (typeof value === 'string' && /^(\/(?!\/)|#|https:\/\/)\S*$/.test(value.trim())) ||
    'লিংক / দিয়ে (যেমন /about), # দিয়ে (যেমন #journey) অথবা https:// দিয়ে শুরু হতে হবে',
  admin: {
    width: '50%',
    placeholder: fallback,
    description: `সাইটের পেজ (/about), এই পেজের অংশ (#journey) বা বাইরের লিংক (https://...)। ফাঁকা থাকলে ${fallback}`,
  },
})

/** The switch at the top of every home page tab. */
const showField = (name: string, section: string): Field => ({
  name,
  label: 'এই অংশটি ওয়েবসাইটে দেখান',
  type: 'checkbox',
  defaultValue: true,
  admin: {
    className: 'rh-section-toggle',
    description: `বন্ধ করলে হোম পেজে "${section}" অংশটি দেখাবে না। লেখা মুছে যায় না, পরে আবার চালু করা যায়।`,
  },
})

const eyebrowField = (name: string, fallback: string): Field => ({
  name,
  label: 'ছোট শিরোনাম',
  type: 'text',
  defaultValue: fallback,
  admin: { width: '50%' },
})

const titleField = (name: string, fallback?: string): Field => ({
  name,
  label: 'শিরোনাম',
  type: 'text',
  required: true,
  ...(fallback ? { defaultValue: fallback } : {}),
  admin: { width: '50%' },
})

const countField = (name: string, label: string, fallback: number, max: number): Field => ({
  name,
  label,
  type: 'number',
  defaultValue: fallback,
  min: 1,
  max,
  admin: { step: 1, width: '50%', description: `1 থেকে ${max}` },
})

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'হোম পেজ',
  admin: {
    group: 'সাইট',
    description:
      'হোম পেজের প্রতিটি অংশ এক জায়গায়, পেজে যে ক্রমে আছে সেই ক্রমে। প্রতিটি ট্যাবের উপরের সুইচ দিয়ে অংশটি দেখানো বা লুকানো যায়।',
  },
  access: globalAccess('home-page'),
  versions: { max: 20 },
  hooks: { afterChange: [revalidateGlobal('home-page', [TAGS.home])] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'হিরো',
          fields: [
            showField('showHero', 'হিরো'),
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
                ctaLinkField('primaryCtaHref', 'প্রধান বাটনের লিংক', '#journey'),
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'secondaryCtaLabel',
                  label: 'দ্বিতীয় বাটন',
                  type: 'text',
                  required: true,
                  admin: { width: '50%' },
                },
                ctaLinkField('secondaryCtaHref', 'দ্বিতীয় বাটনের লিংক', '/about'),
              ],
            },
            {
              name: 'support',
              label: 'হিরোর নিচের লাইন',
              type: 'group',
              fields: [
                { name: 'arabic', label: 'আরবি', type: 'text' },
                { name: 'text', label: 'বাংলা', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'অঙ্গীকার',
          fields: [
            showField('showPledge', 'অঙ্গীকার'),
            {
              type: 'row',
              fields: [eyebrowField('pledgeEyebrow', 'আমাদের অঙ্গীকার'), titleField('pledgeTitle')],
            },
            {
              name: 'pledges',
              label: 'অঙ্গীকারসমূহ',
              type: 'array',
              minRows: 1,
              maxRows: 6,
              fields: [
                { name: 'title', label: 'শিরোনাম', type: 'text', required: true },
                { name: 'text', label: 'লেখা', type: 'textarea', required: true },
              ],
            },
          ],
        },
        {
          label: 'যাত্রার ধাপ',
          fields: [
            showField('showJourney', 'যাত্রার ধাপ'),
            {
              type: 'row',
              fields: [eyebrowField('journeyEyebrow', 'যাত্রার ধাপ'), titleField('journeyTitle')],
            },
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
                  label: 'ধাপ',
                  type: 'select',
                  required: true,
                  options: JOURNEY_STAGES.map((s) => ({ label: s.label, value: s.value })),
                },
                { name: 'title', label: 'শিরোনাম', type: 'text', required: true },
                { name: 'text', label: 'লেখা', type: 'textarea', required: true },
                { name: 'href', label: 'লিংক', type: 'text', required: true },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'journeyEndText',
                  label: 'নিচের লেখা',
                  type: 'text',
                  defaultValue:
                    'এই যাত্রায় আপনি কোথায় আছেন, নিজের ড্যাশবোর্ডে চিহ্নিত করে রাখুন।',
                  admin: { width: '50%' },
                },
                {
                  name: 'journeyEndLabel',
                  label: 'নিচের বাটন (ড্যাশবোর্ডে যায়)',
                  type: 'text',
                  defaultValue: 'আমার যাত্রা দেখুন',
                  admin: { width: '50%' },
                },
              ],
            },
          ],
        },
        {
          label: 'পরিবেশ',
          fields: [
            showField('showValues', 'পরিবেশ'),
            {
              type: 'row',
              fields: [eyebrowField('valuesEyebrow', 'আমাদের সংস্কৃতি'), titleField('valuesTitle')],
            },
            { name: 'valuesLead', label: 'বিবরণ', type: 'textarea' },
            {
              name: 'values',
              label: 'মূল্যবোধ',
              type: 'array',
              fields: [
                {
                  name: 'icon',
                  label: 'আইকন',
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
                { name: 'title', label: 'শিরোনাম', type: 'text', required: true },
                { name: 'text', label: 'লেখা', type: 'textarea', required: true },
              ],
            },
          ],
        },
        {
          label: 'আজকের আয়াত ও হাদিস',
          fields: [
            showField('showDaily', 'আজকের আয়াত ও হাদিস'),
            {
              type: 'row',
              fields: [
                eyebrowField('dailyEyebrow', 'প্রতিদিনের পাথেয়'),
                titleField('dailyTitle', 'আজকের আয়াত ও হাদিস'),
              ],
            },
            {
              name: 'dailyScheduled',
              label: 'শিডিউল (তালিকা) অনুযায়ী দেখান',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                className: 'rh-section-toggle',
                description:
                  'চালু: নিচের তালিকা থেকে দেখাবে (তারিখ দেওয়া থাকলে সেদিন সেটি, নইলে পালা করে)। বন্ধ: সাইট নিজে প্রতিদিন একটি ছোট আয়াত ও একই বিষয়ের একটি ছোট সহিহ/হাসান হাদিস বেছে নেবে।',
              },
            },
            {
              name: 'dailyPanel',
              type: 'ui',
              admin: {
                condition: (data) => data?.dailyScheduled !== false,
                components: {
                  Field: '@/payload/components/daily-reminders-panel#DailyRemindersPanel',
                },
              },
            },
            {
              name: 'dailyAutoNote',
              type: 'ui',
              admin: {
                condition: (data) => data?.dailyScheduled === false,
                components: {
                  Field: {
                    path: '@/payload/components/home-section-note#HomeSectionNote',
                    clientProps: {
                      text: 'স্বয়ংক্রিয়ভাবে চলছে: প্রতিদিন একটি বিষয় (ধৈর্য, রহমত, ক্ষমা, ভ্রাতৃত্ব, দোয়া ইত্যাদি) ধরে সেই বিষয়ের একটি ছোট আয়াত ও একটি ছোট সহিহ বা হাসান হাদিস দেখানো হয়। সারাদিন সবাই একই জোড়া দেখেন, পরদিন নতুন জোড়া। হাদিসে বর্ণনাকারীদের লম্বা সূত্র বাদ দিয়ে শুধু নবীজির (সা.) কথা দেখানো হয়। তালিকার এন্ট্রিগুলো মুছে যায়নি, শিডিউল চালু করলে আবার সেগুলোই দেখাবে।',
                    },
                  },
                },
              },
            },
          ],
        },
        {
          label: 'ইলম কেন্দ্র',
          fields: [
            showField('showIlm', 'ইলম কেন্দ্র'),
            {
              type: 'row',
              fields: [
                eyebrowField('ilmEyebrow', 'ইলম কেন্দ্র'),
                titleField('ilmTitle', 'বিষয়ভিত্তিক জ্ঞানভান্ডার'),
              ],
            },
            { name: 'ilmLead', label: 'বিবরণ', type: 'textarea' },
            {
              type: 'row',
              fields: [
                countField('ilmCount', 'কয়টি বিষয় দেখাবে', 7, 15),
                {
                  name: 'ilmNote',
                  type: 'ui',
                  admin: {
                    width: '50%',
                    components: {
                      Field: {
                        path: '@/payload/components/home-section-note#HomeSectionNote',
                        clientProps: {
                          text: 'বিষয়গুলো আসে "বিষয়সমূহ" মেনু থেকে। শেষে "মতপার্থক্যের আদব" টাইলটি সবসময় থাকে।',
                        },
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'সর্বশেষ প্রবন্ধ',
          fields: [
            showField('showArticles', 'সর্বশেষ প্রবন্ধ'),
            {
              type: 'row',
              fields: [
                eyebrowField('articlesEyebrow', 'নতুন লেখা'),
                titleField('articlesTitle', 'সর্বশেষ প্রবন্ধ'),
              ],
            },
            {
              type: 'row',
              fields: [
                countField('articlesCount', 'কয়টি প্রবন্ধ দেখাবে', 3, 12),
                {
                  name: 'articlesNote',
                  type: 'ui',
                  admin: {
                    width: '50%',
                    components: {
                      Field: {
                        path: '@/payload/components/home-section-note#HomeSectionNote',
                        clientProps: {
                          text: 'প্রবন্ধ মেনু থেকে প্রকাশিত সবচেয়ে নতুন লেখাগুলো নিজে থেকে আসে।',
                        },
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'ইখতিলাফ',
          fields: [
            showField('showIkhtilaf', 'ইখতিলাফ'),
            {
              type: 'row',
              fields: [
                eyebrowField('ikhtilafEyebrow', 'ইখতিলাফ বিভাগ'),
                titleField('ikhtilafTitle', 'মতপার্থক্যের আদব'),
              ],
            },
            {
              name: 'ikhtilafText',
              label: 'বিবরণ',
              type: 'textarea',
              defaultValue:
                'যেসব বিষয়ে আলিমদের মধ্যে দলিলভিত্তিক ভিন্নমত রয়েছে, সেখানে প্রতিটি মত তার দলিলসহ পাশাপাশি তুলে ধরা হয়, সমান মর্যাদায়। উদ্দেশ্য বিতর্ক জেতা নয়, বোঝা ও সম্মান করা।',
            },
            {
              name: 'ikhtilafPoints',
              label: 'বুলেট পয়েন্ট',
              type: 'array',
              fields: [{ name: 'text', label: 'লেখা', type: 'text', required: true }],
            },
            {
              name: 'featuredIkhtilaf',
              label: 'পাশে দেখানো মতপার্থক্যের বিষয়',
              type: 'relationship',
              relationTo: 'ikhtilaf-topics',
              admin: {
                description:
                  'প্রকাশিত একটি বিষয় বেছে নিন। বিষয় না থাকলে বা প্রকাশিত না হলে অংশটি দেখাবে না।',
              },
            },
          ],
        },
        {
          label: 'আসন্ন মজলিস',
          fields: [
            showField('showEvents', 'আসন্ন মজলিস'),
            {
              type: 'row',
              fields: [
                eyebrowField('eventsEyebrow', 'একসাথে বসি'),
                titleField('eventsTitle', 'আসন্ন মজলিস'),
              ],
            },
            {
              name: 'eventsPastTitle',
              label: 'শিরোনাম, যখন কোনো আসন্ন মজলিস নেই',
              type: 'text',
              defaultValue: 'সাম্প্রতিক মজলিস',
              admin: {
                description:
                  'আসন্ন মজলিস কম থাকলে বাকি কার্ডে সদ্য শেষ হওয়া মজলিস দেখায় ("শেষ হয়েছে" চিহ্নসহ, রেজিস্ট্রেশন ছাড়া)। একটিও আসন্ন না থাকলে উপরের শিরোনামের বদলে এটি দেখাবে।',
              },
            },
            {
              type: 'row',
              fields: [
                countField('eventsCount', 'কয়টি মজলিস দেখাবে', 3, 10),
                {
                  name: 'eventsNote',
                  type: 'ui',
                  admin: {
                    width: '50%',
                    components: {
                      Field: {
                        path: '@/payload/components/home-section-note#HomeSectionNote',
                        clientProps: {
                          text: 'মজলিস মেনু থেকে নিজে থেকে আসে: আগে সামনের মজলিস, জায়গা বাকি থাকলে সদ্য শেষ হওয়াগুলো। কোনো মজলিসই না থাকলে অংশটি লুকানো থাকে।',
                        },
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'শেষের আহ্বান',
          fields: [
            showField('showCta', 'শেষের আহ্বান'),
            { name: 'ctaTitle', label: 'শিরোনাম', type: 'text', required: true },
            { name: 'ctaText', label: 'লেখা', type: 'textarea', required: true },
            {
              type: 'row',
              fields: [
                {
                  name: 'ctaPrimaryLabel',
                  label: 'প্রধান বাটন',
                  type: 'text',
                  defaultValue: 'যুক্ত হোন',
                  admin: { width: '50%' },
                },
                ctaLinkField('ctaPrimaryHref', 'প্রধান বাটনের লিংক', '/join'),
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'ctaSecondaryLabel',
                  label: 'দ্বিতীয় বাটন',
                  type: 'text',
                  defaultValue: 'আগে আমাদের জানুন',
                  admin: { width: '50%' },
                },
                ctaLinkField('ctaSecondaryHref', 'দ্বিতীয় বাটনের লিংক', '/about'),
              ],
            },
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
  access: globalAccess('about-page'),
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
    {
      name: 'shuraFeatured',
      label: 'শূরা: এই পাতায় যাঁদের দেখাবে',
      type: 'relationship',
      relationTo: 'people',
      hasMany: true,
      // only active people with a শূরা role (set on their profile under মানুষ > আলিম, লেখক ও বক্তা)
      filterOptions: {
        and: [
          { active: { equals: true } },
          { shuraRole: { exists: true } },
          { shuraRole: { not_equals: '' } },
        ],
      },
      admin: {
        isSortable: true,
        description:
          'একজন একজন করে বেছে নিন; যে ক্রমে বাছবেন সেই ক্রমে দেখাবে (টেনে ক্রম বদলানো যায়)। শূরায় এর চেয়ে বেশি সদস্য থাকলে নিচে “সব শূরা সদস্য দেখুন” বাটন আসবে, যা আলাদা পাতায় সবাইকে দেখায়। খালি রাখলে সবাই দেখাবে। তালিকায় আসতে হলে ব্যক্তির প্রোফাইলে “শূরায় দায়িত্ব” পূরণ করা থাকতে হবে।',
      },
    },
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
  access: globalAccess('adab-policy'),
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
  admin: { group: 'ফোরাম' },
  access: globalAccess('moderation-settings', atLevel('moderation-settings', 'view')),
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
      access: { read: fieldAtLevel('moderation-settings', 'view') },
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
  CollectionRules,
  RolePermissions,
]
