import { IconCircles, IconSchedule, IconUsers } from '@/components/icons'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { IconTile } from '@/components/ui/primitives'
import { districtLabel } from '@/lib/districts'
import { bn, formatDayMonth, formatWeekday } from '@/lib/format'
import type { CircleCardView } from '@/server/queries/types'

export const CIRCLE_TYPE_LABEL = {
  brothers: 'ভাইদের',
  sisters: 'বোনদের',
  family: 'পারিবারিক',
} as const
const TYPE_BADGE = { brothers: 'cat', sisters: 'level', family: 'reviewed' } as const
export const FREQUENCY_LABEL: Record<string, string> = {
  weekly: 'সাপ্তাহিক',
  fortnightly: 'পাক্ষিক',
  monthly: 'মাসিক',
}

export const memberLabel = (count: number, unit: 'people' | 'families') =>
  unit === 'families' ? `${bn(count)}টি পরিবার` : `${bn(count)} জন সদস্য`

export function CircleCard({ circle }: { circle: CircleCardView }) {
  const href = `/circles/${circle.slug}`
  return (
    <article className="card card-hover circle-card">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <IconTile teal>
          <IconCircles className="ic ic-lg" />
        </IconTile>
        <Badge variant={TYPE_BADGE[circle.type]}>{CIRCLE_TYPE_LABEL[circle.type]}</Badge>
      </div>
      <div>
        <h2 className="t-h4" style={{ fontSize: 19 }}>
          <Link href={href} style={{ color: 'var(--rh-ink)', textDecoration: 'none' }}>
            {circle.name}
          </Link>
        </h2>
        <p className="t-small t-muted">
          {districtLabel(circle.district)} · {circle.focus}
        </p>
      </div>
      <div className="info-list" style={{ gap: 8 }}>
        <div>
          <IconSchedule className="ic" aria-hidden="true" />
          <span>
            {FREQUENCY_LABEL[circle.frequency] ?? circle.frequency} · {circle.scheduleLabel}
          </span>
        </div>
        <div>
          <IconUsers className="ic" aria-hidden="true" />
          <span>{memberLabel(circle.memberCount, circle.memberUnit)}</span>
        </div>
      </div>
      <div
        style={{
          marginTop: 'auto',
          padding: '12px 14px',
          borderRadius: 10,
          background: 'var(--rh-accent-soft)',
          fontSize: 14,
        }}
      >
        <span style={{ color: 'var(--rh-accent-ink)', fontWeight: 600 }}>পরের বৈঠক:</span>{' '}
        {circle.nextMeetup
          ? `${formatDayMonth(circle.nextMeetup.startsAt)}, ${formatWeekday(circle.nextMeetup.startsAt)}`
          : 'শিগগিরই জানানো হবে'}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <ButtonLink href={`${href}#join`} size="sm" style={{ flex: 1 }}>
          যুক্ত হতে চাই
        </ButtonLink>
        <ButtonLink href={href} variant="ghost" size="sm">
          বিস্তারিত
        </ButtonLink>
      </div>
    </article>
  )
}
