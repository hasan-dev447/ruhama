import { describe, expect, it } from 'vitest'

import { createState, parseDuration, readState } from '@/server/youtube'

describe('youtube connect state', () => {
  const now = Date.parse('2026-10-07T10:00:00Z')

  it('round-trips the user and the page to return to', () => {
    const s = createState(17, '/admin/collections/event-recaps', now)
    expect(readState(s, now + 1000)).toEqual({
      userId: '17',
      returnTo: '/admin/collections/event-recaps',
    })
  })

  it('refuses a changed, expired or missing state', () => {
    const s = createState(17, '/admin', now)
    const [body, mac] = s.split('.')
    expect(readState(`${body}x.${mac}`, now)).toBeNull()
    expect(readState(`${body}.${mac}x`, now)).toBeNull()
    expect(readState(s, now + 11 * 60 * 1000)).toBeNull()
    expect(readState(null, now)).toBeNull()
  })

  it('never sends the user back to another site', () => {
    expect(readState(createState(1, '//evil.example', now), now)?.returnTo).toBe('/admin')
    expect(readState(createState(1, 'https://evil.example', now), now)?.returnTo).toBe('/admin')
  })
})

describe('parseDuration', () => {
  it('reads YouTube durations', () => {
    expect(parseDuration('PT1H2M3S')).toBe(3723)
    expect(parseDuration('PT45S')).toBe(45)
    expect(parseDuration('PT12M')).toBe(720)
    expect(parseDuration('P1DT1S')).toBe(86401)
    expect(parseDuration('')).toBeNull()
  })
})
