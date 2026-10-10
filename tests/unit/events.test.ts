import { describe, expect, it } from 'vitest'

import { EVENT_GRACE_MS, eventEnded } from '@/lib/events'

describe('eventEnded', () => {
  const start = '2026-10-10T15:00:00.000Z'
  const t = (iso: string) => new Date(iso).getTime()

  it('uses the end time when there is one', () => {
    const e = { startsAt: start, endsAt: '2026-10-10T16:15:00.000Z' }
    expect(eventEnded(e, t('2026-10-10T16:00:00.000Z'))).toBe(false)
    expect(eventEnded(e, t('2026-10-10T16:16:00.000Z'))).toBe(true)
  })

  it('without an end time, counts three hours from the start', () => {
    const e = { startsAt: start, endsAt: null }
    expect(eventEnded(e, t(start) + EVENT_GRACE_MS - 1000)).toBe(false)
    expect(eventEnded(e, t(start) + EVENT_GRACE_MS + 1000)).toBe(true)
  })
})
