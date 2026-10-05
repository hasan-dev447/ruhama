import { describe, expect, it } from 'vitest'

import { contentSecurityPolicy, securityHeaders } from '@/lib/security-headers'

const directive = (csp: string, name: string) =>
  csp.split('; ').find((d) => d.startsWith(`${name} `)) ?? ''

describe('security headers', () => {
  const prod = {
    NODE_ENV: 'production',
    NEXT_PUBLIC_MEDIA_URL: 'https://media.ruhama.org/x',
    NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
    NEXT_PUBLIC_SITE_URL: 'https://ruhama.org',
  }

  it('allows only the configured services in production', () => {
    const csp = contentSecurityPolicy(prod)
    expect(directive(csp, 'script-src')).toBe(
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
    )
    expect(directive(csp, 'connect-src')).toContain('wss://abc.supabase.co')
    expect(directive(csp, 'media-src')).toContain('https://media.ruhama.org')
    expect(directive(csp, 'frame-src')).toContain('https://www.youtube-nocookie.com')
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("frame-ancestors 'self'")
    expect(csp).toContain('upgrade-insecure-requests')
    expect(csp).not.toContain('unsafe-eval')
  })

  it('relaxes eval and websockets only in development', () => {
    const csp = contentSecurityPolicy({ NODE_ENV: 'development' })
    expect(directive(csp, 'script-src')).toContain("'unsafe-eval'")
    expect(directive(csp, 'connect-src')).toContain('ws:')
    expect(csp).not.toContain('upgrade-insecure-requests')
    expect(csp).not.toContain('null')
  })

  it('skips HTTPS-only directives for a local production run over http', () => {
    const local = { NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' }
    expect(contentSecurityPolicy(local)).not.toContain('upgrade-insecure-requests')
    expect(securityHeaders(local).some((h) => h.key === 'Strict-Transport-Security')).toBe(false)
  })

  it('sends HSTS in production only', () => {
    expect(securityHeaders(prod).some((h) => h.key === 'Strict-Transport-Security')).toBe(true)
    expect(
      securityHeaders({ NODE_ENV: 'development' }).some(
        (h) => h.key === 'Strict-Transport-Security',
      ),
    ).toBe(false)
  })
})
