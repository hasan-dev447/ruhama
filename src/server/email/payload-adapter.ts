import type { EmailAdapter } from 'payload'

import { sendEmail } from './index'

/** Routes Payload's own emails (rare; auth emails come from Better Auth) through the same Resend sender. */
export const payloadEmailAdapter: EmailAdapter = () => ({
  name: 'ruhama-resend',
  defaultFromAddress: (process.env.EMAIL_FROM || 'Ruhama <noreply@ruhama.org>').replace(
    /^.*<|>$/g,
    '',
  ),
  defaultFromName: 'Ruhama',
  sendEmail: async (message) => {
    const to = Array.isArray(message.to) ? message.to.map(String) : String(message.to ?? '')
    const html = typeof message.html === 'string' ? message.html : ''
    const text = typeof message.text === 'string' ? message.text : html.replace(/<[^>]+>/g, ' ')
    return sendEmail({ to, subject: String(message.subject ?? 'Ruhama'), html, text })
  },
})
