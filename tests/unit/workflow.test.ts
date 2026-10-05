import { describe, expect, it } from 'vitest'

import type { Approval } from '@/payload/workflow/constants'
import {
  checkTransition,
  computeContentHash,
  hasEnoughApprovals,
  statusAfterDecision,
  validApprovers,
} from '@/payload/workflow/logic'

const hash = 'abc123'
const approve = (reviewer: number, at: string, contentHash = hash): Approval => ({
  reviewer,
  decision: 'approved',
  contentHash,
  at,
})
const changes = (reviewer: number, at: string): Approval => ({
  reviewer,
  decision: 'changes_requested',
  contentHash: hash,
  at,
})

const author = { id: 10, role: ['author'] }
const reviewerA = { id: 20, role: ['reviewer'] }
const reviewerB = { id: 21, role: ['reviewer'] }
const shura = { id: 30, role: ['shura'] }
const member = { id: 40, role: ['member'] }

describe('two-reviewer approval rule', () => {
  it('needs two different reviewers who approved the current content', () => {
    expect(hasEnoughApprovals([approve(20, '2026-10-01')], hash, 10)).toBe(false)
    expect(
      hasEnoughApprovals([approve(20, '2026-10-01'), approve(21, '2026-10-02')], hash, 10),
    ).toBe(true)
  })

  it('counts the same reviewer only once', () => {
    expect(
      validApprovers([approve(20, '2026-10-01'), approve(20, '2026-10-02')], hash, 10),
    ).toEqual(['20'])
  })

  it('ignores approvals of an older version of the content', () => {
    expect(
      hasEnoughApprovals([approve(20, '2026-10-01', 'old'), approve(21, '2026-10-02')], hash, 10),
    ).toBe(false)
  })

  it('never counts the author as a reviewer', () => {
    expect(
      validApprovers([approve(10, '2026-10-01'), approve(21, '2026-10-02')], hash, 10),
    ).toEqual(['21'])
  })

  it('uses only the latest decision of each reviewer', () => {
    const list = [approve(20, '2026-10-01'), approve(21, '2026-10-01'), changes(20, '2026-10-03')]
    expect(validApprovers(list, hash, 10)).toEqual(['21'])
    expect(statusAfterDecision(list, hash, 10, 'changes_requested')).toBe('needs_changes')
  })

  it('moves to approved after the second approval', () => {
    expect(statusAfterDecision([approve(20, '2026-10-01')], hash, 10, 'approved')).toBe('in_review')
    expect(
      statusAfterDecision(
        [approve(20, '2026-10-01'), approve(21, '2026-10-02')],
        hash,
        10,
        'approved',
      ),
    ).toBe('approved')
  })
})

describe('workflow transitions', () => {
  const base = { authorId: 10, approvals: [] as Approval[], contentHash: hash }

  it('lets the author submit a draft but not a member', () => {
    expect(checkTransition({ ...base, action: 'submit', actor: author, status: 'draft' }).ok).toBe(
      true,
    )
    expect(checkTransition({ ...base, action: 'submit', actor: member, status: 'draft' }).ok).toBe(
      false,
    )
  })

  it('stops reviewers from approving their own writing', () => {
    expect(
      checkTransition({
        ...base,
        authorId: 20,
        action: 'approve',
        actor: reviewerA,
        status: 'in_review',
      }).ok,
    ).toBe(false)
    expect(
      checkTransition({ ...base, action: 'approve', actor: reviewerA, status: 'in_review' }).ok,
    ).toBe(true)
  })

  it('refuses a second approval of the same version, but allows one after an edit', () => {
    const approvals = [approve(20, '2026-01-01')]
    expect(
      checkTransition({
        ...base,
        approvals,
        action: 'approve',
        actor: reviewerA,
        status: 'in_review',
      }).ok,
    ).toBe(false)
    // the same reviewer may still ask for changes, and may approve again once the text changed
    expect(
      checkTransition({
        ...base,
        approvals,
        action: 'request_changes',
        actor: reviewerA,
        status: 'in_review',
      }).ok,
    ).toBe(true)
    expect(
      checkTransition({
        ...base,
        approvals,
        contentHash: 'edited',
        action: 'approve',
        actor: reviewerA,
        status: 'in_review',
      }).ok,
    ).toBe(true)
    expect(
      checkTransition({
        ...base,
        approvals,
        action: 'approve',
        actor: reviewerB,
        status: 'in_review',
      }).ok,
    ).toBe(true)
  })

  it('only lets shura publish, and only with two approvals', () => {
    const approvals = [approve(20, '2026-10-01'), approve(21, '2026-10-02')]
    expect(
      checkTransition({
        ...base,
        approvals,
        action: 'publish',
        actor: reviewerB,
        status: 'approved',
      }).ok,
    ).toBe(false)
    expect(
      checkTransition({
        ...base,
        approvals: approvals.slice(0, 1),
        action: 'publish',
        actor: shura,
        status: 'approved',
      }).ok,
    ).toBe(false)
    expect(
      checkTransition({ ...base, approvals, action: 'publish', actor: shura, status: 'approved' })
        .ok,
    ).toBe(true)
  })
})

describe('content hash', () => {
  it('is stable regardless of key order and ignores populated relation details', () => {
    const fields = ['title', 'content', 'author']
    const a = computeContentHash(
      {
        title: 'ক',
        content: { root: { b: 1, a: 2 } },
        author: { id: 5, name: 'x', updatedAt: '1', createdAt: '1' },
      },
      fields,
    )
    const b = computeContentHash(
      { title: 'ক', content: { root: { a: 2, b: 1 } }, author: 5 },
      fields,
    )
    expect(a).toBe(b)
  })

  it('changes when the content changes', () => {
    expect(computeContentHash({ title: 'ক' }, ['title'])).not.toBe(
      computeContentHash({ title: 'খ' }, ['title']),
    )
  })
})
