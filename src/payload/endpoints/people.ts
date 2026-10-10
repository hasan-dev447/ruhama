import type { Endpoint } from 'payload'
import { z } from 'zod'

import { decidePendingProfile } from '@/server/services/public-profile'

import { numericId, param, readBody, v1 } from './helpers'

/** /api/v1/people/:id/pending: approve or reject a member's waiting profile changes (admin panel). */
export const peopleEndpoints: Endpoint[] = [
  v1('post', '/people/:id/pending', async (req, ctx) => {
    const body = await readBody(
      req,
      z.object({ decision: z.enum(['approve', 'reject']), note: z.string().max(500).optional() }),
    )
    return decidePendingProfile(ctx, { id: Number(numericId(param(req, 'id'))), ...body })
  }),
]
