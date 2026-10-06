'use client'

import { useAuth, useFormFields } from '@payloadcms/ui'
import { IconError, IconLoading, IconPlug, IconSuccess } from '@/components/icons'
import { useState } from 'react'

import type { IntegrationTarget } from '@/payload/globals/integrations-shared'

const FIELDS: Record<IntegrationTarget, string[]> = {
  google: ['clientId', 'clientSecret'],
  facebook: ['clientId', 'clientSecret'],
  sms: ['provider', 'apiUrl', 'apiKey', 'senderId'],
  email: ['resendApiKey', 'from', 'replyTo'],
}

const HELP: Record<IntegrationTarget, string> = {
  google: 'Google-এর সাথে Client ID ও secret মিলিয়ে দেখা হবে। কোনো লগইন হবে না।',
  facebook: 'Facebook-এর সাথে App ID ও secret মিলিয়ে দেখা হবে।',
  sms: 'নিচের নম্বরে একটি টেস্ট SMS যাবে (গেটওয়ের খরচ লাগতে পারে)।',
  email: 'আপনার ইমেইল ঠিকানায় একটি টেস্ট ইমেইল যাবে।',
}

type Result = { ok: boolean; message: string }

/**
 * "Test connection" for one integration. Uses what is typed in the form, falling back to the saved
 * values, so a key can be checked before it is saved.
 */
export function TestConnection({ target }: { target: IntegrationTarget }) {
  const { user } = useAuth()
  const values = useFormFields(([fields]) =>
    Object.fromEntries(
      FIELDS[target].map((name) => [name, fields[`${target}.${name}`]?.value ?? '']),
    ),
  )
  const [phone, setPhone] = useState('')
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const smsLive = target === 'sms' && values.provider === 'bd_gateway'

  async function run() {
    setPending(true)
    setResult(null)
    try {
      const res = await fetch('/api/globals/integrations/test', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ target, values, to: phone }),
      })
      const json = (await res.json().catch(() => null)) as Result | null
      setResult(json ?? { ok: false, message: `সার্ভার থেকে উত্তর আসেনি (HTTP ${res.status})।` })
    } catch {
      setResult({ ok: false, message: 'সার্ভারে পৌঁছানো যায়নি।' })
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rh-test">
      <div className="rh-test__head">
        <div>
          <strong>সংযোগ পরীক্ষা</strong>
          <p>
            {target === 'email' && user?.email
              ? `${user.email} ঠিকানায় একটি টেস্ট ইমেইল যাবে।`
              : target === 'sms' && !smsLive
                ? 'এখন টেস্ট মোড চালু, তাই কোনো SMS যাবে না। আসল গেটওয়ে বেছে নিলে নম্বর দিয়ে পরীক্ষা করা যাবে।'
                : HELP[target]}
          </p>
        </div>
      </div>
      <div className="rh-test__row">
        {smsLive ? (
          <input
            type="tel"
            inputMode="tel"
            className="rh-test__phone"
            placeholder="01XXXXXXXXX"
            aria-label="টেস্ট SMS যে নম্বরে যাবে"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        ) : null}
        <button
          type="button"
          className="rh-int-btn rh-int-btn--primary"
          onClick={run}
          disabled={pending}
        >
          {pending ? (
            <IconLoading size={16} className="rh-spin" aria-hidden="true" />
          ) : (
            <IconPlug size={16} aria-hidden="true" />
          )}
          {pending ? 'পরীক্ষা চলছে' : 'সংযোগ পরীক্ষা করুন'}
        </button>
      </div>
      {result ? (
        <p className={`rh-test__result ${result.ok ? 'is-ok' : 'is-err'}`} role="status">
          {result.ok ? (
            <IconSuccess size={16} aria-hidden="true" />
          ) : (
            <IconError size={16} aria-hidden="true" />
          )}
          <span>{result.message}</span>
        </p>
      ) : null}
      <p className="rh-test__note">
        পরীক্ষা ঠিক হলে উপরের &quot;সংরক্ষণ করুন&quot; চাপুন। সংরক্ষণ ছাড়া সাইটে কিছু বদলায় না।
      </p>
    </div>
  )
}
