export const REVIEW_STATUSES = [
  'draft',
  'in_review',
  'needs_changes',
  'approved',
  'published',
] as const
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  draft: 'খসড়া',
  in_review: 'রিভিউ চলছে',
  needs_changes: 'পরিবর্তন প্রয়োজন',
  approved: 'অনুমোদিত',
  published: 'প্রকাশিত',
}

export const REQUIRED_APPROVALS = 2

export const WORKFLOW_COLLECTIONS = ['articles', 'ikhtilaf-topics', 'questions'] as const
export type WorkflowCollection = (typeof WORKFLOW_COLLECTIONS)[number]

export type WorkflowAction =
  'submit' | 'approve' | 'request_changes' | 'publish' | 'unpublish' | 'withdraw'

export type Approval = {
  id?: string | null
  reviewer: number | string | { id: number | string; name?: string | null }
  decision: 'approved' | 'changes_requested'
  note?: string | null
  contentHash?: string | null
  at: string
}
