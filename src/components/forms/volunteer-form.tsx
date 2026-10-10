'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { IconNext } from '@/components/icons'
import Link from 'next/link'
import { useRef, useState, useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { z } from 'zod'

import { submitVolunteerAction } from '@/actions/outreach'
import { BrandMark } from '@/components/icons/brand-mark'
import { Button, ButtonLink } from '@/components/ui/button'
import { DistrictSelect } from '@/components/ui/district-select'
import { CheckCard, Field, FormAlert, Input, Textarea } from '@/components/ui/form'
import { Turnstile, type TurnstileHandle } from '@/components/ui/turnstile'
import { useSession } from '@/lib/auth/client'
import { saveRegisterPrefill } from '@/lib/register-prefill'
import { INTEREST_OPTIONS } from '@/lib/options'
import { volunteerSchema } from '@/lib/validation/forms'

type Values = z.input<typeof volunteerSchema>

export function VolunteerForm({ initialInterest }: { initialInterest?: string | null }) {
  const { data: session } = useSession()
  const user = session?.user
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const turnstile = useRef<TurnstileHandle>(null)
  const [pending, startTransition] = useTransition()
  const preset = INTEREST_OPTIONS.some((o) => o.value === initialInterest)
    ? [initialInterest as string]
    : ['writing']

  const form = useForm<Values, unknown, z.output<typeof volunteerSchema>>({
    resolver: zodResolver(volunteerSchema),
    values: {
      name: user?.name ?? '',
      phone: '',
      email: user?.email && !user.email.endsWith('.phone.ruhama.local') ? user.email : '',
      district: '' as never,
      interests: preset,
      message: '',
      pledge: false as never,
    },
    resetOptions: { keepDirtyValues: true },
  })
  const { errors } = form.formState
  const interests = useWatch({ control: form.control, name: 'interests' }) ?? []
  const district = (useWatch({ control: form.control, name: 'district' }) as string) ?? ''

  const onValid = (values: z.output<typeof volunteerSchema>) => {
    setServerError(null)
    if (!user && !token) {
      setServerError('নিচের নিরাপত্তা যাচাইটি সম্পন্ন করুন।')
      return
    }
    startTransition(async () => {
      const res = await submitVolunteerAction({ ...values, turnstileToken: token ?? undefined })
      if (!res.ok) {
        setServerError(res.error)
        turnstile.current?.reset()
        setToken(null)
        return
      }
      if (!user)
        saveRegisterPrefill({ name: values.name, email: values.email || '', phone: values.phone })
      setSent(true)
    })
  }
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => void form.handleSubmit(onValid)(e)

  if (sent) {
    return (
      <div className="empty" role="status" style={{ padding: '32px 8px' }}>
        <BrandMark style={{ width: 52, height: 52, color: 'var(--rh-accent)' }} />
        <h2 className="t-h3">আহলান ওয়া সাহলান!</h2>
        <p className="t-muted" style={{ maxWidth: 380 }}>
          আপনার আবেদন পেয়েছি। আপনার জেলার সমন্বয়ক আগামী কয়েক দিনের মধ্যে যোগাযোগ করবেন,
          ইনশাআল্লাহ।
        </p>
        {user ? null : (
          <div className="join-account" style={{ maxWidth: 420 }}>
            <strong>সাইটে অ্যাকাউন্টও খুলে নিন</strong>
            <p className="t-small t-muted" style={{ margin: '6px 0 0' }}>
              আবেদন জমা দিলে অ্যাকাউন্ট তৈরি হয় না। অ্যাকাউন্ট থাকলে মজলিসে এক ক্লিকে রেজিস্ট্রেশন,
              কোর্সের অগ্রগতি আর সংরক্ষিত লেখা এক জায়গায় পাবেন। আপনার নাম, ইমেইল ও মোবাইল আগে
              থেকেই বসানো থাকবে, শুধু পাসওয়ার্ড দিন।
            </p>
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {user ? (
            <ButtonLink href="/dashboard">ড্যাশবোর্ড</ButtonLink>
          ) : (
            <ButtonLink href="/register?next=/dashboard" arrow>
              অ্যাকাউন্ট খুলুন
            </ButtonLink>
          )}
          <ButtonLink href="/events" variant="secondary">
            আসন্ন মজলিস
          </ButtonLink>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
      aria-labelledby="join-form-title"
      noValidate
    >
      <div>
        <h2 id="join-form-title" className="t-h3">
          যুক্ত হওয়ার ফর্ম
        </h2>
        <p className="t-small t-muted" style={{ marginTop: 4 }}>
          তারকা (*) চিহ্নিত ঘরগুলো পূরণ করা আবশ্যক।
        </p>
      </div>
      {serverError ? <FormAlert>{serverError}</FormAlert> : null}
      <Field label="পূর্ণ নাম" htmlFor="j-name" required error={errors.name?.message}>
        <Input
          id="j-name"
          autoComplete="name"
          placeholder="যেমন: আব্দুল্লাহ আল মামুন"
          invalid={Boolean(errors.name)}
          {...form.register('name')}
        />
      </Field>
      <div className="form-grid">
        <Field label="মোবাইল নম্বর" htmlFor="j-phone" required error={errors.phone?.message}>
          <Input
            id="j-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="০১XXXXXXXXX"
            invalid={Boolean(errors.phone)}
            {...form.register('phone')}
          />
        </Field>
        <Field label="ইমেইল" htmlFor="j-email" error={errors.email?.message}>
          <Input
            id="j-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            invalid={Boolean(errors.email)}
            {...form.register('email')}
          />
        </Field>
      </div>
      <Field
        label="জেলা"
        htmlFor="j-district"
        required
        error={errors.district?.message}
        hint="বাংলা বা ইংরেজিতে লিখে খুঁজুন, যেমন ঢাকা বা dhaka।"
      >
        <DistrictSelect
          id="j-district"
          value={district}
          invalid={Boolean(errors.district)}
          onChange={(v) =>
            form.setValue('district', v as never, { shouldValidate: true, shouldDirty: true })
          }
        />
      </Field>
      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="label" style={{ marginBottom: 8 }}>
          কোন কাজে আগ্রহী?{' '}
          <span className="t-muted" style={{ fontWeight: 400 }}>
            (একাধিক বাছাই করা যাবে)
          </span>
        </legend>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))',
            gap: 8,
          }}
        >
          {INTEREST_OPTIONS.map((o) => (
            <CheckCard
              key={o.value}
              type="checkbox"
              value={o.value}
              label={o.label}
              checked={interests.includes(o.value)}
              {...form.register('interests')}
            />
          ))}
        </div>
      </fieldset>
      <Field label="সংক্ষিপ্ত বার্তা" htmlFor="j-msg" error={errors.message?.message}>
        <Textarea
          id="j-msg"
          placeholder="নিজের সম্পর্কে বা কীভাবে অবদান রাখতে চান, দুই-এক লাইনে লিখুন"
          {...form.register('message')}
        />
      </Field>
      <div>
        <label className="check" style={{ alignItems: 'flex-start' }}>
          <input
            type="checkbox"
            style={{ marginTop: 4 }}
            aria-invalid={errors.pledge ? true : undefined}
            {...form.register('pledge')}
          />
          <span className="t-small">
            আমি{' '}
            <Link className="link" href="/about#manifesto" target="_blank">
              ঘোষণাপত্র
            </Link>{' '}
            পড়েছি এবং আদব ও ইনসাফ নীতি মেনে চলার অঙ্গীকার করছি।
          </span>
        </label>
        {errors.pledge ? (
          <span className="error-text" role="alert">
            {errors.pledge.message}
          </span>
        ) : null}
      </div>
      {!user ? <Turnstile ref={turnstile} onToken={setToken} action="volunteer" /> : null}
      <Button type="submit" size="lg" block pending={pending}>
        যুক্ত হোন <IconNext className="ic" aria-hidden="true" />
      </Button>
    </form>
  )
}
