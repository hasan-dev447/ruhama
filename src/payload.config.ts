import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { BlocksFeature, FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { bnBd } from '@payloadcms/translations/languages/bnBd'
import { buildConfig } from 'payload'
import { betterAuthPlugin } from 'payload-auth/better-auth'
import sharp from 'sharp'

import { CONTENT_ROLES, hasRole } from './lib/roles'
import { r2Endpoint } from './lib/r2'
import { CONTENT_BLOCKS } from './payload/blocks'
import { Articles } from './payload/collections/Articles'
import { AuditLogs } from './payload/collections/AuditLogs'
import { Categories } from './payload/collections/Categories'
import {
  CircleMeetups,
  CircleMemberships,
  Circles,
  MeetupRsvps,
} from './payload/collections/Circles'
import { Courses } from './payload/collections/Courses'
import { EventRegistrations, Events } from './payload/collections/Events'
import {
  ForumCategories,
  ForumPosts,
  ForumReactions,
  ForumThreads,
  Reports,
} from './payload/collections/Forum'
import { IkhtilafTopics } from './payload/collections/IkhtilafTopics'
import { Enrollments, LessonProgress } from './payload/collections/Learning'
import { Lessons } from './payload/collections/Lessons'
import { Avatars } from './payload/collections/Avatars'
import { Media } from './payload/collections/Media'
import {
  AnswerVotes,
  Bookmarks,
  ContactMessages,
  NewsletterSubscribers,
  Notifications,
  RateLimits,
  Volunteers,
} from './payload/collections/Member'
import { Pages } from './payload/collections/Pages'
import { People } from './payload/collections/People'
import { Questions } from './payload/collections/Questions'
import {
  Ayahs,
  DailyReminders,
  HadithCollections,
  Hadiths,
  Surahs,
} from './payload/collections/Scripture'
import { Series } from './payload/collections/Series'
import { Tags } from './payload/collections/Tags'
import { usersCollectionOverride } from './payload/collections/Users'
import { Playlists, Videos } from './payload/collections/Videos'
import { apiV1Endpoints } from './payload/endpoints'
import { GLOBALS } from './payload/globals'
import { searchSchemaHook } from './payload/search-schema'
import { banglaLabels } from './payload/plugins/bangla-labels'
import { payloadAuthOptions } from './server/auth/options'
import { payloadEmailAdapter } from './server/email/payload-adapter'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

// Migrations run against the direct (non-pooled) connection; the app uses the pooler.
const isMigrating = process.argv.some((a) => a.startsWith('migrate'))
const connectionString =
  (isMigrating ? process.env.DATABASE_URL_DIRECT : undefined) || process.env.DATABASE_URL || ''

const r2Enabled = Boolean(
  process.env.R2_ENDPOINT &&
  process.env.R2_BUCKET &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY,
)

export default buildConfig({
  serverURL: siteUrl,
  // lecture audio can be large; images are resized after upload anyway
  upload: { limits: { fileSize: 200 * 1024 * 1024 } },
  secret: process.env.PAYLOAD_SECRET || '',
  admin: {
    user: 'users',
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' · Ruhama অ্যাডমিন',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/icon.svg' }],
    },
    // light, standard admin palette (src/app/(payload)/custom.scss)
    theme: 'light',
    components: {
      graphics: {
        Logo: '@/payload/components/admin-brand#AdminLogo',
        Icon: '@/payload/components/admin-brand#AdminIcon',
      },
      providers: ['@/payload/components/admin-providers#AdminProviders'],
      actions: ['@/payload/components/admin-header-actions#AdminHeaderActions'],
      views: {
        dashboard: { Component: '@/payload/components/admin-dashboard#AdminDashboard' },
      },
    },
    livePreview: {
      breakpoints: [
        { label: 'মোবাইল', name: 'mobile', width: 390, height: 844 },
        { label: 'ট্যাবলেট', name: 'tablet', width: 768, height: 1024 },
        { label: 'ডেস্কটপ', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  // Bangla only: with English enabled, browsers set to English got a half-English admin
  i18n: {
    supportedLanguages: { 'bn-BD': bnBd },
    fallbackLanguage: 'bn-BD',
    translations: {
      'bn-BD': {
        // the rich-text editor ships no Bangla either: without these it shows raw keys
        lexical: {
          general: {
            placeholder: 'লিখতে শুরু করুন, অথবা কমান্ডের জন্য / চাপুন...',
            slashMenuBasicGroupLabel: 'সাধারণ',
            slashMenuListGroupLabel: 'লিস্ট',
            toolbarItemsActive: '{{count}}টি চালু',
          },
          align: {
            alignCenterLabel: 'মাঝখানে',
            alignJustifyLabel: 'দুই পাশে সমান',
            alignLeftLabel: 'বামে',
            alignRightLabel: 'ডানে',
          },
          blockquote: { label: 'উদ্ধৃতি (Quote)' },
          blocks: {
            label: 'ব্লক',
            inlineBlocks: {
              create: '{{label}} যোগ করুন',
              edit: '{{label}} এডিট করুন',
              label: 'ইনলাইন ব্লক',
              remove: '{{label}} সরান',
            },
          },
          heading: { label: 'Heading {{headingLevel}}' },
          horizontalRule: { label: 'বিভাজক লাইন' },
          indent: { decreaseLabel: 'ইনডেন্ট কমান', increaseLabel: 'ইনডেন্ট বাড়ান' },
          link: { label: 'Link', loadingWithEllipsis: 'লোড হচ্ছে...' },
          checklist: { label: 'চেকলিস্ট' },
          orderedList: { label: 'নম্বর দেওয়া লিস্ট' },
          unorderedList: { label: 'বুলেট লিস্ট' },
          paragraph: { label: 'অনুচ্ছেদ', label2: 'সাধারণ লেখা' },
          relationship: { label: 'সম্পর্কিত কনটেন্ট' },
          textState: { defaultStyle: 'সাধারণ স্টাইল' },
          upload: { label: 'ছবি বা ফাইল (Upload)' },
        },
        // the SEO plugin has no Bangla of its own
        'plugin-seo': {
          almostThere: 'প্রায় হয়ে গেছে',
          autoGenerate: 'নিজে থেকে তৈরি করুন',
          bestPractices: 'ভালো লেখার নিয়ম',
          characterCount: '{{current}}/{{minLength}}-{{maxLength}} অক্ষর, ',
          charactersLeftOver: '{{characters}} অক্ষর বাকি',
          charactersToGo: 'আরও {{characters}} অক্ষর লিখুন',
          charactersTooMany: '{{characters}} অক্ষর বেশি',
          checksPassing: '{{max}}টির মধ্যে {{current}}টি ঠিক আছে',
          good: 'ভালো',
          imageAutoGenerationTip: 'নিজে থেকে তৈরি করলে কনটেন্টের মূল ছবিটি নেওয়া হবে।',
          lengthTipDescription:
            '{{minLength}} থেকে {{maxLength}} অক্ষরের মধ্যে রাখুন। ভালো meta description লেখার জন্য দেখুন ',
          lengthTipTitle:
            '{{minLength}} থেকে {{maxLength}} অক্ষরের মধ্যে রাখুন। ভালো meta title লেখার জন্য দেখুন ',
          missing: 'নেই',
          noImage: 'কোনো ছবি নেই',
          preview: 'Google-এ যেমন দেখাবে',
          previewDescription: 'আসল সার্চ ফলাফল কনটেন্ট ও খোঁজার ধরন অনুযায়ী একটু আলাদা হতে পারে।',
          tooLong: 'বেশি লম্বা',
          tooShort: 'বেশি ছোট',
        },
      },
    } as never,
  },
  collections: [
    Articles,
    IkhtilafTopics,
    Questions,
    Series,
    Categories,
    Tags,
    People,
    Courses,
    Lessons,
    Events,
    EventRegistrations,
    Circles,
    CircleMeetups,
    CircleMemberships,
    MeetupRsvps,
    Videos,
    Playlists,
    Surahs,
    Ayahs,
    HadithCollections,
    Hadiths,
    DailyReminders,
    ForumCategories,
    ForumThreads,
    ForumPosts,
    ForumReactions,
    Reports,
    Enrollments,
    LessonProgress,
    Bookmarks,
    Notifications,
    AnswerVotes,
    NewsletterSubscribers,
    Volunteers,
    ContactMessages,
    Pages,
    Media,
    Avatars,
    AuditLogs,
    RateLimits,
  ],
  globals: GLOBALS,
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      BlocksFeature({ blocks: CONTENT_BLOCKS }),
    ],
  }),
  db: postgresAdapter({
    pool: {
      connectionString,
      // small pools on serverless and during builds, where many workers each open one
      max: Number(
        process.env.DATABASE_POOL_MAX ||
          (process.env.VERCEL || process.env.NEXT_PHASE === 'phase-production-build' ? 3 : 10),
      ),
      idleTimeoutMillis: 10_000,
    },
    extensions: ['pg_trgm'],
    afterSchemaInit: [searchSchemaHook],
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  graphQL: { disable: true },
  email: payloadEmailAdapter,
  cors: [siteUrl],
  csrf: [siteUrl],
  endpoints: apiV1Endpoints,
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  plugins: [
    betterAuthPlugin({
      ...payloadAuthOptions,
      users: { ...payloadAuthOptions.users, collectionOverrides: usersCollectionOverride },
    }),
    seoPlugin({
      collections: [
        'articles',
        'ikhtilaf-topics',
        'questions',
        'courses',
        'events',
        'videos',
        'circles',
        'pages',
        'people',
      ],
      uploadsCollection: 'media',
      generateTitle: ({ doc }) =>
        `${(doc as { title?: string; name?: string }).title ?? (doc as { name?: string }).name ?? ''} · Ruhama`,
      generateDescription: ({ doc }) => {
        const d = doc as {
          excerpt?: string
          lead?: string
          summary?: string
          description?: string
          bio?: string
        }
        return (d.excerpt ?? d.lead ?? d.summary ?? d.description ?? d.bio ?? '').slice(0, 160)
      },
      // natural Bangla labels for the SEO tab (the plugin ships English ones)
      fields: ({ defaultFields }) =>
        defaultFields.map((field) => {
          const labels: Record<string, string> = {
            title: 'SEO শিরোনাম',
            description: 'SEO বিবরণ',
            image: 'শেয়ার করার ছবি',
          }
          return 'name' in field && labels[field.name]
            ? { ...field, label: labels[field.name] }
            : field
        }),
    }),
    s3Storage({
      enabled: r2Enabled,
      // keeps the database schema the same with or without R2 (local development)
      alwaysInsertFields: true,
      // the admin uploads straight to R2 with a short-lived signed URL, so files larger than Vercel's
      // 4.5 MB request limit work (needs the bucket CORS rule from the README)
      clientUploads: {
        access: ({ req }) => hasRole(req.user as never, ...CONTENT_ROLES),
      },
      collections: {
        avatars: {
          prefix: 'avatars',
          generateFileURL: ({ filename, prefix }) => {
            const base = (process.env.NEXT_PUBLIC_MEDIA_URL || '').replace(/\/$/, '')
            return `${base}/${prefix ? `${prefix}/` : ''}${filename}`
          },
        },
        media: {
          prefix: 'media',
          generateFileURL: ({ filename, prefix }) => {
            const base = (process.env.NEXT_PUBLIC_MEDIA_URL || '').replace(/\/$/, '')
            return `${base}/${prefix ? `${prefix}/` : ''}${filename}`
          },
        },
      },
      bucket: process.env.R2_BUCKET || '',
      config: {
        endpoint: r2Endpoint(),
        region: 'auto',
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
      },
    }),
    // last: gives every remaining English field label a natural Bangla one
    banglaLabels,
  ],
})
