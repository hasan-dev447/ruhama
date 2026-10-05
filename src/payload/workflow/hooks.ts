import { APIError, type CollectionAfterChangeHook, type CollectionBeforeChangeHook } from 'payload'

import { notifyReviewTransition } from '@/server/services/review-notifications'

import type { Approval, ReviewStatus, WorkflowAction } from './constants'
import { checkTransition, computeContentHash, hasEnoughApprovals } from './logic'

export type WorkflowContext = {
  /** Seed and import scripts bypass the workflow entirely (always with overrideAccess). */
  skipWorkflow?: boolean
  /** Set by the review service after it has authorised an action. */
  workflowAction?: WorkflowAction
  workflowState?: { status: ReviewStatus; approvals: Approval[] }
  /** Marks a Local API save as a draft revision (REST uses ?draft=true). */
  draftSave?: boolean
}

const idOf = (v: unknown) =>
  v && typeof v === 'object' && 'id' in v ? (v as { id: unknown }).id : v

/**
 * Enforces the editorial workflow on every write:
 * - workflow fields are owned by the server and never taken from client input
 * - edits after approval send the document back for review
 * - publishing requires a publisher role and two approvals of this exact content
 * - unpublishing requires a publisher role
 */
export const workflowBeforeChange =
  (hashFields: string[]): CollectionBeforeChangeHook =>
  async ({ data, originalDoc, operation, req, context }) => {
    const ctx = context as WorkflowContext
    const merged = { ...(originalDoc ?? {}), ...data } as Record<string, unknown>
    const hash = computeContentHash(merged, hashFields)

    if (ctx.skipWorkflow) {
      data.contentHash = hash
      return data
    }

    const user = req.user
    let status: ReviewStatus =
      operation === 'create' ? 'draft' : ((originalDoc?.reviewStatus as ReviewStatus) ?? 'draft')
    let approvals: Approval[] =
      operation === 'create' ? [] : ((originalDoc?.approvals as Approval[]) ?? [])

    if (operation === 'create') {
      data.createdBy = user?.id ?? null
      data.publishedBy = null
    } else {
      data.createdBy = idOf(originalDoc?.createdBy) ?? null
      data.publishedBy = idOf(originalDoc?.publishedBy) ?? null
    }

    if (ctx.workflowAction && ctx.workflowState) {
      status = ctx.workflowState.status
      approvals = ctx.workflowState.approvals
    } else if (operation === 'update' && originalDoc?.contentHash !== hash) {
      // content edited: approvals no longer cover it
      if (status === 'approved') status = 'in_review'
      if (status === 'published') status = 'draft'
    }

    const authorId = data.createdBy
    // a partial update without _status keeps the stored publication state
    const wantsPublish = (data._status ?? originalDoc?._status) === 'published'
    const wasPublished = originalDoc?._status === 'published'
    const contentChanged = operation === 'create' || originalDoc?.contentHash !== hash
    const isDraftSave =
      req.query?.draft === 'true' || req.query?.autosave === 'true' || ctx.draftSave === true

    if (wantsPublish && (!wasPublished || contentChanged)) {
      const check = checkTransition({
        action: 'publish',
        actor: user,
        status,
        authorId,
        approvals,
        contentHash: hash,
      })
      if (!check.ok) throw new APIError(check.message, 403, null, true)
      status = 'published'
      data.publishedBy = user?.id ?? null
      if (!merged.publishedAt) data.publishedAt = new Date().toISOString()
    } else if (wantsPublish) {
      status = 'published'
    } else if (operation === 'update' && wasPublished && !isDraftSave) {
      const check = checkTransition({
        action: 'unpublish',
        actor: user,
        status: 'published',
        authorId,
        approvals,
        contentHash: hash,
      })
      if (!check.ok) throw new APIError(check.message, 403, null, true)
      status = hasEnoughApprovals(approvals, hash, authorId) ? 'approved' : 'draft'
    }

    data.reviewStatus = status
    data.approvals = approvals
    data.contentHash = hash
    return data
  }

/** In-app and email notifications whenever the review status changes. */
export const workflowAfterChange =
  (collection: 'articles' | 'ikhtilaf-topics' | 'questions'): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, req, context }) => {
    if ((context as WorkflowContext).skipWorkflow) return doc
    const prev = previousDoc?.reviewStatus as ReviewStatus | undefined
    const next = doc.reviewStatus as ReviewStatus
    if (prev === next) return doc
    try {
      await notifyReviewTransition({ req, collection, doc, from: prev ?? null, to: next })
    } catch (err) {
      req.payload.logger.error({ err, msg: 'review notification failed' })
    }
    return doc
  }
