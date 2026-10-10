import { describe, expect, it } from 'vitest'

import {
  cleanAllRules,
  DEFAULT_WORKFLOW_RULES,
  resolveRules,
  type WorkflowRules,
} from '@/lib/collection-rules'
import { checkTransition, hasEnoughApprovals } from '@/payload/workflow/logic'
import type { Approval } from '@/payload/workflow/constants'

const at = '2026-10-08T10:00:00Z'
const ok = (reviewer: number, contentHash = 'h1'): Approval => ({
  reviewer,
  decision: 'approved',
  contentHash,
  at,
})
const rules = (over: Partial<WorkflowRules>): WorkflowRules => ({
  ...DEFAULT_WORKFLOW_RULES,
  ...over,
})
const shura = { id: 9, role: ['shura'] }

describe('rule values are cleaned', () => {
  it('keeps numbers inside their limits and drops unknown rules and menus', () => {
    expect(resolveRules('articles', { requiredApprovals: 99 }).requiredApprovals).toBe(10)
    expect(resolveRules('articles', { requiredApprovals: -3 }).requiredApprovals).toBe(0)
    expect(resolveRules('articles', { requiredApprovals: 'x' }).requiredApprovals).toBe(2)
    expect(cleanAllRules({ nope: { a: 1 }, articles: { junk: true } })).toEqual({
      articles: DEFAULT_WORKFLOW_RULES,
    })
  })

  it('never lets super admin be taken out of review or publishing', () => {
    expect(
      resolveRules('articles', { publisherRoles: ['editor', 'hacker'] }).publisherRoles,
    ).toEqual(['super_admin', 'editor'])
  })
})

describe('the editorial workflow follows the menu rules', () => {
  it('needs the configured number of approvals (2 by default)', () => {
    expect(hasEnoughApprovals([ok(1)], 'h1', 5)).toBe(false)
    expect(hasEnoughApprovals([ok(1), ok(2)], 'h1', 5)).toBe(true)
    expect(hasEnoughApprovals([ok(1)], 'h1', 5, rules({ requiredApprovals: 1 }))).toBe(true)
    expect(hasEnoughApprovals([], 'h1', 5, rules({ requiredApprovals: 0 }))).toBe(true)
  })

  it('publishing with 0 approvals is allowed straight away, for a publisher only', () => {
    const base = {
      action: 'publish' as const,
      status: 'draft' as const,
      authorId: 5,
      approvals: [],
      contentHash: 'h1',
    }
    expect(
      checkTransition({ ...base, actor: shura, rules: rules({ requiredApprovals: 0 }) }).ok,
    ).toBe(true)
    expect(checkTransition({ ...base, actor: shura }).ok).toBe(false)
    expect(
      checkTransition({
        ...base,
        actor: { id: 3, role: ['editor'] },
        rules: rules({ requiredApprovals: 0 }),
      }).ok,
    ).toBe(false)
    expect(
      checkTransition({
        ...base,
        actor: { id: 3, role: ['editor'] },
        rules: rules({ requiredApprovals: 0, publisherRoles: ['super_admin', 'editor'] }),
      }).ok,
    ).toBe(true)
  })

  it('self-review counts only when allowed', () => {
    const own = {
      action: 'approve' as const,
      actor: { id: 5, role: ['reviewer'] },
      status: 'in_review' as const,
      authorId: 5,
      approvals: [],
      contentHash: 'h1',
    }
    expect(checkTransition(own).ok).toBe(false)
    expect(checkTransition({ ...own, rules: rules({ allowSelfReview: true }) }).ok).toBe(true)
    expect(hasEnoughApprovals([ok(5)], 'h1', 5, rules({ requiredApprovals: 1 }))).toBe(false)
    expect(
      hasEnoughApprovals([ok(5)], 'h1', 5, rules({ requiredApprovals: 1, allowSelfReview: true })),
    ).toBe(true)
  })

  it('approvals of an older text count only when edits keep approvals', () => {
    expect(hasEnoughApprovals([ok(1, 'old'), ok(2, 'old')], 'new', 5)).toBe(false)
    expect(
      hasEnoughApprovals(
        [ok(1, 'old'), ok(2, 'old')],
        'new',
        5,
        rules({ resetApprovalsOnEdit: false }),
      ),
    ).toBe(true)
  })
})
