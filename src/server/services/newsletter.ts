import { randomBytes } from 'node:crypto'

import { z } from 'zod'

import { emailTemplates } from '../email/templates'
import { sendEmail } from '../email'
import type { ServiceContext } from './context'
import { errors } from './errors'
import { consumeRateLimit } from './rate-limit'

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email('সঠিক ইমেইল ঠিকানা দিন।').max(200),
  source: z.string().max(40).optional(),
})

/** Subscribe (or re-subscribe) an email to the weekly letter. Idempotent. */
export async function subscribeNewsletter(
  ctx: ServiceContext,
  input: z.input<typeof newsletterSchema>,
) {
  const { email, source } = newsletterSchema.parse(input)
  const limit = await consumeRateLimit(
    ctx.payload,
    `newsletter:ip:${ctx.ip ?? 'unknown'}`,
    10,
    60 * 60,
  )
  if (!limit.allowed) throw errors.rateLimited()

  const existing = await ctx.payload.find({
    collection: 'newsletter-subscribers',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const doc = existing.docs[0]
  if (doc) {
    if (doc.status !== 'subscribed') {
      await ctx.payload.update({
        collection: 'newsletter-subscribers',
        id: doc.id,
        data: { status: 'subscribed' },
        overrideAccess: true,
      })
    }
    return { subscribed: true, alreadySubscribed: doc.status === 'subscribed' }
  }
  await ctx.payload.create({
    collection: 'newsletter-subscribers',
    data: {
      email,
      source: source ?? 'site',
      status: 'subscribed',
      user: ctx.user?.id ?? null,
      unsubscribeToken: randomBytes(18).toString('base64url'),
    },
    overrideAccess: true,
  })
  const { html, text } = emailTemplates.newsletterWelcome()
  await sendEmail({ to: email, subject: 'সাপ্তাহিক চিঠিতে স্বাগতম · Ruhama', html, text })
  return { subscribed: true, alreadySubscribed: false }
}

export async function unsubscribeNewsletter(ctx: ServiceContext, token: string) {
  if (!token || token.length < 10) throw errors.invalid('লিংকটি সঠিক নয়।')
  const res = await ctx.payload.find({
    collection: 'newsletter-subscribers',
    where: { unsubscribeToken: { equals: token } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const doc = res.docs[0]
  if (!doc) throw errors.notFound('লিংকটি সঠিক নয় বা মেয়াদ শেষ।')
  await ctx.payload.update({
    collection: 'newsletter-subscribers',
    id: doc.id,
    data: { status: 'unsubscribed' },
    overrideAccess: true,
  })
  return { unsubscribed: true }
}
