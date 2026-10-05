'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CircleCheck, Send } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import { submitContactAction } from '@/actions/outreach'
import { Button } from '@/components/ui/button'
import { Field, FormAlert, Input, Select, Textarea } from '@/components/ui/form'
import { Turnstile, type TurnstileHandle } from '@/components/ui/turnstile'
import { useSession } from '@/lib/auth/client'
import { CONTACT_TOPICS } from '@/lib/options'
import { contactSchema } from '@/lib/validation/forms'

type Values = z.input<typeof contactSchema>

export function ContactForm() {
  const params = useSearchParams()
  const { data: session } = useSession()
  const user = session?.user
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const turnstile = useRef<TurnstileHandle>(null)
  const [pending, startTransition] = useTransition()
  const topicParam = params.get('topic')
  const topic = CONTACT_TOPICS.some((t) => t.value === topicParam)
    ? (topicParam as string)
    : 'general'
  const person = params.get('person')

  const form = useForm<Values, unknown, z.output<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    values: {
      name: user?.name ?? '',
      email: user?.email && !user.email.endsWith('.phone.ruhama.local') ? user.email : '',
      phone: '',
      topic,
      subject: topic === 'invite' && person ? `বক্তা আমন্ত্রণ: ${person}` : '',
      message: '',
    },
    resetOptions: { keepDirtyValues: true },
  })
  const { errors } = form.formState

  const onValid = (values: z.output<typeof contactSchema>) => {
    setServerError(null)
    if (!user && !token) {
      setServerError('নিচের নিরাপত্তা যাচাইটি সম্পন্ন করুন।')
      return
    }
    startTransition(async () => {
      const res = await submitContactAction({ ...values, turnstileToken: token ?? undefined })
      if (!res.ok) {
        setServerError(res.error)
        turnstile.current?.reset()
        setToken(null)
        return
      }
      setSent(true)
    })
  }
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => void form.handleSubmit(onValid)(e)

  if (sent) {
    return (
      <div className="empty" role="status" style={{ padding: '32px 8px' }}>
        <span
          className="empty__icon"
          style={{ background: 'var(--rh-success-soft)', color: 'var(--rh-success)' }}
        >
          <CircleCheck className="ic ic-lg" aria-hidden="true" />
        </span>
        <h2 className="t-h3">বার্তা পৌঁছেছে</h2>
        <p className="t-muted" style={{ maxWidth: 380 }}>
          জাযাকাল্লাহু খাইরান। আমাদের টিম শিগগিরই আপনার ইমেইলে উত্তর দেবে, ইনশাআল্লাহ।
        </p>
        <Button variant="secondary" onClick={() => setSent(false)}>
          আরেকটি বার্তা লিখুন
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
      aria-labelledby="contact-form-title"
      noValidate
    >
      <h2 id="contact-form-title" className="t-h3">
        বার্তা পাঠান
      </h2>
      {serverError ? <FormAlert>{serverError}</FormAlert> : null}
      <div className="form-grid">
        <Field label="নাম" htmlFor="c-name" required error={errors.name?.message}>
          <Input
            id="c-name"
            autoComplete="name"
            invalid={Boolean(errors.name)}
            {...form.register('name')}
          />
        </Field>
        <Field label="ইমেইল" htmlFor="c-email" required error={errors.email?.message}>
          <Input
            id="c-email"
            type="email"
            autoComplete="email"
            invalid={Boolean(errors.email)}
            {...form.register('email')}
          />
        </Field>
      </div>
      <div className="form-grid">
        <Field label="মোবাইল" optional htmlFor="c-phone" error={errors.phone?.message}>
          <Input
            id="c-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="০১XXXXXXXXX"
            invalid={Boolean(errors.phone)}
            {...form.register('phone')}
          />
        </Field>
        <Field label="বিষয়" htmlFor="c-topic">
          <Select id="c-topic" {...form.register('topic')}>
            {CONTACT_TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="শিরোনাম" htmlFor="c-subject" required error={errors.subject?.message}>
        <Input id="c-subject" invalid={Boolean(errors.subject)} {...form.register('subject')} />
      </Field>
      <Field
        label="বার্তা"
        htmlFor="c-message"
        required
        error={errors.message?.message}
        hint="কনটেন্ট সংশোধনের জন্য লেখার লিংক ও ঠিক কোন অংশ, তা উল্লেখ করুন।"
      >
        <Textarea
          id="c-message"
          style={{ minHeight: 160 }}
          invalid={Boolean(errors.message)}
          {...form.register('message')}
        />
      </Field>
      {!user ? <Turnstile ref={turnstile} onToken={setToken} action="contact" /> : null}
      <Button type="submit" size="lg" pending={pending}>
        বার্তা পাঠান <Send className="ic" aria-hidden="true" />
      </Button>
    </form>
  )
}
