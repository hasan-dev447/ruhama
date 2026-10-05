import type {
  Approval,
  ReviewStatus,
  WorkflowAction,
  WorkflowCollection,
} from '@/payload/workflow/constants'
import { WORKFLOW_COLLECTIONS } from '@/payload/workflow/constants'
import type { WorkflowContext } from '@/payload/workflow/hooks'
import { WORKFLOW_HASH_FIELDS } from '@/payload/workflow/hash-fields'
import {
  checkTransition,
  computeContentHash,
  statusAfterDecision,
  validApprovers,
} from '@/payload/workflow/logic'
import { hasRole, REVIEWER_ROLES, STAFF_ROLES } from '@/lib/roles'

import type { ServiceContext } from './context'
import { requireUser } from './context'
import { errors } from './errors'

export function isWorkflowCollection(slug: string): slug is WorkflowCollection {
  return (WORKFLOW_COLLECTIONS as readonly string[]).includes(slug)
}

const idOf = (v: unknown) =>
  v && typeof v === 'object' && 'id' in v
    ? (v as { id: number }).id
    : (v as number | null | undefined)

export type ReviewActionResult = {
  id: number | string
  reviewStatus: ReviewStatus
  status: 'draft' | 'published'
  validApprovals: number
}

/**
 * Perform an editorial workflow action. Permission and transition rules are checked here
 * and again in the collection hook, so neither the admin UI nor the API can skip them.
 */
export async function performReviewAction(
  ctx: ServiceContext,
  input: {
    collection: WorkflowCollection
    id: number | string
    action: WorkflowAction
    note?: string
  },
): Promise<ReviewActionResult> {
  const user = requireUser(ctx)
  if (!hasRole(user, ...STAFF_ROLES)) throw errors.forbidden()
  const { payload } = ctx
  const { collection, id, action } = input
  const note = input.note?.trim().slice(0, 2000) || null

  const doc = (await payload
    .findByID({ collection, id, draft: true, depth: 0, overrideAccess: true })
    .catch(() => null)) as Record<string, unknown> | null
  if (!doc) throw errors.notFound()

  const hash = computeContentHash(doc, WORKFLOW_HASH_FIELDS[collection])
  const status = (doc.reviewStatus as ReviewStatus) ?? 'draft'
  const approvals = ((doc.approvals as Approval[]) ?? []).map((a) => ({
    ...a,
    reviewer: idOf(a.reviewer) as number,
  }))
  const authorId = idOf(doc.createdBy)

  const check = checkTransition({
    action,
    actor: user,
    status,
    authorId,
    approvals,
    contentHash: hash,
  })
  if (!check.ok) throw errors.forbidden(check.message)

  if (action === 'publish' || action === 'unpublish') {
    // run as the acting user so the collection hook re-validates the rules
    await payload.update({
      collection,
      id,
      data: { _status: action === 'publish' ? 'published' : 'draft' } as never,
      draft: false,
      depth: 0,
      user,
      overrideAccess: false,
    })
  } else {
    let nextStatus: ReviewStatus = status
    let nextApprovals: Approval[] = approvals
    if (action === 'submit') nextStatus = 'in_review'
    if (action === 'withdraw') nextStatus = 'draft'
    if (action === 'approve' || action === 'request_changes') {
      if (!hasRole(user, ...REVIEWER_ROLES)) throw errors.forbidden()
      const decision = action === 'approve' ? 'approved' : 'changes_requested'
      nextApprovals = [
        ...approvals,
        { reviewer: user.id, decision, note, contentHash: hash, at: new Date().toISOString() },
      ]
      nextStatus = statusAfterDecision(nextApprovals, hash, authorId, decision)
    }
    const context: WorkflowContext = {
      workflowAction: action,
      workflowState: { status: nextStatus, approvals: nextApprovals },
      draftSave: true,
    }
    await payload.update({
      collection,
      id,
      data: {} as never,
      draft: true,
      depth: 0,
      user,
      overrideAccess: true,
      context,
    })
  }

  await payload.create({
    collection: 'audit-logs',
    data: {
      action,
      actor: user.id,
      targetCollection: collection,
      targetId: String(id),
      summary: note ?? String(doc.title ?? ''),
    },
    overrideAccess: true,
  })

  const after = (await payload.findByID({
    collection,
    id,
    draft: true,
    depth: 0,
    overrideAccess: true,
  })) as unknown as Record<string, unknown>
  return {
    id,
    reviewStatus: after.reviewStatus as ReviewStatus,
    status: (after._status as 'draft' | 'published') ?? 'draft',
    validApprovals: validApprovers(
      after.approvals as Approval[],
      String(after.contentHash ?? ''),
      idOf(after.createdBy),
    ).length,
  }
}

/** Items waiting for the current staff member, for the admin dashboard. */
export async function reviewQueue(ctx: ServiceContext) {
  const user = requireUser(ctx)
  if (!hasRole(user, ...STAFF_ROLES)) throw errors.forbidden()
  const { payload } = ctx
  const reviewer = hasRole(user, ...REVIEWER_ROLES)
  const publisher = hasRole(user, 'super_admin', 'shura')
  const result: {
    collection: WorkflowCollection
    id: number | string
    title: string
    reviewStatus: ReviewStatus
    updatedAt: string
  }[] = []

  for (const collection of WORKFLOW_COLLECTIONS) {
    const statuses: ReviewStatus[] = []
    if (reviewer) statuses.push('in_review')
    if (publisher) statuses.push('approved')
    const or: Record<string, unknown>[] = []
    if (statuses.length) or.push({ reviewStatus: { in: statuses } })
    or.push({
      and: [{ createdBy: { equals: user.id } }, { reviewStatus: { equals: 'needs_changes' } }],
    })
    const res = await payload.find({
      collection,
      where: { or } as never,
      draft: true,
      depth: 0,
      limit: 20,
      sort: '-updatedAt',
      select: { title: true, reviewStatus: true, updatedAt: true },
      overrideAccess: true,
    })
    for (const d of res.docs as Record<string, unknown>[]) {
      result.push({
        collection,
        id: d.id as number,
        title: String(d.title ?? ''),
        reviewStatus: d.reviewStatus as ReviewStatus,
        updatedAt: String(d.updatedAt ?? ''),
      })
    }
  }
  return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 30)
}
