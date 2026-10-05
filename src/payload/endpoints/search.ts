import type { Pool } from 'pg'
import { z } from 'zod'

import { PostgresSearchService } from '@/server/search/postgres'
import { SEARCH_TYPES } from '@/server/search/types'
import { consumeRateLimit } from '@/server/services/rate-limit'
import { errors } from '@/server/services/errors'

import { query, v1 } from './helpers'

export const searchEndpoints = [
  v1(
    'get',
    '/search',
    async (req, ctx) => {
      const limit = await consumeRateLimit(ctx.payload, `search:ip:${ctx.ip ?? 'unknown'}`, 120, 60)
      if (!limit.allowed) throw errors.rateLimited()
      const q = query(req)
      const service = new PostgresSearchService((ctx.payload.db as unknown as { pool: Pool }).pool)
      return service.search({
        q: z
          .string()
          .trim()
          .max(120)
          .catch('')
          .parse(q.get('q') ?? ''),
        type: z
          .enum(SEARCH_TYPES)
          .optional()
          .catch(undefined)
          .parse(q.get('type') ?? undefined),
        page: z.coerce.number().int().min(1).max(100).catch(1).parse(q.get('page')),
      })
    },
    { cache: 'public, s-maxage=300, stale-while-revalidate=3600' },
  ),
]
