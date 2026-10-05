import { z } from 'zod'

import {
  bookmarkStatus,
  bookmarkTargetSchema,
  listBookmarks,
  offlineArticles,
  toggleBookmark,
} from '@/server/services/bookmarks'

import { query, readBody, v1 } from './helpers'

export const bookmarkEndpoints = [
  v1('post', '/bookmarks/toggle', async (req, ctx) =>
    toggleBookmark(ctx, await readBody(req, bookmarkTargetSchema)),
  ),
  v1('get', '/me/bookmarks/status', async (req, ctx) =>
    bookmarkStatus(ctx, (query(req).get('keys') ?? '').split(',')),
  ),
  v1('get', '/me/bookmarks', async (req, ctx) => {
    const q = query(req)
    const page = z.coerce.number().int().min(1).catch(1).parse(q.get('page'))
    return listBookmarks(ctx, { page })
  }),
  v1('get', '/me/bookmarks/offline', async (_req, ctx) => ({
    articles: await offlineArticles(ctx),
  })),
]
