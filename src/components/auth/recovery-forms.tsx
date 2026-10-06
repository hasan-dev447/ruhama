'use client'

import { IconSuccess } from '@/components/icons'
import { useState, useTransition } from 'react'

import { Button, ButtonLink } from '@/components/ui/button'
import { Field, FormAlert, Input, PasswordInput } from '@/components/ui/form'
import { authClient } from '@/lib/auth/client'
import { authErrorMessage } from '@/lib/auth/errors'

function Done({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="empty" role="status" style={{ padding: '28px 0 8px' }}>
      <span
        className="empty__icon"
        style={{ background: 'var(--rh-success-soft)', color: 'var(--rh-success)' }}
      >
        <IconSuccess className="ic ic-lg" aria-hidden="true" />
      </span>
      <h2 className="t-h4">{title}</h2>
      <p className="t-small t-muted">{text}</p>
      {action}
    </div>
  )
}

/** Always reports success, so the form never reveals whether an email is registered. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const { error } = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: '/reset-password',
      })
      if (error && (error.status === 429 || error.code === 'RATE_LIMITED')) {
        setError(authErrorMessage(error))
        return
      }
      setSent(true)
    })
  }

  if (sent) {
    return (
      <Done
        title="ইনবক্স দেখুন"
        text="এই ইমেইলে অ্যাকাউন্ট থাকলে পাসওয়ার্ড বদলানোর লিংক পাঠানো হয়েছে। লিংকটি ১ ঘণ্টা কার্যকর থাকবে।"
        action={
          <ButtonLink href="/login" variant="secondary" size="sm">
            লগইন পাতায় ফিরুন
          </ButtonLink>
        }
      />
    )
  }
  return (
    <form
      onSubmit={submit}
      style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 28 }}
      noValidate
    >
      {error ? <FormAlert>{error}</FormAlert> : null}
      <Field label="ইমেইল" htmlFor="f-email">
        <Input
          id="f-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Button type="submit" size="lg" block pending={pending} disabled={!email}>
        রিসেট লিংক পাঠান
      </Button>
    </form>
  )
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError('পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।')
    if (password !== confirm) return setError('দুই ঘরের পাসওয়ার্ড মেলেনি।')
    start(async () => {
      const { error } = await authClient.resetPassword({ newPassword: password, token })
      if (error) setError(authErrorMessage(error))
      else setDone(true)
    })
  }

  if (done) {
    return (
      <Done
        title="পাসওয়ার্ড বদলানো হয়েছে"
        text="নিরাপত্তার জন্য অন্য সব ডিভাইস থেকে লগআউট করা হয়েছে। নতুন পাসওয়ার্ড দিয়ে লগইন করুন।"
        action={
          <ButtonLink href="/login" size="sm">
            লগইন করুন
          </ButtonLink>
        }
      />
    )
  }
  return (
    <form
      onSubmit={submit}
      style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 28 }}
      noValidate
    >
      {error ? <FormAlert>{error}</FormAlert> : null}
      <Field
        label="নতুন পাসওয়ার্ড"
        htmlFor="r-pass"
        hint="কমপক্ষে ৮ অক্ষর; সংখ্যা ও চিহ্ন মেশালে আরও নিরাপদ।"
      >
        <PasswordInput
          id="r-pass"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Field label="আবার লিখুন" htmlFor="r-pass2">
        <PasswordInput
          id="r-pass2"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </Field>
      <Button type="submit" size="lg" block pending={pending} disabled={!password || !confirm}>
        পাসওয়ার্ড বদলান
      </Button>
    </form>
  )
}

export function ResendVerificationForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const { error } = await authClient.sendVerificationEmail({
        email: email.trim(),
        callbackURL: '/verify-email',
      })
      if (error) setError(authErrorMessage(error))
      else setSent(true)
    })
  }

  if (sent)
    return (
      <Done title="নতুন লিংক পাঠানো হয়েছে" text="ইনবক্স দেখুন; লিংকটি ২৪ ঘণ্টা কার্যকর থাকবে।" />
    )
  return (
    <form
      onSubmit={submit}
      style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}
      noValidate
    >
      {error ? <FormAlert>{error}</FormAlert> : null}
      <Field label="ইমেইল" htmlFor="v-email">
        <Input
          id="v-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Button type="submit" block pending={pending} disabled={!email}>
        যাচাই লিংক আবার পাঠান
      </Button>
    </form>
  )
}
