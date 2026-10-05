import { writeOutbox } from '../outbox'

export type SmsResult = { ok: true; id?: string } | { ok: false; error: string }

/** Any SMS gateway can be plugged in by implementing this interface. */
export interface SmsProvider {
  readonly name: string
  send(to: string, message: string): Promise<SmsResult>
}

/** Development adapter: prints the message (and writes to OUTBOX_DIR when set). */
export class ConsoleSmsProvider implements SmsProvider {
  readonly name = 'console'
  async send(to: string, message: string): Promise<SmsResult> {
    const captured = await writeOutbox('sms', { to, message })
    if (!captured) console.info(`\n[sms:dev] to=${to}\n${message}\n`)
    return { ok: true, id: 'console' }
  }
}

/** Production without a configured gateway: refuses to send rather than leaking codes to the log. */
export class UnavailableSmsProvider implements SmsProvider {
  readonly name = 'unavailable'
  async send(): Promise<SmsResult> {
    return { ok: false, error: 'sms_not_configured' }
  }
}

/**
 * Bangladeshi bulk-SMS gateway adapter (BulkSMSBD-style HTTP API).
 * Configure with SMS_API_URL, SMS_API_KEY and SMS_SENDER_ID.
 * Numbers are sent without the leading “+”, e.g. 8801712345678.
 */
export class BdGatewaySmsProvider implements SmsProvider {
  readonly name = 'bd_gateway'
  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string,
    private readonly senderId: string,
  ) {}

  async send(to: string, message: string): Promise<SmsResult> {
    const body = new URLSearchParams({
      api_key: this.apiKey,
      senderid: this.senderId,
      number: to.replace(/^\+/, ''),
      message,
      type: 'unicode',
    })
    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body,
        signal: AbortSignal.timeout(10_000),
      })
      const text = await res.text()
      let json: Record<string, unknown> | null = null
      try {
        json = JSON.parse(text) as Record<string, unknown>
      } catch {
        json = null
      }
      const code = Number(json?.response_code ?? json?.status_code ?? res.status)
      if (!res.ok || (json && code >= 300 && code !== 1000)) {
        return {
          ok: false,
          error: String(json?.error_message ?? json?.message ?? `gateway_status_${res.status}`),
        }
      }
      return { ok: true, id: String(json?.message_id ?? json?.success_message ?? '') }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'gateway_unreachable' }
    }
  }
}

let provider: SmsProvider | null = null

export function getSmsProvider(): SmsProvider {
  if (provider) return provider
  const { SMS_PROVIDER, SMS_API_URL, SMS_API_KEY, SMS_SENDER_ID } = process.env
  if (SMS_PROVIDER === 'bd_gateway' && SMS_API_URL && SMS_API_KEY && SMS_SENDER_ID) {
    provider = new BdGatewaySmsProvider(SMS_API_URL, SMS_API_KEY, SMS_SENDER_ID)
  } else if (process.env.NODE_ENV === 'production' && !process.env.OUTBOX_DIR) {
    // never print login codes into production logs: without a gateway, OTP requests fail visibly instead
    console.error(
      '[sms] no SMS gateway configured (SMS_PROVIDER=bd_gateway with SMS_API_URL, SMS_API_KEY, SMS_SENDER_ID); OTP messages are not sent',
    )
    provider = new UnavailableSmsProvider()
  } else {
    provider = new ConsoleSmsProvider()
  }
  return provider
}

export async function sendSms(to: string, message: string): Promise<SmsResult> {
  return getSmsProvider().send(to, message)
}
