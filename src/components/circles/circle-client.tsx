'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, CircleCheck, LogIn } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import {
  cancelJoinRequestAction,
  requestToJoinCircleAction,
  toggleMeetupRsvpAction,
} from '@/actions/circles'
import { Button, ButtonLink } from '@/components/ui/button'
import { Field, FormAlert, Textarea } from '@/components/ui/form'
import { DateTile, Skeleton } from '@/components/ui/primitives'
import { apiFetch } from '@/lib/api-client'
import { useSession } from '@/lib/auth/client'
import { bn, formatDay, formatMonth } from '@/lib/format'

type CircleState = {
  membership: 'pending' | 'approved' | 'rejected' | 'cancelled' | null
  rsvps: number[]
}
const stateKey = (circleId: number) => ['me', 'circle', circleId] as const

function useCircleState(circleId: number) {
  const { data: session, isPending } = useSession()
  const query = useQuery({
    queryKey: stateKey(circleId),
    queryFn: () => apiFetch<CircleState>(`/me/circles/${circleId}`),
    enabled: Boolean(session?.user),
  })
  return { ...query, signedIn: Boolean(session?.user), sessionPending: isPending }
}

/** "সার্কেলে যুক্ত হোন" request card. */
export function CircleJoinCard({ circleId }: { circleId: number }) {
  const qc = useQueryClient()
  const pathname = usePathname()
  const { data, signedIn, sessionPending, isPending } = useCircleState(circleId)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const setMembership = (membership: CircleState['membership']) =>
    qc.setQueryData<CircleState>(stateKey(circleId), (prev) => ({
      rsvps: prev?.rsvps ?? [],
      membership,
    }))

  function request() {
    setError(null)
    start(async () => {
      const res = await requestToJoinCircleAction(circleId, message)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setMembership(res.data.status as CircleState['membership'])
    })
  }
  function cancel() {
    start(async () => {
      const res = await cancelJoinRequestAction(circleId)
      if (!res.ok) {
        toast.error('বাতিল করা যায়নি', { description: res.error })
        return
      }
      setMembership('cancelled')
    })
  }

  if (sessionPending || (signedIn && isPending)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} aria-busy="true">
        <Skeleton style={{ height: 28, width: '70%' }} />
        <Skeleton style={{ height: 88 }} />
        <Skeleton style={{ height: 48 }} />
      </div>
    )
  }

  if (data?.membership === 'approved') {
    return (
      <div className="empty" role="status" style={{ padding: '12px 0' }}>
        <span
          className="empty__icon"
          style={{ background: 'var(--rh-success-soft)', color: 'var(--rh-success)' }}
        >
          <CircleCheck className="ic ic-lg" aria-hidden="true" />
        </span>
        <h2 className="t-h4">আপনি এই সার্কেলের সদস্য</h2>
        <p className="t-small t-muted">
          আসন্ন বৈঠকগুলোতে “আসছি” জানিয়ে রাখুন, সমন্বয়কের প্রস্তুতি সহজ হবে।
        </p>
      </div>
    )
  }

  if (data?.membership === 'pending') {
    return (
      <div className="empty" role="status" style={{ padding: '12px 0' }}>
        <span
          className="empty__icon"
          style={{ background: 'var(--rh-success-soft)', color: 'var(--rh-success)' }}
        >
          <CircleCheck className="ic ic-lg" aria-hidden="true" />
        </span>
        <h2 className="t-h4">অনুরোধ পাঠানো হয়েছে</h2>
        <p className="t-small t-muted">সমন্বয়ক শিগগিরই যোগাযোগ করবেন, ইনশাআল্লাহ।</p>
        <Button variant="ghost" size="sm" onClick={cancel} pending={pending}>
          অনুরোধ বাতিল করুন
        </Button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="t-h4">সার্কেলে যুক্ত হোন</h2>
      <p className="t-small t-muted" style={{ marginTop: 6 }}>
        অনুরোধ পাঠালে সমন্বয়ক ফোনে যোগাযোগ করে প্রথম বৈঠকে আমন্ত্রণ জানাবেন।
      </p>
      {signedIn ? (
        <>
          {error ? (
            <div style={{ marginTop: 12 }}>
              <FormAlert>{error}</FormAlert>
            </div>
          ) : null}
          <Field
            label="সমন্বয়ককে কিছু জানাতে চান?"
            optional
            htmlFor="cd-note"
            style={{ marginTop: 16 }}
          >
            <Textarea
              id="cd-note"
              style={{ minHeight: 88 }}
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="যেমন: আমি কাছাকাছি থাকি, শুক্রবার সন্ধ্যায় আসতে পারব।"
            />
          </Field>
          <Button block style={{ marginTop: 14 }} onClick={request} pending={pending}>
            যুক্ত হওয়ার অনুরোধ পাঠান
          </Button>
        </>
      ) : (
        <ButtonLink
          href={`/login?next=${encodeURIComponent(`${pathname ?? '/circles'}#join`)}`}
          block
          style={{ marginTop: 16 }}
        >
          <LogIn className="ic" aria-hidden="true" /> লগইন করে অনুরোধ পাঠান
        </ButtonLink>
      )}
    </div>
  )
}

type Meetup = {
  id: number
  startsAt: string
  topic: string
  meta?: string | null
  attendingCount?: number | null
}

/** Upcoming meetups with an "আসছি" toggle (optimistic). */
export function MeetupList({ circleId, meetups }: { circleId: number; meetups: Meetup[] }) {
  const qc = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()
  const { data, signedIn } = useCircleState(circleId)
  const [counts, setCounts] = useState<Record<number, number>>({})
  const [busy, setBusy] = useState<number | null>(null)
  const going = new Set(data?.rsvps ?? [])

  function toggle(m: Meetup) {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(pathname ?? '/circles')}`)
      return
    }
    const was = going.has(m.id)
    qc.setQueryData<CircleState>(stateKey(circleId), (prev) => ({
      membership: prev?.membership ?? null,
      rsvps: was ? (prev?.rsvps ?? []).filter((id) => id !== m.id) : [...(prev?.rsvps ?? []), m.id],
    }))
    setBusy(m.id)
    void toggleMeetupRsvpAction(m.id).then((res) => {
      setBusy(null)
      if (!res.ok) {
        void qc.invalidateQueries({ queryKey: stateKey(circleId) })
        toast.error('জানানো যায়নি', { description: res.error })
        return
      }
      setCounts((c) => ({ ...c, [m.id]: res.data.attendingCount }))
    })
  }

  if (!meetups.length) {
    return (
      <p className="t-muted" style={{ padding: '18px 0' }}>
        পরের বৈঠকের তারিখ শিগগিরই জানানো হবে।
      </p>
    )
  }
  return (
    <>
      {meetups.map((m) => {
        const isGoing = going.has(m.id)
        const count = counts[m.id] ?? m.attendingCount ?? 0
        return (
          <div key={m.id} className="meetup-row">
            <DateTile size="sm" day={formatDay(m.startsAt)} month={formatMonth(m.startsAt)} />
            <div>
              <strong style={{ display: 'block', lineHeight: 1.5 }}>{m.topic}</strong>
              <span className="t-small t-muted">
                {[m.meta, count ? `${bn(count)} জন আসছেন` : null].filter(Boolean).join(' · ')}
              </span>
            </div>
            <button
              type="button"
              className={`btn btn-sm ${isGoing ? 'btn-primary' : 'btn-secondary'}`}
              aria-pressed={isGoing}
              onClick={() => toggle(m)}
              disabled={busy === m.id}
            >
              {isGoing ? (
                <>
                  <Check className="ic" aria-hidden="true" /> আসছি
                </>
              ) : (
                'আসব'
              )}
            </button>
          </div>
        )
      })}
    </>
  )
}
