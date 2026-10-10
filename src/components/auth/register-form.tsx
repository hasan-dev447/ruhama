'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { IconSuccess } from '@/components/icons'
import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { subscribeNewsletterAction } from '@/actions/newsletter'
import { Button, ButtonLink } from '@/components/ui/button'
import { Field, FormAlert, Input, PasswordInput } from '@/components/ui/form'
import { Turnstile, type TurnstileHandle } from '@/components/ui/turnstile'
import { authClient } from '@/lib/auth/client'
import { normalizeBdPhone } from '@/lib/phone'
import { takeRegisterPrefill } from '@/lib/register-prefill'

import { GenderPicker } from './gender-picker'
import { authErrorMessage } from '@/lib/auth/errors'

import { SocialButtons } from './social-buttons'

const schema = z.object({
  name: z.string().trim().min(2, 'পূর্ণ নাম লিখুন।').max(80),
  email: z.string().trim().toLowerCase().email('সঠিক ইমেইল ঠিকানা দিন।'),
  // optional; a Bangladeshi mobile number when given
  phone: z
    .string()
    .trim()
    .refine((v) => v === '' || normalizeBdPhone(v) !== null, {
      message: 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন ০১৭১২৩৪৫৬৭৮), অথবা ঘরটি খালি রাখুন।',
    }),
  password: z.string().min(8, 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।').max(128),
  gender: z.enum(['male', 'female'], { message: 'ভাই অথবা বোন বেছে নিন।' }),
  agree: z.literal(true, { message: 'আদব নীতি ও শর্তাবলিতে সম্মতি দিন।' }),
  newsletter: z.boolean(),
})
type Values = z.input<typeof schema>

/** 0 to 4, matching the design's four-segment meter. */
export function passwordScore(pw: string): number {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score++
  return score
}

const METER = [
  'var(--rh-error)',
  'var(--rh-warning)',
  'var(--rh-primary-light)',
  'var(--rh-success)',
]
const HINTS = [
  'কমপক্ষে ৮ অক্ষর; সংখ্যা ও চিহ্ন মেশালে আরও নিরাপদ।',
  'দুর্বল পাসওয়ার্ড',
  'মাঝারি পাসওয়ার্ড',
  'ভালো পাসওয়ার্ড',
  'শক্তিশালী পাসওয়ার্ড',
]

export function RegisterForm({
  next,
  google,
  facebook,
  requireVerification,
}: {
  next: string
  google: boolean
  facebook: boolean
  /** Site settings: verify the address before the first password sign-in */
  requireVerification: boolean
}) {
  const [done, setDone] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const turnstile = useRef<TurnstileHandle>(null)
  const [pending, start] = useTransition()
  const form = useForm<Values, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      gender: undefined as never,
      agree: false as never,
      newsletter: true,
    },
  })
  const { errors } = form.formState

  // details already typed on the join form (lib/register-prefill.ts), used once
  useEffect(() => {
    const p = takeRegisterPrefill()
    if (!p) return
    for (const key of ['name', 'email', 'phone'] as const) {
      const v = p[key]
      if (v && !form.getValues(key)) form.setValue(key, v, { shouldDirty: true })
    }
  }, [form])

  const password = useWatch({ control: form.control, name: 'password' }) ?? ''
  const gender = useWatch({ control: form.control, name: 'gender' }) ?? null
  const score = passwordScore(password)

  const onValid = (values: z.output<typeof schema>) => {
    setServerError(null)
    if (!token) {
      setServerError('নিচের নিরাপত্তা যাচাইটি সম্পন্ন করুন।')
      return
    }
    start(async () => {
      const callbackURL = `/verify-email?next=${encodeURIComponent(next)}`
      const { error } = await authClient.signUp.email(
        {
          name: values.name,
          email: values.email,
          password: values.password,
          gender: values.gender,
          ...(values.phone ? { phoneNumber: normalizeBdPhone(values.phone)! } : {}),
          callbackURL,
        },
        { headers: { 'x-captcha-response': token } },
      )
      turnstile.current?.reset()
      setToken(null)
      if (error) {
        setServerError(authErrorMessage(error))
        if (error.code?.startsWith('USER_ALREADY_EXISTS'))
          form.setError('email', { message: 'এই ইমেইলে আগেই অ্যাকাউন্ট আছে।' })
        if (error.code === 'PHONE_TAKEN' || error.code === 'INVALID_PHONE')
          form.setError('phone', { message: error.message ?? 'মোবাইল নম্বরটি ঠিক নেই।' })
        return
      }
      if (values.newsletter) {
        const fd = new FormData()
        fd.set('email', values.email)
        fd.set('source', 'register')
        void subscribeNewsletterAction(null, fd)
      }
      if (!requireVerification) {
        // verification is switched off: sign the new member straight in
        const signedIn = await authClient.signIn.email({
          email: values.email,
          password: values.password,
        })
        if (!signedIn.error) {
          window.location.assign(next)
          return
        }
      }
      setDone(values.email)
    })
  }
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => void form.handleSubmit(onValid)(e)

  if (done) {
    return (
      <div className="empty" role="status" style={{ padding: '28px 0 8px' }}>
        <span
          className="empty__icon"
          style={{ background: 'var(--rh-success-soft)', color: 'var(--rh-success)' }}
        >
          <IconSuccess className="ic ic-lg" aria-hidden="true" />
        </span>
        <h2 className="t-h4">ইমেইল যাচাই করুন</h2>
        <p className="t-small t-muted">
          {done} ঠিকানায় একটি নিশ্চিতকরণ লিংক পাঠানো হয়েছে। লিংকে ক্লিক করলেই অ্যাকাউন্ট চালু হবে।
        </p>
        <ButtonLink href="/login" variant="secondary" size="sm">
          লগইন পাতায় যান
        </ButtonLink>
      </div>
    )
  }

  return (
    <>
      <form
        onSubmit={onSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 28 }}
        noValidate
      >
        {serverError ? <FormAlert>{serverError}</FormAlert> : null}
        <Field label="পূর্ণ নাম" htmlFor="g-name" error={errors.name?.message}>
          <Input
            id="g-name"
            autoComplete="name"
            invalid={Boolean(errors.name)}
            {...form.register('name')}
          />
        </Field>
        <Field label="ইমেইল" htmlFor="g-email" error={errors.email?.message}>
          <Input
            id="g-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            invalid={Boolean(errors.email)}
            {...form.register('email')}
          />
        </Field>
        <Field
          label="মোবাইল নম্বর (ঐচ্ছিক)"
          htmlFor="g-phone"
          error={errors.phone?.message}
          hint="না দিলেও চলবে। পরে সেটিংস থেকে যোগ বা যাচাই করতে পারবেন।"
        >
          <Input
            id="g-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="01XXXXXXXXX"
            invalid={Boolean(errors.phone)}
            {...form.register('phone')}
          />
        </Field>
        <div className="field">
          <label className="label" htmlFor="g-pass">
            পাসওয়ার্ড
          </label>
          <PasswordInput
            id="g-pass"
            autoComplete="new-password"
            aria-describedby="g-pass-hint"
            invalid={Boolean(errors.password)}
            {...form.register('password')}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 4,
              marginTop: 4,
            }}
            aria-hidden="true"
          >
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                style={{
                  height: 4,
                  borderRadius: 4,
                  background: i <= score ? METER[score - 1] : 'var(--rh-border)',
                }}
              />
            ))}
          </div>
          <span
            id="g-pass-hint"
            className={errors.password ? 'error-text' : 'hint'}
            role={errors.password ? 'alert' : undefined}
          >
            {errors.password?.message ?? HINTS[score]}
          </span>
        </div>
        <GenderPicker
          value={gender}
          onChange={(g) => form.setValue('gender', g, { shouldValidate: true })}
          error={errors.gender?.message}
        />
        <div>
          <label className="check" style={{ alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              style={{ marginTop: 4 }}
              aria-invalid={errors.agree ? true : undefined}
              {...form.register('agree')}
            />
            <span className="t-small">
              আমি{' '}
              <Link className="link" href="/adab" target="_blank">
                আদব ও ইনসাফ নীতি
              </Link>{' '}
              এবং{' '}
              <Link className="link" href="/terms" target="_blank">
                ব্যবহারের শর্তাবলি
              </Link>{' '}
              মেনে চলব।
            </span>
          </label>
          {errors.agree ? (
            <span className="error-text" role="alert">
              {errors.agree.message}
            </span>
          ) : null}
        </div>
        <label className="check">
          <input type="checkbox" {...form.register('newsletter')} />
          <span className="t-small">সাপ্তাহিক চিঠি ইমেইলে পেতে চাই</span>
        </label>
        <Turnstile ref={turnstile} onToken={setToken} action="signup" />
        <Button type="submit" size="lg" block pending={pending}>
          অ্যাকাউন্ট খুলুন
        </Button>
      </form>
      {/* accounts always have an email: password, Google or Facebook (phone is an extra login) */}
      {google || facebook ? (
        <>
          <div className="auth-sep" style={{ margin: '22px 0' }}>
            অথবা
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SocialButtons google={google} facebook={facebook} next={next} />
          </div>
        </>
      ) : null}
    </>
  )
}
