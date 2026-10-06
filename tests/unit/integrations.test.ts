import { afterEach, describe, expect, it, vi } from 'vitest'

import { decryptSecret, encryptSecret, secretHint } from '@/server/crypto/secrets'
import { resolveIntegrations } from '@/server/integrations'

const KEY = 'test-payload-secret'

describe('secret encryption', () => {
  it('round-trips and never stores the plain value', () => {
    const stored = encryptSecret('re_live_abcdef123456', KEY)
    expect(stored).not.toContain('abcdef')
    expect(stored.startsWith('v1:')).toBe(true)
    expect(decryptSecret(stored, KEY)).toBe('re_live_abcdef123456')
  })

  it('uses a fresh IV each time', () => {
    expect(encryptSecret('same', KEY)).not.toBe(encryptSecret('same', KEY))
  })

  it('returns null for a wrong key, tampering or junk', () => {
    const stored = encryptSecret('secret-value', KEY)
    expect(decryptSecret(stored, 'another-secret')).toBeNull()
    const parts = stored.split(':')
    parts[3] = Buffer.from('tampered').toString('base64')
    expect(decryptSecret(parts.join(':'), KEY)).toBeNull()
    expect(decryptSecret('not-encrypted', KEY)).toBeNull()
    expect(decryptSecret(null, KEY)).toBeNull()
  })

  it('hints only the last four characters', () => {
    expect(secretHint('GOCSPX-abcdefgh1234')).toBe('••••1234')
    expect(secretHint('short')).toBe('••••')
  })
})

describe('resolveIntegrations', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('falls back to environment variables', () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'env-id')
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'env-secret')
    vi.stubEnv('FACEBOOK_CLIENT_ID', '')
    vi.stubEnv('RESEND_API_KEY', 'env-resend')
    const s = resolveIntegrations(null, KEY)
    expect(s.google).toEqual({ enabled: true, clientId: 'env-id', clientSecret: 'env-secret' })
    expect(s.facebook.enabled).toBe(false)
    expect(s.email.resendApiKey).toBe('env-resend')
  })

  it('prefers saved admin values and decrypts secrets', () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'env-id')
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'env-secret')
    const s = resolveIntegrations(
      {
        google: {
          enabled: true,
          clientId: 'db-id',
          clientSecretEnc: encryptSecret('db-secret', KEY),
        },
        sms: {
          provider: 'bd_gateway',
          apiUrl: 'https://sms.example/api',
          apiKeyEnc: encryptSecret('sms-key', KEY),
          senderId: 'Ruhama',
        },
        email: { resendApiKeyEnc: encryptSecret('re_db', KEY), from: 'Ruhama <hi@example.org>' },
      },
      KEY,
    )
    expect(s.google).toEqual({ enabled: true, clientId: 'db-id', clientSecret: 'db-secret' })
    expect(s.sms).toEqual({
      provider: 'bd_gateway',
      apiUrl: 'https://sms.example/api',
      apiKey: 'sms-key',
      senderId: 'Ruhama',
    })
    expect(s.email.resendApiKey).toBe('re_db')
    expect(s.email.from).toBe('Ruhama <hi@example.org>')
  })

  it('lets admins switch a configured provider off', () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'env-id')
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'env-secret')
    expect(resolveIntegrations({ google: { enabled: false } }, KEY).google.enabled).toBe(false)
  })

  it('ignores a secret that cannot be decrypted and uses .env instead', () => {
    vi.stubEnv('RESEND_API_KEY', 'env-resend')
    const s = resolveIntegrations(
      { email: { resendApiKeyEnc: encryptSecret('x', 'old-secret') } },
      KEY,
    )
    expect(s.email.resendApiKey).toBe('env-resend')
  })
})
