'use client'

import { useCallback, useEffect, useState } from 'react'

import { IconAdd, IconCalendarOff } from '@/components/icons'

import { OpenDocument, type Target } from './list-drawer'

type EventRow = { id: number; title: string; startsAt: string; registrationCount?: number | null }

const GRACE_MS = 3 * 3600 * 1000 // lib/events.ts

/** where[...] for published মজলিস that are over (the same rule as lib/events.ts). */
function endedQuery() {
  const now = Date.now()
  const q = new URLSearchParams({
    'where[and][0][status][equals]': 'published',
    'where[and][1][or][0][endsAt][less_than]': new Date(now).toISOString(),
    'where[and][1][or][1][and][0][endsAt][exists]': 'false',
    'where[and][1][or][1][and][1][startsAt][less_than]': new Date(now - GRACE_MS).toISOString(),
    sort: '-startsAt',
    limit: '100',
    depth: '0',
    'select[title]': 'true',
    'select[startsAt]': 'true',
    'select[registrationCount]': 'true',
  })
  return q.toString()
}

const showDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

/**
 * Above the recaps list: মজলিস that are over and still have no recap, newest first, each with a
 * button that opens a new recap for it in the side panel.
 */
export function PendingRecaps() {
  const [rows, setRows] = useState<EventRow[] | null>(null)
  const [reload, setReload] = useState(0)
  const [target, setTarget] = useState<(Target & { eventId: number }) | null>(null)

  useEffect(() => {
    let alive = true
    Promise.all([
      fetch(`/api/events?${endedQuery()}`, { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/event-recaps?limit=1000&depth=0&draft=true&select[event]=true', {
        credentials: 'include',
      }).then((r) => r.json()),
    ])
      .then(([events, recaps]: [{ docs?: EventRow[] }, { docs?: { event: number }[] }]) => {
        if (!alive) return
        const done = new Set((recaps.docs ?? []).map((r) => r.event))
        setRows((events.docs ?? []).filter((e) => !done.has(e.id)))
      })
      .catch(() => alive && setRows([]))
    return () => {
      alive = false
    }
  }, [reload])

  const refresh = useCallback(() => setReload((n) => n + 1), [])
  const close = useCallback(() => setTarget(null), [])

  if (!rows || !rows.length) return null
  return (
    <div className="rh-pending-recaps">
      <div className="rh-pending-recaps__head">
        <strong>
          <IconCalendarOff size={16} aria-hidden="true" /> সারসংক্ষেপ বাকি ({rows.length})
        </strong>
        <span>শেষ হয়ে যাওয়া এই মজলিসগুলোতে কী হয়েছিল এখনো লেখা হয়নি।</span>
      </div>
      <ul>
        {rows.slice(0, 12).map((e) => (
          <li key={e.id}>
            <span className="rh-pending-recaps__title">{e.title}</span>
            <span className="rh-contacts-panel__tag">{showDate(e.startsAt)}</span>
            {e.registrationCount ? (
              <span className="rh-contacts-panel__tag">{e.registrationCount} রেজিস্ট্রেশন</span>
            ) : null}
            <button
              type="button"
              className="rh-int-btn"
              onClick={() => setTarget({ slug: 'event-recaps', key: Date.now(), eventId: e.id })}
            >
              <IconAdd size={15} /> সারসংক্ষেপ লিখুন
            </button>
          </li>
        ))}
      </ul>
      {target ? (
        <OpenDocument
          key={target.key}
          target={target}
          onClosed={close}
          onChange={refresh}
          initialData={{ event: target.eventId }}
        />
      ) : null}
    </div>
  )
}
