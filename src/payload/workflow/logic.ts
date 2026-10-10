import { createHash } from 'node:crypto'

import { DEFAULT_WORKFLOW_RULES, type WorkflowRules } from '@/lib/collection-rules'
import { hasRole, ROLE_LABELS, type Role } from '@/lib/roles'

import type { Approval, ReviewStatus, WorkflowAction } from './constants'

/** "সুপার অ্যাডমিন ও শূরা": who a rule allows, for messages. */
const roleNames = (roles: Role[]) => roles.map((r) => ROLE_LABELS[r]).join(', ')

type Id = number | string

const idOf = (v: unknown): Id | null => {
  if (v === null || v === undefined) return null
  if (typeof v === 'object' && 'id' in (v as Record<string, unknown>)) return (v as { id: Id }).id
  return v as Id
}

export const sameId = (a: unknown, b: unknown) => {
  const x = idOf(a)
  const y = idOf(b)
  return x !== null && y !== null && String(x) === String(y)
}

/** Stable hash of the fields that make up the publishable content. */
export function computeContentHash(doc: Record<string, unknown>, fields: string[]): string {
  const normalize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(normalize)
    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>
      if (
        'id' in obj &&
        Object.keys(obj).length > 2 &&
        typeof obj.id !== 'object' &&
        ('updatedAt' in obj || 'createdAt' in obj)
      ) {
        // populated relationship: hash the id only
        return obj.id
      }
      return Object.fromEntries(
        Object.keys(obj)
          .filter((k) => k !== 'id' && k !== '$' && !k.startsWith('_'))
          .sort()
          .map((k) => [k, normalize(obj[k])]),
      )
    }
    return value ?? null
  }
  const payload = JSON.stringify(fields.map((f) => [f, normalize(doc[f])]))
  return createHash('sha256').update(payload).digest('hex').slice(0, 32)
}

/**
 * Distinct reviewers whose latest decision is an approval. By the menu's rules (lib/collection-rules)
 * the approval must be of this exact content (unless edits keep approvals) and not by the author
 * (unless self-review is allowed).
 */
export function validApprovers(
  approvals: Approval[] | null | undefined,
  contentHash: string,
  authorId: unknown,
  rules: WorkflowRules = DEFAULT_WORKFLOW_RULES,
): string[] {
  const latestByReviewer = new Map<string, Approval>()
  for (const a of approvals ?? []) {
    const rid = idOf(a.reviewer)
    if (rid === null) continue
    const prev = latestByReviewer.get(String(rid))
    if (!prev || new Date(a.at).getTime() >= new Date(prev.at).getTime())
      latestByReviewer.set(String(rid), a)
  }
  const out: string[] = []
  for (const [rid, a] of latestByReviewer) {
    if (a.decision !== 'approved') continue
    if (rules.resetApprovalsOnEdit && a.contentHash !== contentHash) continue
    if (
      !rules.allowSelfReview &&
      authorId !== null &&
      authorId !== undefined &&
      sameId(rid, authorId)
    )
      continue
    out.push(rid)
  }
  return out
}

export function hasEnoughApprovals(
  approvals: Approval[] | null | undefined,
  contentHash: string,
  authorId: unknown,
  rules: WorkflowRules = DEFAULT_WORKFLOW_RULES,
) {
  return validApprovers(approvals, contentHash, authorId, rules).length >= rules.requiredApprovals
}

type Actor = { id: Id; role?: unknown } | null | undefined

export type TransitionCheck = { ok: true } | { ok: false; message: string }

/** Who may perform which workflow action from which status. */
export function checkTransition(params: {
  action: WorkflowAction
  actor: Actor
  status: ReviewStatus
  authorId: unknown
  approvals: Approval[] | null | undefined
  contentHash: string
  /** the menu's rules (server/rules.ts); the old fixed values when left out */
  rules?: WorkflowRules
  /** "এডিট" or more in this menu (রোল ও অনুমতি page): may submit or withdraw anyone's work */
  contentStaff?: boolean
}): TransitionCheck {
  const { action, actor, status, authorId, approvals, contentHash } = params
  const rules = params.rules ?? DEFAULT_WORKFLOW_RULES
  if (!actor) return { ok: false, message: 'লগইন প্রয়োজন।' }
  const isAuthor = sameId(actor.id, authorId)
  const isContentStaff =
    params.contentStaff ?? (hasRole(actor, 'super_admin', 'shura', 'editor') as boolean)
  const reviewer = hasRole(actor, ...rules.reviewerRoles)
  const publisher = hasRole(actor, ...rules.publisherRoles)

  switch (action) {
    case 'submit':
      if (!(isAuthor || isContentStaff))
        return { ok: false, message: 'শুধু লেখক বা সম্পাদক রিভিউর জন্য পাঠাতে পারেন।' }
      if (!['draft', 'needs_changes'].includes(status))
        return { ok: false, message: 'এই অবস্থা থেকে রিভিউর জন্য পাঠানো যায় না।' }
      return { ok: true }
    case 'withdraw':
      if (!(isAuthor || isContentStaff)) return { ok: false, message: 'অনুমতি নেই।' }
      if (status !== 'in_review')
        return { ok: false, message: 'শুধু রিভিউ চলাকালীন ফেরত নেওয়া যায়।' }
      return { ok: true }
    case 'approve':
    case 'request_changes':
      if (!reviewer)
        return {
          ok: false,
          message: `এই কাজ শুধু ${roleNames(rules.reviewerRoles)} করতে পারেন।`,
        }
      if (isAuthor && !rules.allowSelfReview)
        return { ok: false, message: 'নিজের লেখা নিজে রিভিউ করা যায় না।' }
      if (!['in_review', 'approved'].includes(status))
        return { ok: false, message: 'লেখাটি এখন রিভিউয়ের অবস্থায় নেই।' }
      // an approval belongs to one version of the text: approving it again adds nothing (after an edit it is allowed)
      if (
        action === 'approve' &&
        validApprovers(approvals, contentHash, authorId, rules).some((r) => sameId(r, actor.id))
      )
        return { ok: false, message: 'আপনি এই সংস্করণটি আগেই অনুমোদন করেছেন।' }
      return { ok: true }
    case 'publish':
      if (!publisher)
        return {
          ok: false,
          message: `চূড়ান্ত প্রকাশের অনুমতি শুধু ${roleNames(rules.publisherRoles)}-এর।`,
        }
      if (!hasEnoughApprovals(approvals, contentHash, authorId, rules))
        return {
          ok: false,
          message: `প্রকাশের আগে অন্তত ${rules.requiredApprovals} জন ভিন্ন রিভিউয়ারের অনুমোদন প্রয়োজন।`,
        }
      return { ok: true }
    case 'unpublish':
      if (!publisher)
        return {
          ok: false,
          message: `প্রকাশ বাতিলের অনুমতি শুধু ${roleNames(rules.publisherRoles)}-এর।`,
        }
      if (status !== 'published') return { ok: false, message: 'লেখাটি প্রকাশিত নয়।' }
      return { ok: true }
    default:
      return { ok: false, message: 'অজানা কাজ।' }
  }
}

/** Status after recording a reviewer decision. */
export function statusAfterDecision(
  approvals: Approval[],
  contentHash: string,
  authorId: unknown,
  decision: Approval['decision'],
  rules: WorkflowRules = DEFAULT_WORKFLOW_RULES,
): ReviewStatus {
  if (decision === 'changes_requested') return 'needs_changes'
  return hasEnoughApprovals(approvals, contentHash, authorId, rules) ? 'approved' : 'in_review'
}
