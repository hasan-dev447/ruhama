'use client'

import { toast, useAuth, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { IconBan, IconLogout, IconShield } from '@/components/icons'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { hasRole } from '@/lib/roles'

type Action = 'ban' | 'unban' | 'revoke'

const LABELS: Record<Action, { button: string; confirm: string; done: string }> = {
  ban: {
    button: 'ব্যান করুন',
    confirm: 'এই ইউজারকে ব্যান করবেন? তিনি আর লগইন করতে পারবেন না।',
    done: 'ইউজার ব্যান করা হয়েছে',
  },
  unban: {
    button: 'ব্যান তুলে নিন',
    confirm: 'ব্যান তুলে নেবেন?',
    done: 'ব্যান তুলে নেওয়া হয়েছে',
  },
  revoke: {
    button: 'সব ডিভাইস থেকে লগআউট',
    confirm: 'এই ইউজারের সব সেশন বন্ধ করবেন?',
    done: 'সব ডিভাইস থেকে লগআউট করা হয়েছে',
  },
}

const PATHS: Record<Action, string> = {
  ban: '/api/auth/admin/ban-user',
  unban: '/api/auth/admin/unban-user',
  revoke: '/api/auth/admin/revoke-user-sessions',
}

/**
 * Account actions on a user's admin page, in Bangla (replaces the auth plugin's English buttons).
 * Only super admins and shura see them; the auth server checks the same rule again.
 */
export function UserAdminActions() {
  const router = useRouter()
  const { user } = useAuth()
  const { id } = useDocumentInfo()
  const banned = useFormFields(([fields]) => Boolean(fields.banned?.value))
  const [pending, setPending] = useState<Action | null>(null)
  const [confirming, setConfirming] = useState<Action | null>(null)
  const [reason, setReason] = useState('')

  if (!id || !hasRole(user, 'super_admin', 'shura') || String(user?.id) === String(id)) return null

  async function run(action: Action) {
    setPending(action)
    try {
      const res = await fetch(PATHS[action], {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: String(id),
          ...(action === 'ban' && reason.trim() ? { banReason: reason.trim() } : {}),
        }),
      })
      if (!res.ok) throw new Error(String(res.status))
      toast.success(LABELS[action].done)
      setConfirming(null)
      setReason('')
      router.refresh()
    } catch {
      toast.error('কাজটি করা যায়নি। আবার চেষ্টা করুন।')
    } finally {
      setPending(null)
    }
  }

  const actions: Action[] = [banned ? 'unban' : 'ban', 'revoke']

  return (
    <div className="rh-user-actions">
      {confirming ? (
        <div
          className="rh-user-actions__confirm"
          role="alertdialog"
          aria-label={LABELS[confirming].confirm}
        >
          <span>{LABELS[confirming].confirm}</span>
          {confirming === 'ban' ? (
            <input
              className="rh-user-actions__reason"
              placeholder="কারণ (ঐচ্ছিক)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          ) : null}
          <button
            type="button"
            className="rh-user-actions__yes"
            onClick={() => run(confirming)}
            disabled={pending !== null}
          >
            {pending ? 'অপেক্ষা করুন…' : 'হ্যাঁ, নিশ্চিত'}
          </button>
          <button
            type="button"
            className="rh-user-actions__no"
            onClick={() => setConfirming(null)}
            disabled={pending !== null}
          >
            বাতিল
          </button>
        </div>
      ) : (
        actions.map((a) => (
          <button
            key={a}
            type="button"
            className={`rh-user-actions__btn${a === 'ban' ? ' is-danger' : ''}`}
            onClick={() => setConfirming(a)}
          >
            {a === 'revoke' ? (
              <IconLogout size={15} aria-hidden="true" />
            ) : a === 'ban' ? (
              <IconBan size={15} aria-hidden="true" />
            ) : (
              <IconShield size={15} aria-hidden="true" />
            )}
            {LABELS[a].button}
          </button>
        ))
      )}
    </div>
  )
}
