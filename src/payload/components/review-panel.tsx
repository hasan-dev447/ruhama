'use client'

import { useAuth, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

import { DEFAULT_WORKFLOW_RULES, type WorkflowRules } from '@/lib/collection-rules'
import { hasRole } from '@/lib/roles'
import { REVIEW_STATUS_LABELS, type ReviewStatus } from '@/payload/workflow/constants'

type Action = 'submit' | 'approve' | 'request_changes' | 'publish' | 'unpublish' | 'withdraw'

const BUTTONS: { action: Action; label: string; tone: 'primary' | 'secondary' | 'danger' }[] = [
  { action: 'submit', label: 'রিভিউর জন্য পাঠান', tone: 'primary' },
  { action: 'withdraw', label: 'রিভিউ থেকে ফেরত নিন', tone: 'secondary' },
  { action: 'approve', label: 'অনুমোদন দিন', tone: 'primary' },
  { action: 'request_changes', label: 'পরিবর্তনের অনুরোধ', tone: 'secondary' },
  { action: 'publish', label: 'চূড়ান্ত প্রকাশ', tone: 'primary' },
  { action: 'unpublish', label: 'প্রকাশ বাতিল', tone: 'danger' },
]

/** Sidebar panel in the admin edit view that drives the editorial workflow. */
export function ReviewPanel() {
  const { id, collectionSlug } = useDocumentInfo()
  const { user } = useAuth()
  const status =
    (useFormFields(([fields]) => fields.reviewStatus?.value) as ReviewStatus | undefined) ?? 'draft'
  const approvalsCount =
    (useFormFields(([fields]) => fields.approvals?.rows?.length) as number | undefined) ?? 0
  const createdBy = useFormFields(([fields]) => fields.createdBy?.value) as
    number | string | undefined
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<Action | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  // this menu's rules (its "নিয়ম" panel); the server applies the same ones
  const [rules, setRules] = useState<WorkflowRules>(DEFAULT_WORKFLOW_RULES)
  // the user's level in this menu (রোল ও অনুমতি page): "এডিট" or more may submit anyone's work
  const [myLevel, setMyLevel] = useState<string>('none')
  useEffect(() => {
    if (!collectionSlug) return
    let alive = true
    fetch(`/api/v1/rules/${collectionSlug}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { values?: WorkflowRules; myLevel?: string } | null) => {
        if (!alive || !d?.values) return
        setRules(d.values)
        setMyLevel(d.myLevel ?? 'none')
      })
      .catch(() => null)
    return () => {
      alive = false
    }
  }, [collectionSlug])

  if (!id) {
    return <p style={{ fontSize: 13, opacity: 0.8 }}>সংরক্ষণের পর রিভিউ কার্যক্রম দেখা যাবে।</p>
  }

  const isAuthor = createdBy !== undefined && String(createdBy) === String(user?.id)
  const reviewer = hasRole(user, ...rules.reviewerRoles)
  const publisher = hasRole(user, ...rules.publisherRoles)
  // with no approvals required a publisher may publish straight away; otherwise once approved
  const publishable =
    rules.requiredApprovals === 0
      ? status !== 'published'
      : status === 'approved' || status === 'in_review'
  const content = myLevel === 'edit' || myLevel === 'full' || isAuthor

  const visible = BUTTONS.filter(({ action }) => {
    if (action === 'submit') return content && (status === 'draft' || status === 'needs_changes')
    if (action === 'withdraw') return content && status === 'in_review'
    if (action === 'approve' || action === 'request_changes')
      return (
        reviewer &&
        (!isAuthor || rules.allowSelfReview) &&
        rules.requiredApprovals > 0 &&
        (status === 'in_review' || status === 'approved')
      )
    if (action === 'publish') return publisher && publishable
    if (action === 'unpublish') return publisher && status === 'published'
    return false
  })

  async function run(action: Action) {
    setBusy(action)
    setMessage(null)
    try {
      const res = await fetch(`/api/v1/review/${collectionSlug}/${id}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: note || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ ok: false, text: data?.error?.message ?? 'কাজটি সম্পন্ন করা যায়নি।' })
      } else {
        setMessage({
          ok: true,
          text: `অবস্থা: ${REVIEW_STATUS_LABELS[data.reviewStatus as ReviewStatus]}`,
        })
        setTimeout(() => window.location.reload(), 600)
      }
    } catch {
      setMessage({ ok: false, text: 'নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।' })
    } finally {
      setBusy(null)
    }
  }

  const tone: Record<string, React.CSSProperties> = {
    primary: { background: '#0E4D45', color: '#fff', border: '1px solid #0E4D45' },
    secondary: {
      background: 'transparent',
      color: 'var(--theme-text)',
      border: '1px solid var(--theme-elevation-250)',
    },
    danger: { background: 'transparent', color: '#B5473A', border: '1px solid #B5473A' },
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '12px 0 20px',
        borderBottom: '1px solid var(--theme-elevation-100)',
        marginBottom: 16,
      }}
    >
      <strong style={{ fontSize: 14 }}>সম্পাদকীয় রিভিউ</strong>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <span>অবস্থা</span>
        <span style={{ fontWeight: 600, color: '#B88A3E' }}>{REVIEW_STATUS_LABELS[status]}</span>
      </div>
      <div style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.5 }}>
        {rules.requiredApprovals > 0
          ? `প্রকাশের আগে অন্তত ${rules.requiredApprovals} জন ভিন্ন রিভিউয়ারের অনুমোদন লাগবে।`
          : 'এই মেনুতে রিভিউ ছাড়াই প্রকাশ করা যায়।'}{' '}
        মোট রিভিউ রেকর্ড: {approvalsCount}।
        {rules.resetApprovalsOnEdit && rules.requiredApprovals > 0
          ? ' লেখা বদলালে আগের অনুমোদন আর গণ্য হয় না।'
          : ''}
      </div>
      {visible.some((b) => b.action === 'approve' || b.action === 'request_changes') && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="রিভিউ মন্তব্য (ঐচ্ছিক)"
          rows={3}
          style={{
            width: '100%',
            padding: 8,
            borderRadius: 6,
            border: '1px solid var(--theme-elevation-250)',
            background: 'var(--theme-input-bg)',
            color: 'var(--theme-text)',
            fontFamily: 'inherit',
          }}
        />
      )}
      {visible.map((b) => (
        <button
          key={b.action}
          type="button"
          disabled={busy !== null}
          onClick={() => run(b.action)}
          style={{
            ...tone[b.tone],
            padding: '8px 12px',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          {busy === b.action ? 'অপেক্ষা করুন…' : b.label}
        </button>
      ))}
      {visible.length === 0 && (
        <p style={{ fontSize: 12, opacity: 0.75 }}>এই মুহূর্তে আপনার জন্য কোনো কাজ নেই।</p>
      )}
      {message && (
        <p role="status" style={{ fontSize: 13, color: message.ok ? '#2F7D5B' : '#B5473A' }}>
          {message.text}
        </p>
      )}
    </div>
  )
}
