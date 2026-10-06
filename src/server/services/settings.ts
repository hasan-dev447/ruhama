import { randomBytes } from 'node:crypto'

import type { Payload } from 'payload'
import { z } from 'zod'

import { DISTRICT_VALUES } from '@/lib/districts'
import { JOURNEY_STAGES } from '@/lib/journey'
import { INTEREST_OPTIONS } from '@/lib/options'
import { isPlaceholderEmail } from '@/lib/phone'

import { emailTemplates } from '../email/templates'
import { sendEmail } from '../email'
import type { ServiceContext } from './context'
import { requireUser } from './context'

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'পূর্ণ নাম লিখুন।').max(80),
  district: z.union([z.literal(''), z.enum(DISTRICT_VALUES)]).optional(),
  bio: z.string().trim().max(160, 'পরিচিতি ১৬০ অক্ষরের মধ্যে লিখুন।').optional().default(''),
  avatarColor: z.enum(['teal', 'gold', 'sage', 'deep']).optional(),
  interests: z
    .array(z.enum(INTEREST_OPTIONS.map((o) => o.value) as [string, ...string[]]))
    .max(5)
    .optional(),
  journeyStage: z.enum(JOURNEY_STAGES.map((s) => s.value) as [string, ...string[]]).optional(),
})
export type ProfileInput = z.input<typeof profileSchema>

const pref = z.object({ email: z.boolean(), site: z.boolean() })
export const notificationPrefsSchema = z.object({
  answer: pref,
  event: pref,
  forum: pref,
  weekly: pref,
  course: pref,
})

/** Members edit their own profile here; the users collection itself is admin-only for writes. */
export async function updateProfile(ctx: ServiceContext, input: ProfileInput) {
  const user = requireUser(ctx)
  const data = profileSchema.parse(input)
  await ctx.payload.update({
    collection: 'users',
    id: user.id,
    data: {
      name: data.name,
      district: (data.district || null) as never,
      bio: data.bio || null,
      ...(data.avatarColor ? { avatarColor: data.avatarColor } : {}),
      ...(data.interests ? { interests: data.interests as never } : {}),
      ...(data.journeyStage ? { journeyStage: data.journeyStage as never } : {}),
    },
    overrideAccess: true,
    depth: 0,
  })
  return { saved: true }
}

/** Saves notification choices; the weekly-letter email switch also (un)subscribes the newsletter. */
export async function updateNotificationPrefs(
  ctx: ServiceContext,
  input: z.input<typeof notificationPrefsSchema>,
) {
  const user = requireUser(ctx)
  const prefs = notificationPrefsSchema.parse(input)
  await ctx.payload.update({
    collection: 'users',
    id: user.id,
    data: { notificationPrefs: prefs },
    overrideAccess: true,
    depth: 0,
  })

  if (user.email && !isPlaceholderEmail(user.email)) {
    const existing = await ctx.payload.find({
      collection: 'newsletter-subscribers',
      where: { email: { equals: user.email.toLowerCase() } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const doc = existing.docs[0]
    const status = prefs.weekly.email ? 'subscribed' : 'unsubscribed'
    if (doc && doc.status !== status) {
      await ctx.payload.update({
        collection: 'newsletter-subscribers',
        id: doc.id,
        data: { status },
        overrideAccess: true,
      })
    } else if (!doc && prefs.weekly.email) {
      await ctx.payload.create({
        collection: 'newsletter-subscribers',
        data: {
          email: user.email.toLowerCase(),
          status: 'subscribed',
          source: 'settings',
          user: user.id,
          unsubscribeToken: randomBytes(18).toString('base64url'),
        },
        overrideAccess: true,
      })
    }
  }
  return { saved: true }
}

/**
 * Start account deletion. Sessions end now; logging in again within 30 days cancels it
 * (see the session hook in the auth options). The daily job purges after the grace period.
 */
export async function requestAccountDeletion(ctx: ServiceContext) {
  const user = requireUser(ctx)
  await ctx.payload.update({
    collection: 'users',
    id: user.id,
    data: { deletionRequestedAt: new Date().toISOString() },
    overrideAccess: true,
    depth: 0,
  })
  await ctx.payload.delete({
    collection: 'sessions',
    where: { user: { equals: user.id } },
    overrideAccess: true,
  })
  if (user.email && !isPlaceholderEmail(user.email)) {
    const { html, text } = emailTemplates.accountDeletion(user.name)
    await sendEmail({
      to: user.email,
      subject: 'অ্যাকাউন্ট মুছে ফেলার অনুরোধ · Ruhama',
      html,
      text,
    })
  }
  return { requested: true }
}

const MEMBER_DATA = [
  'enrollments',
  'lesson-progress',
  'bookmarks',
  'notifications',
  'meetup-rsvps',
  'circle-memberships',
  'forum-reactions',
] as const

/**
 * Daily job: permanently remove accounts whose 30-day grace period has passed.
 * Personal records are deleted; forum posts stay but are shown as "অজ্ঞাত সদস্য".
 */
export async function purgeDeletedAccounts(payload: Payload, now = new Date()) {
  const cutoff = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString()
  const due = await payload.find({
    collection: 'users',
    where: { deletionRequestedAt: { less_than: cutoff } },
    select: { email: true },
    depth: 0,
    limit: 100,
    pagination: false,
    overrideAccess: true,
  })
  for (const u of due.docs) {
    for (const collection of MEMBER_DATA) {
      await payload.delete({
        collection,
        where: { user: { equals: u.id } },
        overrideAccess: true,
        context: { skipCounters: false },
      })
    }
    await payload.update({
      collection: 'forum-threads',
      where: { author: { equals: u.id } },
      data: { author: null, anonymous: true },
      overrideAccess: true,
      context: { skipWorkflow: true },
    })
    await payload.update({
      collection: 'forum-posts',
      where: { author: { equals: u.id } },
      data: { author: null },
      overrideAccess: true,
    })
    await payload.update({
      collection: 'event-registrations',
      where: { user: { equals: u.id } },
      data: { user: null },
      overrideAccess: true,
    })
    await payload.update({
      collection: 'questions',
      where: { askedBy: { equals: u.id } },
      data: { askedBy: null },
      overrideAccess: true,
      context: { skipWorkflow: true, skipCounters: true },
    })
    for (const collection of ['sessions', 'accounts'] as const) {
      await payload.delete({ collection, where: { user: { equals: u.id } }, overrideAccess: true })
    }
    await payload.delete({ collection: 'users', id: u.id, overrideAccess: true })
  }
  return { purged: due.docs.length }
}
