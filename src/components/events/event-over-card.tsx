import { IconCalendarOff, IconPlay, IconUsers } from '@/components/icons'

import { ButtonLink } from '@/components/ui/button'
import { bn, formatLongDate } from '@/lib/format'

/** The side card of a মজলিস that is over: when it was held, and where to go next (no registration). */
export function EventOverCard({
  startsAt,
  endsAt,
  timeText,
  hasRecap,
  attendance,
}: {
  startsAt: string
  endsAt?: string | null
  timeText: string
  hasRecap: boolean
  attendance: number | null
}) {
  const sameDay = !endsAt || formatLongDate(endsAt) === formatLongDate(startsAt)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="icon-tile">
          <IconCalendarOff className="ic" aria-hidden="true" />
        </span>
        <h2 id="over-title" className="t-h4">
          এই মজলিস শেষ হয়েছে
        </h2>
      </div>
      <dl className="over-facts">
        <div>
          <dt>অনুষ্ঠিত হয়েছে</dt>
          <dd>
            {formatLongDate(startsAt)}
            {sameDay ? null : ` থেকে ${formatLongDate(endsAt!)}`}
            <br />
            {timeText}
          </dd>
        </div>
        {attendance ? (
          <div>
            <dt>উপস্থিতি</dt>
            <dd style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconUsers className="ic" aria-hidden="true" />
              প্রায় {bn(attendance)} জন
            </dd>
          </div>
        ) : null}
      </dl>
      <p className="t-small t-muted" style={{ margin: 0 }}>
        {hasRecap
          ? 'যাঁরা আসতে পারেননি, তাঁদের জন্য মজলিসের ছবি, ভিডিও ও সারসংক্ষেপ এই পেজে দেওয়া আছে।'
          : 'এই মজলিসের রেজিস্ট্রেশন বন্ধ। সামনের মজলিসগুলো দেখে নিন।'}
      </p>
      {hasRecap ? (
        <ButtonLink href="#recap" block>
          <IconPlay className="ic" aria-hidden="true" />
          কী হয়েছিল দেখুন
        </ButtonLink>
      ) : null}
      <ButtonLink href="/events" variant={hasRecap ? 'secondary' : 'primary'} block>
        আসন্ন মজলিস দেখুন
      </ButtonLink>
    </div>
  )
}
