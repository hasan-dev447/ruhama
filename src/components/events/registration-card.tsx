'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { IconCalendarAdd, IconSuccess } from '@/components/icons'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'

import { cancelRegistrationAction, registerForEventAction } from '@/actions/events'
import { Button, ButtonLink } from '@/components/ui/button'
import { CheckCard, Field, FormAlert, Input, Select } from '@/components/ui/form'
import { Progress, Skeleton } from '@/components/ui/primitives'
import { Turnstile, type TurnstileHandle } from '@/components/ui/turnstile'
import { apiFetch } from '@/lib/api-client'
import { useSession } from '@/lib/auth/client'
import { bn, formatDayMonth } from '@/lib/format'
import { eventRegistrationSchema } from '@/lib/validation/events'

import { seatText } from './event-card'

type Values = z.input<typeof eventRegistrationSchema>
type MyReg = { registered: false } | { registered: true; code: string; guests: number }

const regKey = (eventId: number) => ['me', 'event-registration', eventId] as const

/** Registration sidebar (design `EventDetail`): live seat count, member or guest form, confirmation with code. */
export function RegistrationCard({
  event,
}: {
  event: {
    id: number
    slug: string
    title: string
    startsAt: string
    capacity: number
    seatsTaken: number
    open: boolean
    ended: boolean
    separateSeating: boolean
    allowGuests: boolean
    mode: string
  }
}) {
  const router = useRouter()
  const qc = useQueryClient()
  const { data: session, isPending: sessionPending } = useSession()
  const user = session?.user
  const my = useQuery({
    queryKey: regKey(event.id),
    queryFn: () => apiFetch<MyReg>(`/me/events/${event.id}/registration`),
    enabled: Boolean(user),
  })
  const [done, setDone] = useState<{ code: string; already: boolean } | null>(null)
  const [seats, setSeats] = useState(event.seatsTaken)
  const [serverError, setServerError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const turnstile = useRef<TurnstileHandle>(null)
  const [pending, startTransition] = useTransition()

  const form = useForm<Values, unknown, z.output<typeof eventRegistrationSchema>>({
    resolver: zodResolver(eventRegistrationSchema),
    values: {
      name: user?.name ?? '',
      phone: '',
      email: user?.email && !user.email.endsWith('.phone.ruhama.local') ? user.email : '',
      seating: 'brothers',
      guests: 0,
    },
    resetOptions: { keepDirtyValues: true },
  })
  const { errors } = form.formState
  const seating = useWatch({ control: form.control, name: 'seating' })
  const left = Math.max(0, event.capacity - seats)
  const fill = event.capacity
    ? Math.round((Math.min(seats, event.capacity) / event.capacity) * 100)
    : 0

  const onValid = (values: z.output<typeof eventRegistrationSchema>) => {
    setServerError(null)
    if (!user && !token) {
      setServerError('নিচের নিরাপত্তা যাচাইটি সম্পন্ন করুন।')
      return
    }
    startTransition(async () => {
      const res = await registerForEventAction(event.id, {
        ...values,
        turnstileToken: token ?? undefined,
      })
      if (!res.ok) {
        setServerError(res.error)
        turnstile.current?.reset()
        setToken(null)
        for (const [path, message] of Object.entries(res.fieldErrors ?? {})) {
          if (path === 'name' || path === 'phone' || path === 'email' || path === 'seating')
            form.setError(path, { message })
        }
        return
      }
      setSeats(res.data.seatsTaken)
      setDone({ code: res.data.code, already: res.data.already })
      if (user) void qc.invalidateQueries({ queryKey: regKey(event.id) })
      router.refresh()
    })
  }
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => void form.handleSubmit(onValid)(e)

  function cancel() {
    startTransition(async () => {
      const res = await cancelRegistrationAction(event.id)
      if (!res.ok) {
        toast.error('বাতিল করা যায়নি', { description: res.error })
        return
      }
      setDone(null)
      await qc.invalidateQueries({ queryKey: regKey(event.id) })
      toast.success('রেজিস্ট্রেশন বাতিল হয়েছে', {
        description: 'আসনটি অন্য কেউ নিতে পারবেন। জাযাকাল্লাহু খাইরান।',
      })
      router.refresh()
    })
  }

  const confirmed = done ?? (my.data?.registered ? { code: my.data.code, already: true } : null)

  if (confirmed) {
    return (
      <div className="empty" role="status" style={{ padding: '16px 4px' }}>
        <span
          className="empty__icon"
          style={{ background: 'var(--rh-success-soft)', color: 'var(--rh-success)' }}
        >
          <IconSuccess className="ic ic-lg" aria-hidden="true" />
        </span>
        <h2 id="reg-title" className="t-h4">
          {confirmed.already && !done ? 'আপনার রেজিস্ট্রেশন নিশ্চিত' : 'রেজিস্ট্রেশন সম্পন্ন'}
        </h2>
        <p className="t-small t-muted">
          ইনশাআল্লাহ, দেখা হবে {formatDayMonth(event.startsAt)}। মজলিসের আগের দিন মনে করিয়ে দেওয়া
          হবে।
          {done?.already ? ' এই নম্বর দিয়ে আগেই রেজিস্ট্রেশন করা ছিল।' : ''}
        </p>
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            border: '1px dashed var(--rh-border-strong)',
            width: '100%',
          }}
        >
          <span className="t-caption t-muted">রেজিস্ট্রেশন নম্বর</span>
          <p style={{ fontWeight: 600, fontSize: 20, letterSpacing: '0.04em' }}>
            {bn(confirmed.code)}
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          <a
            href={`/api/v1/events/${event.slug}/ics`}
            className="btn btn-secondary btn-sm"
            download
          >
            <IconCalendarAdd className="ic" aria-hidden="true" />
            ক্যালেন্ডারে যোগ করুন
          </a>
          {user ? (
            <ButtonLink href="/dashboard" variant="ghost" size="sm">
              ড্যাশবোর্ড
            </ButtonLink>
          ) : null}
        </div>
        {user ? (
          <Button variant="dangerGhost" size="sm" onClick={cancel} pending={pending}>
            রেজিস্ট্রেশন বাতিল করুন
          </Button>
        ) : null}
      </div>
    )
  }

  const header = (
    <div>
      <h2 id="reg-title" className="t-h4">
        রেজিস্ট্রেশন
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
        <div
          className="t-small t-muted"
          style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}
        >
          <span>{seatText(event.capacity, seats).split(' · ')[0]}</span>
          {left > 0 ? (
            <span style={{ color: 'var(--rh-warning-ink)', fontWeight: 600 }}>
              {bn(left)}টি বাকি
            </span>
          ) : null}
        </div>
        <Progress value={fill} gold label="আসন পূর্ণ" />
      </div>
    </div>
  )

  if (event.ended || !event.open || left === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {header}
        <FormAlert>
          {event.ended
            ? 'মজলিসটি শেষ হয়ে গেছে।'
            : left === 0
              ? 'দুঃখিত, সব আসন পূর্ণ হয়ে গেছে।'
              : 'এই মজলিসের রেজিস্ট্রেশন এখন বন্ধ আছে।'}
        </FormAlert>
        <ButtonLink href="/events" variant="secondary" block>
          অন্য মজলিস দেখুন
        </ButtonLink>
      </div>
    )
  }

  if (sessionPending || (user && my.isPending)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} aria-busy="true">
        {header}
        <Skeleton style={{ height: 48 }} />
        <Skeleton style={{ height: 48 }} />
        <Skeleton style={{ height: 52 }} />
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      noValidate
    >
      {header}
      {serverError ? <FormAlert>{serverError}</FormAlert> : null}
      <Field label="পূর্ণ নাম" htmlFor="r-name" required error={errors.name?.message}>
        <Input
          id="r-name"
          autoComplete="name"
          invalid={Boolean(errors.name)}
          {...form.register('name')}
        />
      </Field>
      <Field label="মোবাইল নম্বর" htmlFor="r-phone" required error={errors.phone?.message}>
        <Input
          id="r-phone"
          type="tel"
          inputMode="tel"
          placeholder="০১XXXXXXXXX"
          autoComplete="tel"
          invalid={Boolean(errors.phone)}
          {...form.register('phone')}
        />
      </Field>
      <Field
        label="ইমেইল"
        optional
        htmlFor="r-email"
        error={errors.email?.message}
        hint="নিশ্চিতকরণ ও মনে করিয়ে দেওয়ার বার্তা পাঠাতে"
      >
        <Input
          id="r-email"
          type="email"
          autoComplete="email"
          invalid={Boolean(errors.email)}
          {...form.register('email')}
        />
      </Field>
      {event.separateSeating ? (
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label" style={{ marginBottom: 6 }}>
            বসার ব্যবস্থা
          </legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <CheckCard
              type="radio"
              value="brothers"
              label="ভাইদের অংশ"
              checked={seating === 'brothers'}
              {...form.register('seating')}
            />
            <CheckCard
              type="radio"
              value="sisters"
              label="বোনদের অংশ"
              checked={seating === 'sisters'}
              {...form.register('seating')}
            />
          </div>
        </fieldset>
      ) : null}
      {event.allowGuests ? (
        <Field label="সঙ্গে আরও কতজন আসবেন" htmlFor="r-plus">
          <Select id="r-plus" {...form.register('guests')}>
            <option value={0}>কেউ নয়</option>
            {[1, 2, 3]
              .filter((n) => n < left)
              .map((n) => (
                <option key={n} value={n}>
                  {bn(n)} জন
                </option>
              ))}
          </Select>
        </Field>
      ) : null}
      {!user ? <Turnstile ref={turnstile} onToken={setToken} action="event-register" /> : null}
      <Button type="submit" block size="lg" pending={pending}>
        রেজিস্ট্রেশন নিশ্চিত করুন
      </Button>
      <p className="t-caption t-muted">আপনার তথ্য শুধু এই মজলিসের ব্যবস্থাপনায় ব্যবহৃত হবে।</p>
    </form>
  )
}
