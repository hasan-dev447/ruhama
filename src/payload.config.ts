import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { BlocksFeature, FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { bnBd } from '@payloadcms/translations/languages/bnBd'
import { en } from '@payloadcms/translations/languages/en'
import { buildConfig } from 'payload'
import { betterAuthPlugin } from 'payload-auth/better-auth'
import sharp from 'sharp'

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
  secret: process.env.PAYLOAD_SECRET || '',
  admin: {
    user: 'users',
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' · Ruhama অ্যাডমিন',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/icon.svg' }],
    },
    components: {
      graphics: {
        Logo: '@/payload/components/admin-brand#AdminLogo',
        Icon: '@/payload/components/admin-brand#AdminIcon',
      },
      beforeDashboard: ['@/payload/components/review-queue#ReviewQueue'],
    },
    livePreview: {
      breakpoints: [
        { label: 'মোবাইল', name: 'mobile', width: 390, height: 844 },
        { label: 'ট্যাবলেট', name: 'tablet', width: 768, height: 1024 },
        { label: 'ডেস্কটপ', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  i18n: {
    supportedLanguages: { 'bn-BD': bnBd, en },
    fallbackLanguage: 'bn-BD',
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
    }),
    s3Storage({
      enabled: r2Enabled,
      collections: {
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
        endpoint: process.env.R2_ENDPOINT,
        region: 'auto',
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],
})
