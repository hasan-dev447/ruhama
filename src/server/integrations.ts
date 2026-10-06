import { decryptSecret } from './crypto/secrets'

/**
 * Third-party credentials, editable from the admin (Integrations) with .env as the fallback.
 * Read on demand and cached for a minute per server instance; saving the settings clears the cache of
 * the instance that saved them, so other instances follow within that minute.
 */

export type OAuthSettings = { enabled: boolean; clientId: string; clientSecret: string }
export type SmsSettings = {
  provider: 'console' | 'bd_gateway'
  apiUrl: string
  apiKey: string
  senderId: string
}
export type EmailSettings = { resendApiKey: string; from: string; replyTo: string }
export type IntegrationSettings = {
  google: OAuthSettings
  facebook: OAuthSettings
  sms: SmsSettings
  email: EmailSettings
}

type StoredGroup = Record<string, string | boolean | null | undefined>
type Stored = Partial<Record<keyof IntegrationSettings, StoredGroup>>

const TTL_MS = 60_000
let cache: { value: IntegrationSettings; at: number } | null = null
let inflight: Promise<IntegrationSettings> | null = null

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const env = (name: string) => (process.env[name] ?? '').trim()

/** Merge stored admin values over environment variables (exported for tests). */
export function resolveIntegrations(stored: Stored | null, secret?: string): IntegrationSettings {
  const oauth = (key: 'google' | 'facebook', envPrefix: string): OAuthSettings => {
    const g = stored?.[key] ?? {}
    const clientId = text(g.clientId) || env(`${envPrefix}_CLIENT_ID`)
    const clientSecret =
      decryptSecret(text(g.clientSecretEnc), secret) || env(`${envPrefix}_CLIENT_SECRET`)
    return {
      enabled: g.enabled !== false && Boolean(clientId && clientSecret),
      clientId,
      clientSecret,
    }
  }
  const s = stored?.sms ?? {}
  const e = stored?.email ?? {}
  const smsProvider = text(s.provider) || env('SMS_PROVIDER')
  return {
    google: oauth('google', 'GOOGLE'),
    facebook: oauth('facebook', 'FACEBOOK'),
    sms: {
      provider: smsProvider === 'bd_gateway' ? 'bd_gateway' : 'console',
      apiUrl: text(s.apiUrl) || env('SMS_API_URL'),
      apiKey: decryptSecret(text(s.apiKeyEnc), secret) || env('SMS_API_KEY'),
      senderId: text(s.senderId) || env('SMS_SENDER_ID'),
    },
    email: {
      resendApiKey: decryptSecret(text(e.resendApiKeyEnc), secret) || env('RESEND_API_KEY'),
      from: text(e.from) || env('EMAIL_FROM') || 'Ruhama <noreply@ruhama.org>',
      replyTo: text(e.replyTo) || env('EMAIL_REPLY_TO'),
    },
  }
}

async function readStored(): Promise<Stored | null> {
  try {
    const { getPayloadClient } = await import('./payload')
    const payload = await getPayloadClient()
    return (await payload.findGlobal({
      slug: 'integrations',
      depth: 0,
      overrideAccess: true,
      showHiddenFields: true,
    })) as unknown as Stored
  } catch {
    // table not migrated yet, or the database is unreachable: fall back to .env
    return null
  }
}

/** Current settings (cached for a minute). */
export async function loadIntegrations(force = false): Promise<IntegrationSettings> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.value
  inflight ??= readStored()
    .then((stored) => {
      const value = resolveIntegrations(stored)
      cache = { value, at: Date.now() }
      return value
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

/** Synchronous read for code that cannot await (OAuth credential getters); call loadIntegrations first. */
export function cachedIntegrations(): IntegrationSettings {
  return cache?.value ?? resolveIntegrations(null)
}

export function invalidateIntegrations() {
  cache = null
}

/** Which sign-in buttons to show. */
export async function oauthAvailability() {
  const s = await loadIntegrations()
  return { google: s.google.enabled, facebook: s.facebook.enabled }
}
