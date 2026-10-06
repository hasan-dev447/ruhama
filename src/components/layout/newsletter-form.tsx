'use client'

import { IconSuccess } from '@/components/icons'
import { useActionState } from 'react'

import { subscribeNewsletterAction } from '@/actions/newsletter'
import type { ActionResult } from '@/actions/types'

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    subscribeNewsletterAction,
    null,
  )

  if (state?.ok) {
    return (
      <div
        role="status"
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          padding: '12px 14px',
          borderRadius: 10,
          background: 'var(--rh-success-soft)',
          color: 'var(--rh-success)',
          fontSize: 15,
          fontWeight: 500,
        }}
      >
        <IconSuccess className="ic" aria-hidden="true" />
        জাযাকাল্লাহু খাইরান! পরের শুক্রবার দেখা হবে।
      </div>
    )
  }

  return (
    <form
      action={formAction}
      style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
      noValidate={false}
    >
      <label htmlFor="news-email" className="sr-only">
        ইমেইল ঠিকানা
      </label>
      <input
        id="news-email"
        name="email"
        className={state && !state.ok ? 'input is-error' : 'input'}
        type="email"
        required
        autoComplete="email"
        placeholder="আপনার ইমেইল"
        style={{ flex: '1 1 180px' }}
        aria-invalid={state && !state.ok ? true : undefined}
        aria-describedby={state && !state.ok ? 'news-error' : undefined}
      />
      <input type="hidden" name="source" value="footer" />
      <button type="submit" className="btn btn-primary" style={{ flex: 'none' }} disabled={pending}>
        {pending ? <span className="spin" aria-hidden="true" /> : null}
        সাবস্ক্রাইব
      </button>
      {state && !state.ok && (
        <p id="news-error" className="error-text" role="alert" style={{ flexBasis: '100%' }}>
          {state.error}
        </p>
      )}
    </form>
  )
}
