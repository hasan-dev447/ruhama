import { describe, expect, it } from 'vitest'

import { emailGrace, isProfileIncomplete } from '@/lib/profile-complete'

const day = 86_400_000
const now = Date.parse('2026-10-07T12:00:00Z')
const fb = (daysAgo: number) => ({
  gender: 'brother',
  email: '1234567890@facebook.ruhama.local',
  createdAt: new Date(now - daysAgo * day).toISOString(),
})

describe('email grace for accounts without a real email', () => {
  it('lets the account in for 7 days, counting down', () => {
    expect(emailGrace(fb(0), now)).toMatchObject({ needed: true, daysLeft: 7, expired: false })
    expect(emailGrace(fb(6.5), now)).toMatchObject({ daysLeft: 1, expired: false })
    expect(isProfileIncomplete(fb(3), now)).toBe(false)
  })

  it('holds the account once the 7 days are up', () => {
    expect(emailGrace(fb(7), now)).toMatchObject({ daysLeft: 0, expired: true })
    expect(isProfileIncomplete(fb(10), now)).toBe(true)
  })

  it('never holds an account with a real email, and always asks ভাই / বোন first', () => {
    expect(isProfileIncomplete({ gender: 'sister', email: 'a@b.com', createdAt: null }, now)).toBe(
      false,
    )
    expect(isProfileIncomplete({ ...fb(0), gender: null }, now)).toBe(true)
  })

  it('gives no grace when the start date is unknown', () => {
    expect(emailGrace({ email: 'x@facebook.ruhama.local', createdAt: null }, now).expired).toBe(
      true,
    )
  })
})
