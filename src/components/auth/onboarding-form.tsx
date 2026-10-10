'use client'

import { useState, useTransition } from 'react'

import { addContactAction, completeProfileAction, confirmContactAction } from '@/actions/settings'
import { Button } from '@/components/ui/button'
import { Field, FormAlert, Input } from '@/components/ui/form'
import { bn } from '@/lib/format'
import type { Gender } from '@/lib/gender'
import { EMAIL_GRACE_DAYS } from '@/lib/profile-complete'

import { GenderPicker } from './gender-picker'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * The first step after sign-up: ভাই / বোন, and for an account without a real email (Facebook
 * without one) an email, confirmed with a six-digit code before it joins the account. The email is
 * optional while the account still has time (`email="optional"`), required once that is up.
 */
export function OnboardingForm({
  next,
  needGender,
  email: emailMode,
  daysLeft,
}: {
  next: string
  needGender: boolean
  email: 'none' | 'optional' | 'required'
  daysLeft: number
}) {
  const [gender, setGender] = useState<Gender | null>(null)
  const [email, setEmail] = useState('')
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, start] = useTransition()

  // a full load, so the header and every page read the completed profile
  const go = () => window.location.assign(next)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (needGender && !gender) return setError('ভাই অথবা বোন বেছে নিন।')
    const typed = email.trim()
    if (emailMode === 'required' && !typed) return setError('একটি ইমেইল ঠিকানা দিন।')
    if (typed && !EMAIL_RE.test(typed)) return setError('সঠিক ইমেইল ঠিকানা দিন।')
    setError(null)
    start(async () => {
      const res = await completeProfileAction({
        ...(needGender && gender ? { gender } : {}),
        ...(emailMode !== 'none' && typed ? { email: typed } : {}),
      })
      if (!res.ok) return setError(res.error)
      if (res.data?.emailPending) {
        setPendingEmail(res.data.emailPending)
        setNotice(`${res.data.emailPending} ঠিকানায় একটি ৬ অঙ্কের কোড পাঠানো হয়েছে।`)
        return
      }
      go()
    })
  }

  function confirm(e: React.FormEvent) {
    e.preventDefault()
    if (!pendingEmail) return
    if (!/^\d{6}$/.test(code)) return setError('৬ অঙ্কের কোডটি লিখুন।')
    setError(null)
    start(async () => {
      const res = await confirmContactAction({ kind: 'email', value: pendingEmail, code })
      if (!res.ok) return setError(res.error)
      go()
    })
  }

  function resend() {
    if (!pendingEmail) return
    setError(null)
    start(async () => {
      const res = await addContactAction({ kind: 'email', value: pendingEmail })
      if (!res.ok) return setError(res.error)
      setNotice('নতুন কোড পাঠানো হয়েছে।')
    })
  }

  if (pendingEmail) {
    return (
      <form onSubmit={confirm} className="onboarding-form" noValidate>
        {notice ? <FormAlert tone="success">{notice}</FormAlert> : null}
        {error ? <FormAlert>{error}</FormAlert> : null}
        <Field
          label="যাচাইয়ের কোড"
          htmlFor="ob-code"
          hint="ইনবক্স বা স্প্যাম ফোল্ডার দেখুন। কোড ১০ মিনিট কার্যকর।"
        >
          <Input
            id="ob-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="১২৩৪৫৬"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
        </Field>
        <Button type="submit" block pending={pending}>
          ইমেইল নিশ্চিত করুন
        </Button>
        <div className="onboarding-form__links">
          <button type="button" className="link" onClick={resend} disabled={pending}>
            কোড আবার পাঠান
          </button>
          {emailMode === 'optional' ? (
            <button type="button" className="link" onClick={go}>
              পরে করব
            </button>
          ) : null}
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={submit} className="onboarding-form" noValidate>
      {error ? <FormAlert>{error}</FormAlert> : null}
      {needGender ? <GenderPicker value={gender} onChange={setGender} /> : null}
      {emailMode !== 'none' ? (
        <Field
          label="আপনার ইমেইল"
          htmlFor="ob-email"
          optional={emailMode === 'optional'}
          hint={
            emailMode === 'optional'
              ? `এখন না দিলেও চলবে। তবে ${bn(daysLeft || EMAIL_GRACE_DAYS)} দিনের মধ্যে একটি ইমেইল যোগ করে কোড দিয়ে যাচাই করতে হবে, নইলে অ্যাকাউন্ট সাময়িকভাবে বন্ধ থাকবে। গুরুত্বপূর্ণ বার্তা ও পাসওয়ার্ড রিসেট এই ঠিকানায় যাবে।`
              : 'অ্যাকাউন্ট চালু রাখতে একটি ইমেইল যোগ করে কোড দিয়ে যাচাই করুন।'
          }
        >
          <Input
            id="ob-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
      ) : null}
      <Button type="submit" block pending={pending}>
        {emailMode !== 'none' && email.trim()
          ? 'কোড পাঠান ও এগিয়ে যান'
          : 'নিশ্চিত করুন ও এগিয়ে যান'}
      </Button>
    </form>
  )
}
