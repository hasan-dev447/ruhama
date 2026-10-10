import { districtLabel } from '@/lib/districts'
import { CONTACT_TOPICS } from '@/lib/options'
import { isPlaceholderEmail, normalizeBdPhone } from '@/lib/phone'
import {
  contactSchema,
  volunteerSchema,
  type ContactInput,
  type VolunteerInput,
} from '@/lib/validation/forms'

import { emailTemplates } from '../email/templates'
import { sendEmail } from '../email'
import type { ServiceContext } from './context'
import { errors } from './errors'
import { notify, usersWithRoles } from './notifications'
import { consumeRateLimit } from './rate-limit'
import { verifyTurnstile } from './turnstile'
import { rolesAt } from '@/server/permissions'

async function guard(ctx: ServiceContext, key: string, token: string | undefined) {
  const limit = await consumeRateLimit(ctx.payload, `${key}:ip:${ctx.ip ?? 'unknown'}`, 5, 60 * 60)
  if (!limit.allowed) throw errors.rateLimited()
  if (!ctx.user && !(await verifyTurnstile(token, ctx.ip))) {
    throw errors.invalid('আপনি যে মানুষ, তা যাচাই করা যায়নি। আবার চেষ্টা করুন।', [
      { path: 'turnstileToken', message: 'যাচাই সম্পন্ন করুন।' },
    ])
  }
}

/** "যুক্ত হোন" application. The district coordinator team is notified. */
export async function submitVolunteer(ctx: ServiceContext, input: VolunteerInput) {
  const data = volunteerSchema.parse(input)
  await guard(ctx, 'volunteer', data.turnstileToken)
  const phone = normalizeBdPhone(data.phone)!

  const doc = await ctx.payload.create({
    collection: 'volunteers',
    data: {
      name: data.name,
      phone,
      email: data.email || null,
      district: data.district as never,
      interests: data.interests as never,
      message: data.message || null,
      user: ctx.user?.id ?? null,
      status: 'new',
    },
    overrideAccess: true,
    depth: 0,
  })

  const email =
    data.email || (ctx.user?.email && !isPlaceholderEmail(ctx.user.email) ? ctx.user.email : null)
  if (email) {
    const { html, text } = emailTemplates.volunteerReceived(data.name)
    await sendEmail({ to: email, subject: 'আপনার আবেদন পেয়েছি · Ruhama', html, text })
  }
  const staff = await usersWithRoles(ctx.payload, await rolesAt('volunteers', 'edit'))
  await notify(ctx.payload, {
    recipients: staff,
    kind: 'system',
    text: `নতুন যুক্ত হওয়ার আবেদন: ${data.name}, ${districtLabel(data.district)}`,
    link: `/admin/collections/volunteers/${doc.id}`,
    actorId: ctx.user?.id,
  })
  return { id: doc.id }
}

/** Contact form. Corrections go to editors, everything else to the moderation team. */
export async function submitContact(ctx: ServiceContext, input: ContactInput) {
  const data = contactSchema.parse(input)
  await guard(ctx, 'contact', data.turnstileToken)

  const doc = await ctx.payload.create({
    collection: 'contact-messages',
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone ? normalizeBdPhone(data.phone) : null,
      topic: data.topic as never,
      subject: data.subject,
      message: data.message,
      user: ctx.user?.id ?? null,
      status: 'new',
    },
    overrideAccess: true,
    depth: 0,
  })

  const { html, text } = emailTemplates.contactReceived(data.name)
  await sendEmail({ to: data.email, subject: 'আপনার বার্তা পেয়েছি · Ruhama', html, text })

  const topicLabel = CONTACT_TOPICS.find((t) => t.value === data.topic)?.label ?? 'সাধারণ'
  const staff = await usersWithRoles(
    ctx.payload,
    data.topic === 'correction'
      ? await rolesAt('articles', 'edit')
      : await rolesAt('contact-messages', 'edit'),
  )
  await notify(ctx.payload, {
    recipients: staff,
    kind: 'system',
    text: `নতুন বার্তা (${topicLabel}): ${data.subject}`,
    link: `/admin/collections/contact-messages/${doc.id}`,
    actorId: ctx.user?.id,
  })
  return { id: doc.id }
}
