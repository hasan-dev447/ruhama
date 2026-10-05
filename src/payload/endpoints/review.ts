import { z } from 'zod'

import { errors } from '@/server/services/errors'
import { isWorkflowCollection, performReviewAction, reviewQueue } from '@/server/services/review'

import { numericId, param, readBody, v1 } from './helpers'

const actionSchema = z.object({
  action: z.enum(['submit', 'approve', 'request_changes', 'publish', 'unpublish', 'withdraw']),
  note: z.string().max(2000).optional(),
})

export const reviewEndpoints = [
  v1('post', '/review/:collection/:id', async (req, ctx) => {
    const collection = param(req, 'collection')
    if (!isWorkflowCollection(collection)) throw errors.notFound()
    const body = await readBody(req, actionSchema)
    return performReviewAction(ctx, {
      collection,
      id: numericId(param(req, 'id')),
      action: body.action,
      note: body.note,
    })
  }),
  v1('get', '/review/queue', async (_req, ctx) => ({ docs: await reviewQueue(ctx) })),
]
