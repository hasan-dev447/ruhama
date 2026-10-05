import { z } from 'zod'

import { hasRole, MODERATOR_ROLES } from '@/lib/roles'
import {
  getThread,
  listForumCategories,
  listThreads,
  moderationQueue,
} from '@/server/queries/forum'
import { errors } from '@/server/services/errors'
import {
  countView,
  createPost,
  createThread,
  markHelpfulAnswer,
  moderate,
  moderateSchema,
  myThreadState,
  newPostSchema,
  newThreadSchema,
  reportContent,
  reportSchema,
  softDelete,
  toggleHelpful,
} from '@/server/services/forum'

import { param, query, readBody, v1 } from './helpers'

const id = z.coerce.number().int().positive()
const PUBLIC = 'public, s-maxage=30, stale-while-revalidate=300'

export const forumEndpoints = [
  v1(
    'get',
    '/forum/categories',
    async (_req, ctx) => ({ docs: await listForumCategories(ctx.payload) }),
    { cache: PUBLIC },
  ),
  v1(
    'get',
    '/forum/threads',
    async (req, ctx) => {
      const q = query(req)
      return listThreads(ctx.payload, {
        category: z
          .string()
          .regex(/^[a-z0-9-]+$/)
          .optional()
          .catch(undefined)
          .parse(q.get('category') ?? undefined),
        sort: z.enum(['recent', 'popular', 'unanswered']).catch('recent').parse(q.get('sort')),
        page: z.coerce.number().int().min(1).max(500).catch(1).parse(q.get('page')),
      })
    },
    { cache: PUBLIC },
  ),
  v1('post', '/forum/threads', async (req, ctx) =>
    createThread(ctx, await readBody(req, newThreadSchema)),
  ),
  v1(
    'get',
    '/forum/threads/:id',
    async (req, ctx) => {
      const res = await getThread(ctx.payload, id.parse(param(req, 'id')))
      if (!res) throw errors.notFound('আলোচনাটি পাওয়া যায়নি।')
      return res
    },
    { cache: PUBLIC },
  ),
  v1('post', '/forum/threads/:id/posts', async (req, ctx) => {
    const body = await readBody(req, newPostSchema.omit({ threadId: true }))
    return createPost(ctx, { ...body, threadId: id.parse(param(req, 'id')) })
  }),
  v1('post', '/forum/threads/:id/view', async (req, ctx) =>
    countView(
      ctx,
      id.parse(param(req, 'id')),
      ctx.user ? `u${ctx.user.id}` : (ctx.ip ?? 'unknown'),
    ),
  ),
  v1('get', '/me/forum/threads/:id', async (req, ctx) =>
    myThreadState(ctx, id.parse(param(req, 'id'))),
  ),
  v1('post', '/forum/posts/:id/helpful', async (req, ctx) =>
    toggleHelpful(ctx, id.parse(param(req, 'id'))),
  ),
  v1('post', '/forum/posts/:id/mark-helpful', async (req, ctx) =>
    markHelpfulAnswer(ctx, id.parse(param(req, 'id'))),
  ),
  v1('post', '/forum/report', async (req, ctx) =>
    reportContent(ctx, await readBody(req, reportSchema)),
  ),
  v1('post', '/forum/:type/:id/delete', async (req, ctx) =>
    softDelete(
      ctx,
      z.enum(['thread', 'post']).parse(param(req, 'type')),
      id.parse(param(req, 'id')),
    ),
  ),
  v1('post', '/forum/moderate', async (req, ctx) =>
    moderate(ctx, await readBody(req, moderateSchema)),
  ),
  v1('get', '/forum/moderation', async (_req, ctx) => {
    if (!hasRole(ctx.user, ...MODERATOR_ROLES)) throw errors.forbidden()
    return moderationQueue(ctx.payload)
  }),
]
