import { Resend } from 'resend'

import { loadIntegrations, type EmailSettings } from '../integrations'
import { writeOutbox } from '../outbox'

export type EmailMessage = {
  to: string | string[]
  subject: string
  html: string
  text: string
  replyTo?: string
  tags?: { name: string; value: string }[]
}

export type EmailResult = { ok: true; id?: string } | { ok: false; error: string }

// one client per API key, so a key changed in the admin takes effect without a restart
let resend: { key: string; client: Resend } | null = null

function client(key: string): Resend | null {
  if (!key) return null
  if (resend?.key !== key) resend = { key, client: new Resend(key) }
  return resend.client
}

/**
 * Send a transactional email through Resend, using the key from the admin (Integrations) or .env.
 * Without a key (local development and tests) the message is logged instead.
 */
export async function sendEmail(
  message: EmailMessage,
  settings?: EmailSettings,
): Promise<EmailResult> {
  const config = settings ?? (await loadIntegrations()).email
  const from = config.from
  const api = client(config.resendApiKey)
  if (!api) {
    const captured = await writeOutbox('email', {
      to: message.to,
      subject: message.subject,
      text: message.text,
    })
    if (process.env.NODE_ENV === 'production' && !captured) {
      console.error('[email] RESEND_API_KEY is not set; email not sent:', message.subject)
      return { ok: false, error: 'email_not_configured' }
    }
    if (!captured)
      console.info(
        `\n[email:dev] to=${String(message.to)} subject="${message.subject}"\n${message.text}\n`,
      )
    return { ok: true, id: 'dev' }
  }
  try {
    const { data, error } = await api.emails.send({
      from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: message.replyTo ?? (config.replyTo || undefined),
      tags: message.tags,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true, id: data?.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' }
  }
}
