import { describe, expect, it } from 'vitest'

import {
  bn,
  bnCompact,
  formatDate,
  formatDuration,
  formatMinutes,
  formatRelative,
  formatTime,
  initials,
} from '@/lib/format'

describe('Bangla formatting', () => {
  it('converts digits', () => {
    expect(bn(2026)).toBe('২০২৬')
    expect(bn('RH-1610-088')).toBe('RH-১৬১০-০৮৮')
  })

  it('formats dates in Bangladesh time', () => {
    // 20:00 UTC on 3 October is 02:00 on 4 October in Dhaka
    expect(formatDate('2026-10-03T20:00:00Z')).toBe('৪ অক্টোবর ২০২৬')
    expect(formatTime('2026-10-04T15:00:00Z')).toBe('রাত ৯:০০')
  })

  it('formats durations and counts', () => {
    expect(formatDuration(2770)).toBe('৪৬:১০')
    expect(formatDuration(3725)).toBe('১:০২:০৫')
    expect(formatMinutes(80)).toBe('১ ঘণ্টা ২০ মিনিট')
    expect(bnCompact(21000)).toBe('২১ হাজার')
  })

  it('builds initials without honorifics', () => {
    expect(initials('উস্তাযা সুমাইয়া কবির')).toBe('সক')
    expect(initials('ড. মাহমুদুল হাসান')).toBe('মহ')
  })
})

describe('formatRelative', () => {
  const now = new Date('2026-10-05T12:00:00Z')
  const ago = (sec: number) => new Date(now.getTime() - sec * 1000)
  it('spells relative times in Bangla without ICU', () => {
    expect(formatRelative(ago(10), now)).toBe('এইমাত্র')
    expect(formatRelative(ago(600), now)).toBe('১০ মিনিট আগে')
    expect(formatRelative(ago(7 * 3600), now)).toBe('৭ ঘণ্টা আগে')
    expect(formatRelative(ago(86400), now)).toBe('গতকাল')
    expect(formatRelative(ago(3 * 86400), now)).toBe('৩ দিন আগে')
    expect(formatRelative(ago(14 * 86400), now)).toBe('২ সপ্তাহ আগে')
    expect(formatRelative(ago(-2 * 3600), now)).toBe('২ ঘণ্টা পরে')
    expect(formatRelative(ago(-86400), now)).toBe('আগামীকাল')
  })
  it('returns an empty string for invalid input', () => {
    expect(formatRelative('not a date', now)).toBe('')
  })
})
