import type { CollectionBeforeChangeHook } from 'payload'

import type { Approval } from './constants'
import { getWorkflowRules } from '@/server/rules'

import { validApprovers } from './logic'

/**
 * On publish, record which reviewer profiles approved the content,
 * so public pages can show “রিভিউ করেছেন” without extra queries.
 */
export const fillReviewedBy: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
  context,
  collection,
}) => {
  if (context.skipWorkflow) return data
  if (data.reviewStatus !== 'published') return data
  const approvals = (data.approvals ?? originalDoc?.approvals ?? []) as Approval[]
  const reviewerUserIds = validApprovers(
    approvals,
    String(data.contentHash ?? ''),
    data.createdBy,
    await getWorkflowRules(collection.slug),
  )
  if (reviewerUserIds.length === 0) return data
  const people = await req.payload.find({
    collection: 'people',
    where: { user: { in: reviewerUserIds } },
    select: { slug: true },
    depth: 0,
    limit: 10,
    pagination: false,
    overrideAccess: true,
    req,
  })
  if (people.docs.length) data.reviewedBy = people.docs.map((p) => p.id)
  return data
}
