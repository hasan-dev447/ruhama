import { describe, expect, it } from 'vitest'

import { clientIpFrom, trustedIpHeaders } from '@/lib/client-ip'

describe('client IP', () => {
  it('ignores headers a client can forge on Vercel', () => {
    const h = new Headers({ 'cf-connecting-ip': '6.6.6.6', 'x-real-ip': '203.0.113.7' })
    expect(clientIpFrom(h, {})).toBe('203.0.113.7')
  })
  it('takes the first address of x-forwarded-for', () => {
    expect(clientIpFrom(new Headers({ 'x-forwarded-for': '198.51.100.4, 10.0.0.1' }), {})).toBe(
      '198.51.100.4',
    )
  })
  it('trusts only the configured header behind another proxy', () => {
    const env = { TRUSTED_IP_HEADER: 'CF-Connecting-IP' }
    expect(trustedIpHeaders(env)).toEqual(['cf-connecting-ip'])
    expect(
      clientIpFrom(new Headers({ 'x-real-ip': '1.1.1.1', 'cf-connecting-ip': '203.0.113.9' }), env),
    ).toBe('203.0.113.9')
  })
  it('falls back to unknown', () => {
    expect(clientIpFrom(new Headers(), {})).toBe('unknown')
  })
})
