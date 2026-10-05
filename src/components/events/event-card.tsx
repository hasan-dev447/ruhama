import { Clock, MapPin, Video } from 'lucide-react'
import Link from 'next/link'

import { eventPlace, eventWhen } from '@/components/content/cards'
import { ModeBadge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { DateTile, Progress } from '@/components/ui/primitives'
import { bn, formatDay, formatMonth } from '@/lib/format'
import type { EventCardView } from '@/server/queries/types'

export function seatText(capacity: number, taken: number) {
  const left = Math.max(0, capacity - taken)
  if (left === 0) return 'সব আসন পূর্ণ'
  return `${bn(capacity)} আসনের ${bn(Math.min(taken, capacity))}টি পূর্ণ · ${bn(left)}টি বাকি`
}

/** Event card on the মজলিস index (design `Events` board). */
export function EventCard({ event }: { event: EventCardView }) {
  const href = `/events/${event.slug}`
  const fill = event.capacity
    ? Math.round((Math.min(event.seatsTaken, event.capacity) / event.capacity) * 100)
    : 0
  const full = event.seatsTaken >= event.capacity
  return (
    <article
      className="card card-hover"
      style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <DateTile day={formatDay(event.startsAt)} month={formatMonth(event.startsAt)} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          <ModeBadge mode={event.mode} style={{ alignSelf: 'flex-start' }} />
          <h2 className="t-h4" style={{ fontSize: 19 }}>
            <Link href={href} style={{ color: 'var(--rh-ink)', textDecoration: 'none' }}>
              {event.title}
            </Link>
          </h2>
        </div>
      </div>
      <div className="info-list" style={{ gap: 8 }}>
        <div>
          <Clock className="ic" aria-hidden="true" />
          <span>{eventWhen(event)}</span>
        </div>
        <div>
          {event.mode === 'online' ? (
            <Video className="ic" aria-hidden="true" />
          ) : (
            <MapPin className="ic" aria-hidden="true" />
          )}
          <span>{eventPlace(event)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto' }}>
        <div
          className="t-muted"
          style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}
        >
          <span>{seatText(event.capacity, event.seatsTaken)}</span>
        </div>
        <Progress value={fill} gold label="আসন পূর্ণ" />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <ButtonLink
          href={`${href}#register`}
          size="sm"
          style={{ flex: 1 }}
          variant={full ? 'secondary' : 'primary'}
        >
          {full ? 'আসন পূর্ণ' : 'রেজিস্টার করুন'}
        </ButtonLink>
        <ButtonLink href={href} variant="ghost" size="sm">
          বিস্তারিত
        </ButtonLink>
      </div>
    </article>
  )
}
