import { z } from 'zod'

import { listArticles, listCategories, listIkhtilaf } from '@/server/queries/articles'
import { getCircle, listCircles, listEvents } from '@/server/queries/events'
import { getDaily } from '@/server/queries/home'
import { listCourses, listQuestions } from '@/server/queries/learning'
import { listScholars } from '@/server/queries/people'
import { listPlaylists, listVideos } from '@/server/queries/videos'

import { query, v1 } from './helpers'

/** Public, read-only lists for web filters and mobile apps. Cached at the edge for a minute. */
const PUBLIC = 'public, s-maxage=60, stale-while-revalidate=600'

const page = z.coerce.number().int().min(1).max(500).catch(1)
const limit = (max: number, d: number) => z.coerce.number().int().min(1).max(max).catch(d)
const text = z.string().trim().max(120).optional().catch(undefined)
const slugish = z
  .string()
  .regex(/^[a-z0-9-]+$/)
  .optional()
  .catch(undefined)

export const contentEndpoints = [
  v1(
    'get',
    '/articles',
    async (req, ctx) => {
      const q = query(req)
      return listArticles(ctx.payload, {
        categories: (q.get('category') ?? '').split(',').filter((s) => /^[a-z0-9-]+$/.test(s)),
        level: z
          .enum(['beginner', 'intermediate', 'advanced', 'all'])
          .optional()
          .catch(undefined)
          .parse(q.get('level') ?? undefined),
        q: text.parse(q.get('q') ?? undefined),
        sort: z.enum(['new', 'short', 'long']).catch('new').parse(q.get('sort')),
        page: page.parse(q.get('page')),
        limit: limit(48, 12).parse(q.get('limit')),
      })
    },
    { cache: PUBLIC },
  ),
  v1(
    'get',
    '/categories',
    async (req, ctx) => {
      const usedFor = z
        .enum(['articles', 'questions', 'videos', 'events', 'ikhtilaf'])
        .catch('articles')
        .parse(query(req).get('for'))
      return { docs: await listCategories(ctx.payload, usedFor) }
    },
    { cache: PUBLIC },
  ),
  v1(
    'get',
    '/ikhtilaf',
    async (req, ctx) =>
      listIkhtilaf(ctx.payload, { page: page.parse(query(req).get('page')), limit: 20 }),
    { cache: PUBLIC },
  ),
  v1(
    'get',
    '/questions',
    async (req, ctx) => {
      const q = query(req)
      return listQuestions(ctx.payload, {
        category: slugish.parse(q.get('category') ?? undefined),
        q: text.parse(q.get('q') ?? undefined),
        page: page.parse(q.get('page')),
        limit: limit(30, 10).parse(q.get('limit')),
      })
    },
    { cache: PUBLIC },
  ),
  v1(
    'get',
    '/courses',
    async (req, ctx) => ({
      docs: await listCourses(ctx.payload, {
        level: slugish.parse(query(req).get('level') ?? undefined),
      }),
    }),
    { cache: PUBLIC },
  ),
  v1(
    'get',
    '/events',
    async (req, ctx) => {
      const q = query(req)
      return listEvents(ctx.payload, {
        mode: z
          .enum(['online', 'in_person'])
          .optional()
          .catch(undefined)
          .parse(q.get('mode') ?? undefined),
        district: slugish.parse(q.get('district') ?? undefined),
        page: page.parse(q.get('page')),
        when: q.get('when') === 'past' ? 'past' : 'upcoming',
      })
    },
    { cache: PUBLIC },
  ),
  v1(
    'get',
    '/circles',
    async (req, ctx) => {
      const q = query(req)
      return listCircles(ctx.payload, {
        district: slugish.parse(q.get('district') ?? undefined),
        type: z
          .enum(['brothers', 'sisters', 'family'])
          .optional()
          .catch(undefined)
          .parse(q.get('type') ?? undefined),
        page: page.parse(q.get('page')),
      })
    },
    { cache: PUBLIC },
  ),
  v1(
    'get',
    '/circles/:slug',
    async (req, ctx) => getCircle(ctx.payload, String(req.routeParams?.slug ?? '')),
    { cache: PUBLIC },
  ),
  v1(
    'get',
    '/videos',
    async (req, ctx) => {
      const q = query(req)
      return listVideos(ctx.payload, {
        category: slugish.parse(q.get('category') ?? undefined),
        speaker: slugish.parse(q.get('speaker') ?? undefined),
        duration: z
          .enum(['short', 'medium', 'long'])
          .optional()
          .catch(undefined)
          .parse(q.get('duration') ?? undefined),
        q: text.parse(q.get('q') ?? undefined),
        page: page.parse(q.get('page')),
        limit: limit(48, 12).parse(q.get('limit')),
      })
    },
    { cache: PUBLIC },
  ),
  v1('get', '/playlists', async (_req, ctx) => ({ docs: await listPlaylists(ctx.payload) }), {
    cache: PUBLIC,
  }),
  v1(
    'get',
    '/scholars',
    async (req, ctx) => {
      const q = query(req)
      return {
        docs: await listScholars(ctx.payload, {
          field: text.parse(q.get('field') ?? undefined),
          q: text.parse(q.get('q') ?? undefined),
          sort: z.enum(['name', 'answers', 'lectures']).catch('name').parse(q.get('sort')),
        }),
      }
    },
    { cache: PUBLIC },
  ),
  v1('get', '/daily', async (_req, ctx) => getDaily(ctx.payload), {
    cache: 'public, s-maxage=3600, stale-while-revalidate=86400',
  }),
]
