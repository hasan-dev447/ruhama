import { Resend } from 'resend'

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

let resend: Resend | null = null

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!resend) resend = new Resend(key)
  return resend
}

/**
 * Send a transactional email through Resend.
 * Without RESEND_API_KEY (local development and tests) the message is logged instead.
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const from = process.env.EMAIL_FROM || 'Ruhama <noreply@ruhama.org>'
  const api = client()
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
      replyTo: message.replyTo ?? process.env.EMAIL_REPLY_TO,
      tags: message.tags,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true, id: data?.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' }
  }
}
