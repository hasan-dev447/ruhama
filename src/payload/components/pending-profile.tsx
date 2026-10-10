'use client'

import { toast, useAuth, useDocumentInfo } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

type Values = {
  name?: string
  title?: string
  specialty?: string
  bio?: string
  location?: string
  education?: { degree?: string; institution?: string }[]
  expertise?: string[]
}

const LABELS: [keyof Values, string][] = [
  ['name', 'নাম'],
  ['title', 'পদবি'],
  ['specialty', 'বিশেষ ক্ষেত্র'],
  ['location', 'অবস্থান'],
  ['bio', 'পরিচিতি'],
  ['education', 'শিক্ষা'],
  ['expertise', 'বিশেষজ্ঞতা'],
]

const show = (v: unknown): string => {
  if (Array.isArray(v))
    return v
      .map((x) =>
        typeof x === 'string'
          ? x
          : [(x as { degree?: string }).degree, (x as { institution?: string }).institution]
              .filter(Boolean)
              .join(', '),
      )
      .join(' · ')
  return typeof v === 'string' ? v : ''
}

/**
 * On a person's admin page: what the member changed in their own profile and is waiting for
 * approval, shown beside what the site shows now, with approve and reject.
 */
export function PendingProfilePanel() {
  const { id } = useDocumentInfo()
  const { permissions } = useAuth()
  const [doc, setDoc] = useState<
    (Values & { pendingChanges?: Values | null; pendingAt?: string | null }) | null
  >(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    let alive = true
    // only what the comparison shows, never the whole person record
    const select = [...LABELS.map(([k]) => k), 'pendingChanges', 'pendingAt']
      .map((k) => `select[${k}]=true`)
      .join('&')
    fetch(`/api/people/${id}?depth=0&${select}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && setDoc(d))
      .catch(() => null)
    return () => {
      alive = false
    }
  }, [id])

  const pending = doc?.pendingChanges
  if (!id || !pending) return null
  // "এডিট" in আলিম, লেখক ও বক্তা (রোল ও অনুমতি page) decides
  const update = permissions?.collections?.people?.update as
    boolean | { permission?: boolean } | undefined
  const canDecide = update === true || (typeof update === 'object' && update?.permission === true)
  const changed = LABELS.filter(([k]) => show(pending[k]) !== show(doc?.[k]))

  async function decide(decision: 'approve' | 'reject') {
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/people/${id}/pending`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ decision, note: note || undefined }),
      })
      const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
      if (!res.ok) throw new Error(json?.error?.message ?? 'কাজটি করা যায়নি')
      toast.success(decision === 'approve' ? 'অনুমোদিত, সাইটে প্রকাশ হয়েছে' : 'বাতিল করা হয়েছে')
      setTimeout(() => window.location.reload(), 500)
    } catch (e) {
      toast.error((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="rh-pending-profile">
      <strong>অনুমোদনের অপেক্ষায়</strong>
      <span className="rh-pending-profile__meta">
        সদস্য নিজে বদলেছেন
        {doc?.pendingAt
          ? `, ${new Date(doc.pendingAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`
          : ''}
        । অনুমোদন দিলে সাইটে দেখাবে।
      </span>
      <ul>
        {(changed.length ? changed : LABELS.slice(0, 1)).map(([k, label]) => (
          <li key={k}>
            <span className="rh-pending-profile__label">{label}</span>
            <span className="rh-pending-profile__old">{show(doc?.[k]) || 'খালি'}</span>
            <span className="rh-pending-profile__new">{show(pending[k]) || 'খালি'}</span>
          </li>
        ))}
      </ul>
      {canDecide ? (
        <>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="বাতিলের কারণ (ঐচ্ছিক, সদস্য দেখবেন)"
          />
          <div className="rh-pending-profile__actions">
            <button
              type="button"
              className="rh-int-btn rh-int-btn--ghost"
              disabled={busy}
              onClick={() => void decide('reject')}
            >
              বাতিল করুন
            </button>
            <button
              type="button"
              className="rh-int-btn rh-pending-profile__ok"
              disabled={busy}
              onClick={() => void decide('approve')}
            >
              অনুমোদন দিন
            </button>
          </div>
        </>
      ) : (
        <span className="rh-pending-profile__meta">
          অনুমোদন দিতে পারেন যাদের এই মেনুতে এডিটের অনুমতি আছে।
        </span>
      )}
    </div>
  )
}
