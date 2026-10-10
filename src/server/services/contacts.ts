import { createHash, randomInt, timingSafeEqual } from 'node:crypto'

import type { Payload } from 'payload'
import { z } from 'zod'

import { bn } from '@/lib/format'
import { isPlaceholderEmail, normalizeBdPhone } from '@/lib/phone'

import { sendEmail } from '../email'
import { emailTemplates } from '../email/templates'
import { deliveryAvailability } from '../integrations'
import { sendSms } from '../sms'
import type { ServiceContext } from './context'
import { requireUser } from './context'
import { errors } from './errors'
import { consumeRateLimit } from './rate-limit'
import { userRules } from '../rules'

/**
 * A member's emails and mobile numbers, like Facebook's: one primary of each (on the user, where Better
 * Auth signs in with it) and any number of others (user-contacts). Each new one is confirmed with a
 * six-digit code sent to it; a confirmed one can sign in and can be made primary.
 */

export type ContactKind = 'email' | 'phone'
export type ContactView = { value: string; primary: boolean; verified: boolean }
export type ContactList = { emails: ContactView[]; phones: ContactView[] }

const MAX_ATTEMPTS = 5

const hashCode = (code: string, value: string) =>
  createHash('sha256')
    .update(`ruhama:contact:${value}:${code}:${process.env.PAYLOAD_SECRET ?? ''}`)
    .digest('hex')

/** Lower-case email or +8801XXXXXXXXX; throws a Bangla validation error otherwise. */
export function normalizeContact(kind: ContactKind, raw: unknown): string {
  if (kind === 'email') {
    const parsed = z.string().trim().toLowerCase().email().safeParse(raw)
    if (!parsed.success || isPlaceholderEmail(parsed.data))
      throw errors.invalid('সঠিক ইমেইল ঠিকানা দিন।')
    return parsed.data
  }
  const phone = normalizeBdPhone(String(raw ?? ''))
  if (!phone) throw errors.invalid('সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন ০১৭১২৩৪৫৬৭৮)।')
  return phone
}

/** The account that owns an email or number, whether as its primary or as a confirmed extra one. */
export async function findContactOwner(
  payload: Payload,
  kind: ContactKind,
  value: string,
): Promise<{ userId: number; primary: boolean } | null> {
  const field = kind === 'email' ? 'email' : 'phoneNumber'
  const primary = await payload.find({
    collection: 'users',
    where: { [field]: { equals: value } },
    select: { email: true },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  if (primary.docs[0]) return { userId: primary.docs[0].id, primary: true }
  const extra = await payload.find({
    collection: 'user-contacts',
    where: { and: [{ value: { equals: value } }, { verified: { equals: true } }] },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const row = extra.docs[0]
  if (!row) return null
  return { userId: typeof row.user === 'object' ? row.user.id : row.user, primary: false }
}

export async function listContacts(ctx: ServiceContext): Promise<ContactList> {
  const user = requireUser(ctx)
  const rows = await ctx.payload.find({
    collection: 'user-contacts',
    where: { user: { equals: user.id } },
    depth: 0,
    limit: 50,
    sort: 'createdAt',
    overrideAccess: true,
  })
  const emails: ContactView[] = isPlaceholderEmail(user.email)
    ? []
    : [{ value: user.email, primary: true, verified: Boolean(user.emailVerified) }]
  const phones: ContactView[] = user.phoneNumber
    ? [{ value: user.phoneNumber, primary: true, verified: Boolean(user.phoneNumberVerified) }]
    : []
  for (const r of rows.docs) {
    const view = { value: r.value, primary: false, verified: Boolean(r.verified) }
    if (r.kind === 'email') emails.push(view)
    else phones.push(view)
  }
  return { emails, phones }
}

/** Add an email or number (or resend its code): it joins the account once the code is entered. */
export async function startAddContact(
  ctx: ServiceContext,
  input: { kind: ContactKind; value: unknown },
) {
  // also while an account is held for its missing email: this is how it gets one
  const user = requireUser(ctx, { allowIncomplete: true })
  const rules = await userRules()
  const value = normalizeContact(input.kind, input.value)
  const delivery = await deliveryAvailability()
  if (input.kind === 'email' ? !delivery.email : !delivery.sms)
    throw errors.forbidden(
      input.kind === 'email'
        ? 'ইমেইল পাঠানোর সেবা এখনো চালু হয়নি, তাই নতুন ইমেইল যাচাই করা যাচ্ছে না।'
        : 'SMS সেবা এখনো চালু হয়নি, তাই নতুন নম্বর যাচাই করা যাচ্ছে না।',
    )

  const owner = await findContactOwner(ctx.payload, input.kind, value)
  if (owner?.userId === user.id) throw errors.conflict('এটি আগে থেকেই আপনার অ্যাকাউন্টে আছে।')
  if (owner) throw errors.conflict('এটি অন্য একটি অ্যাকাউন্টে যুক্ত আছে।')

  const limit = await consumeRateLimit(ctx.payload, `contact-code:${user.id}`, 6, 3600)
  if (!limit.allowed) throw errors.rateLimited()

  const existing = await ctx.payload.find({
    collection: 'user-contacts',
    where: { value: { equals: value } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const found = existing.docs[0]
  const foundOwner = found ? (typeof found.user === 'object' ? found.user.id : found.user) : null
  // an unconfirmed entry left by someone else does not block this member
  if (found && foundOwner !== user.id) {
    await ctx.payload.delete({ collection: 'user-contacts', id: found.id, overrideAccess: true })
  }
  const pending = found && foundOwner === user.id ? found : null
  if (!pending) {
    const count = await ctx.payload.count({
      collection: 'user-contacts',
      where: { and: [{ user: { equals: user.id } }, { kind: { equals: input.kind } }] },
      overrideAccess: true,
    })
    if (count.totalDocs >= rules.maxExtraContacts)
      throw errors.invalid(
        `সর্বোচ্চ ${bn(rules.maxExtraContacts)}টি অতিরিক্ত ${input.kind === 'email' ? 'ইমেইল' : 'নম্বর'} রাখা যায়।`,
      )
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const data = {
    codeHash: hashCode(code, value),
    codeExpiresAt: new Date(Date.now() + rules.contactCodeMinutes * 60_000).toISOString(),
    attempts: 0,
  }
  if (pending) {
    await ctx.payload.update({
      collection: 'user-contacts',
      id: pending.id,
      data,
      overrideAccess: true,
    })
  } else {
    await ctx.payload.create({
      collection: 'user-contacts',
      data: { user: user.id, kind: input.kind, value, verified: false, ...data },
      overrideAccess: true,
    })
  }

  if (input.kind === 'email') {
    const { html, text } = emailTemplates.notification(
      `যাচাইয়ের কোড: ${code}`,
      `${user.name}, এই ইমেইলটি আপনার Ruhama অ্যাকাউন্টে যুক্ত করতে কোডটি দিন। কোডটি ${bn(rules.contactCodeMinutes)} মিনিট কার্যকর। আপনি না চাইলে এই ইমেইল উপেক্ষা করুন।`,
      null,
    )
    const res = await sendEmail({
      to: value,
      subject: `${code} · Ruhama যাচাইয়ের কোড`,
      html,
      text,
    })
    if (!res.ok) throw errors.invalid('কোড পাঠানো যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।')
  } else {
    const res = await sendSms(
      value,
      `Ruhama যাচাইয়ের কোড: ${code}। ${bn(rules.contactCodeMinutes)} মিনিট কার্যকর। কাউকে জানাবেন না।`,
    )
    if (!res.ok) throw errors.invalid('SMS পাঠানো যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।')
  }
  return { sent: true, value }
}

/** Enter the code: the email or number is now confirmed on the account. */
export async function confirmContact(
  ctx: ServiceContext,
  input: { kind: ContactKind; value: unknown; code: unknown },
) {
  // also while an account is held for its missing email: this is how it gets one
  const user = requireUser(ctx, { allowIncomplete: true })
  const value = normalizeContact(input.kind, input.value)
  const code = String(input.code ?? '').trim()
  const res = await ctx.payload.find({
    collection: 'user-contacts',
    where: { and: [{ value: { equals: value } }, { user: { equals: user.id } }] },
    depth: 0,
    limit: 1,
    overrideAccess: true,
    showHiddenFields: true,
  })
  const row = res.docs[0] as
    | ((typeof res.docs)[number] & {
        codeHash?: string | null
        codeExpiresAt?: string | null
        attempts?: number | null
      })
    | undefined
  if (!row) throw errors.notFound('আগে কোড পাঠান।')
  if (row.verified) return { confirmed: true }
  if (!row.codeHash || !row.codeExpiresAt || Date.parse(row.codeExpiresAt) < Date.now())
    throw errors.invalid('কোডের মেয়াদ শেষ। নতুন কোড নিন।')
  if ((row.attempts ?? 0) >= MAX_ATTEMPTS) throw errors.invalid('অনেকবার ভুল হয়েছে। নতুন কোড নিন।')
  const expected = Buffer.from(row.codeHash, 'hex')
  const given = Buffer.from(hashCode(code, value), 'hex')
  if (!/^\d{6}$/.test(code) || !timingSafeEqual(expected, given)) {
    await ctx.payload.update({
      collection: 'user-contacts',
      id: row.id,
      data: { attempts: (row.attempts ?? 0) + 1 },
      overrideAccess: true,
    })
    throw errors.invalid('কোডটি মেলেনি।')
  }
  await ctx.payload.update({
    collection: 'user-contacts',
    id: row.id,
    data: {
      verified: true,
      verifiedAt: new Date().toISOString(),
      codeHash: null,
      codeExpiresAt: null,
    },
    overrideAccess: true,
  })
  // an account that has no real email yet (Facebook without one): this becomes its email
  if (input.kind === 'email' && isPlaceholderEmail(user.email))
    await makePrimaryContact(ctx, { kind: 'email', value })
  return { confirmed: true }
}

/** Swap a confirmed extra email or number with the primary one; the old primary stays on the list. */
export async function makePrimaryContact(
  ctx: ServiceContext,
  input: { kind: ContactKind; value: unknown },
) {
  // also while an account is held for its missing email: this is how it gets one
  const user = requireUser(ctx, { allowIncomplete: true })
  const value = normalizeContact(input.kind, input.value)
  const res = await ctx.payload.find({
    collection: 'user-contacts',
    where: {
      and: [
        { value: { equals: value } },
        { user: { equals: user.id } },
        { verified: { equals: true } },
      ],
    },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const row = res.docs[0]
  if (!row) throw errors.notFound('আগে এটি যাচাই করুন।')

  const oldValue = input.kind === 'email' ? user.email : user.phoneNumber
  const oldVerified = input.kind === 'email' ? user.emailVerified : user.phoneNumberVerified
  // free the value first: it is unique across both places
  await ctx.payload.delete({ collection: 'user-contacts', id: row.id, overrideAccess: true })
  await ctx.payload.update({
    collection: 'users',
    id: user.id,
    data:
      input.kind === 'email'
        ? { email: value, emailVerified: true }
        : { phoneNumber: value, phoneNumberVerified: true },
    overrideAccess: true,
    depth: 0,
  })
  if (oldValue && !(input.kind === 'email' && isPlaceholderEmail(oldValue))) {
    await ctx.payload.create({
      collection: 'user-contacts',
      data: {
        user: user.id,
        kind: input.kind,
        value: oldValue,
        verified: Boolean(oldVerified),
        verifiedAt: oldVerified ? new Date().toISOString() : null,
      },
      overrideAccess: true,
    })
  }
  return { primary: value }
}

/** Remove an extra email or number, or the primary mobile number (the primary email always stays). */
export async function removeContact(
  ctx: ServiceContext,
  input: { kind: ContactKind; value: unknown },
) {
  // also while an account is held for its missing email: this is how it gets one
  const user = requireUser(ctx, { allowIncomplete: true })
  const value = normalizeContact(input.kind, input.value)
  if (input.kind === 'email' && value === user.email)
    throw errors.invalid('প্রধান ইমেইল মোছা যায় না। আগে অন্য একটি ইমেইলকে প্রধান করুন।')
  if (input.kind === 'phone' && value === user.phoneNumber) {
    await ctx.payload.update({
      collection: 'users',
      id: user.id,
      data: { phoneNumber: null, phoneNumberVerified: false },
      overrideAccess: true,
      depth: 0,
    })
    return { removed: true }
  }
  await ctx.payload.delete({
    collection: 'user-contacts',
    where: { and: [{ value: { equals: value } }, { user: { equals: user.id } }] },
    overrideAccess: true,
  })
  return { removed: true }
}
