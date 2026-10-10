import type { Where } from 'payload'
import { z } from 'zod'

import { canHavePhoto, isGender } from '@/lib/gender'
import { normalizeBdPhone } from '@/lib/phone'
import { emailGrace, missingProfile } from '@/lib/profile-complete'
import { MAX_ALLOWED_VIEWERS, VISIBILITY } from '@/lib/profile-privacy'
import { SURAHS } from '@/lib/quran-meta'

import type { ServiceContext } from './context'
import { requireUser } from './context'
import { errors } from './errors'
import { deliveryAvailability } from '../integrations'
import { findContactOwner, normalizeContact, startAddContact } from './contacts'
import { consumeRateLimit } from './rate-limit'
import { userRules } from '../rules'
import { bn } from '@/lib/format'

/* ---------- ভাই / বোন ---------- */

/** The one-time choice every member makes before anything else. */
/**
 * /onboarding: ভাই / বোন (once, never changed) and, for an account without a real email, an
 * optional email. The email is not put on the account here: it gets a code (services/contacts) and
 * joins only when confirmed, so nobody can hold an address that is not theirs. When no email service
 * is set up yet a code cannot be sent, so the address is saved unconfirmed as before.
 */
export async function completeProfile(
  ctx: ServiceContext,
  input: { gender?: unknown; email?: unknown },
): Promise<{ emailPending: string | null; emailChanged: string | null }> {
  const user = requireUser(ctx, { allowIncomplete: true })
  const missing = missingProfile(user)
  const grace = emailGrace(user)
  if (!missing.gender && !grace.needed) throw errors.conflict('প্রোফাইল আগেই সম্পূর্ণ হয়েছে।')

  if (missing.gender) {
    if (!isGender(input.gender)) throw errors.invalid('ভাই অথবা বোন বেছে নিন।')
    await ctx.payload.update({
      collection: 'users',
      id: user.id,
      data: { gender: input.gender },
      overrideAccess: true,
      depth: 0,
    })
  }

  const rawEmail = typeof input.email === 'string' ? input.email.trim() : ''
  if (!grace.needed || !rawEmail) {
    // the email is optional while there is time left; once it is up it is the only thing asked
    if (grace.expired) throw errors.invalid('একটি ইমেইল ঠিকানা দিন।')
    return { emailPending: null, emailChanged: null }
  }

  if ((await deliveryAvailability()).email) {
    const { value } = await startAddContact(ctx, { kind: 'email', value: rawEmail })
    return { emailPending: value, emailChanged: null }
  }
  // no email service yet: no code can be sent, keep the old unconfirmed save
  const email = normalizeContact('email', rawEmail)
  const owner = await findContactOwner(ctx.payload, 'email', email)
  if (owner && owner.userId !== user.id)
    throw errors.conflict(
      'এই ইমেইলে আগেই একটি অ্যাকাউন্ট আছে। সেই অ্যাকাউন্টে লগইন করুন, তারপর সেটিংস থেকে Facebook যুক্ত করুন।',
    )
  await ctx.payload.update({
    collection: 'users',
    id: user.id,
    data: { email, emailVerified: false },
    overrideAccess: true,
    depth: 0,
  })
  return { emailPending: null, emailChanged: email }
}

/* ---------- profile photo (brothers only) ---------- */

const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export type PhotoFile = { data: Buffer; mimetype: string; name: string; size: number }

/** Upload or replace the member's photo; the old file is removed from storage. */
export async function setProfilePhoto(ctx: ServiceContext, file: PhotoFile) {
  const user = requireUser(ctx)
  if (!canHavePhoto(user.gender))
    throw errors.forbidden('বোনদের জন্য প্রোফাইল ছবি রাখার সুযোগ নেই।')
  if (!PHOTO_TYPES.has(file.mimetype)) throw errors.invalid('JPG, PNG বা WebP ছবি দিন।')
  const { profilePhotoMaxMB } = await userRules()
  if (file.size > profilePhotoMaxMB * 1024 * 1024)
    throw errors.invalid(`ছবিটি ${bn(profilePhotoMaxMB)} MB-এর মধ্যে হতে হবে।`)

  const limit = await consumeRateLimit(ctx.payload, `avatar:${user.id}`, 10, 3600)
  if (!limit.allowed) throw errors.rateLimited()

  const previous = await ctx.payload.find({
    collection: 'avatars',
    where: { user: { equals: user.id } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  // one photo per member: drop the old one first (its files go from R2 with it)
  if (previous.docs[0]) {
    await ctx.payload.delete({
      collection: 'avatars',
      id: previous.docs[0].id,
      overrideAccess: true,
      context: { keepUserPhoto: true },
    })
  }
  const avatar = await ctx.payload.create({
    collection: 'avatars',
    data: { user: user.id },
    file: {
      data: file.data,
      mimetype: file.mimetype,
      // a new name each time, so browsers and the CDN never show the old picture
      name: `${user.username ?? user.id}-${Date.now().toString(36)}.webp`,
      size: file.size,
    },
    overrideAccess: true,
  })
  const image = avatar.sizes?.md?.url ?? avatar.url ?? null
  await ctx.payload.update({
    collection: 'users',
    id: user.id,
    data: { avatar: avatar.id, image },
    overrideAccess: true,
    depth: 0,
    context: { avatarUpdate: true },
  })
  return { image, large: avatar.sizes?.lg?.url ?? avatar.url ?? null }
}

export async function removeProfilePhoto(ctx: ServiceContext) {
  const user = requireUser(ctx)
  const existing = await ctx.payload.find({
    collection: 'avatars',
    where: { user: { equals: user.id } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  // deleting the avatar also clears it from the member (Avatars afterDelete hook)
  if (existing.docs[0]) {
    await ctx.payload.delete({
      collection: 'avatars',
      id: existing.docs[0].id,
      overrideAccess: true,
    })
  } else {
    await ctx.payload.update({
      collection: 'users',
      id: user.id,
      data: { avatar: null, image: null },
      overrideAccess: true,
      depth: 0,
      context: { avatarUpdate: true },
    })
  }
  return { removed: true }
}

/* ---------- cover ---------- */

const HADITH_BOOK = /^[a-z]+$/

export const coverSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  z.object({
    kind: z.literal('ayah'),
    surah: z.coerce.number().int().min(1).max(114),
    ayah: z.coerce.number().int().min(1),
  }),
  z.object({
    kind: z.literal('hadith'),
    book: z.string().regex(HADITH_BOOK),
    number: z.coerce.number().int().min(1),
  }),
  z.object({
    kind: z.literal('text'),
    text: z.string().trim().min(2, 'কিছু লিখুন।').max(200, 'লেখাটি ২০০ অক্ষরের মধ্যে রাখুন।'),
    source: z.string().trim().max(80).optional().default(''),
  }),
])
export type CoverInput = z.input<typeof coverSchema>

export async function updateCover(ctx: ServiceContext, input: CoverInput) {
  const user = requireUser(ctx)
  const cover = coverSchema.parse(input)
  let data: Record<string, unknown> = {
    kind: 'none',
    ayahKey: null,
    hadithKey: null,
    text: null,
    source: null,
  }
  if (cover.kind === 'ayah') {
    const meta = SURAHS.find((s) => s.number === cover.surah)
    if (!meta || cover.ayah > meta.ayahs) throw errors.invalid('এই সূরায় এত নম্বরের আয়াত নেই।')
    data = { ...data, kind: 'ayah', ayahKey: `${cover.surah}:${cover.ayah}` }
  } else if (cover.kind === 'hadith') {
    const key = `${cover.book}:${cover.number}`
    const found = await ctx.payload.count({
      collection: 'hadiths',
      where: { key: { equals: key } },
    })
    if (!found.totalDocs) throw errors.invalid('এই নম্বরের হাদিস পাওয়া যায়নি।')
    data = { ...data, kind: 'hadith', hadithKey: key }
  } else if (cover.kind === 'text') {
    data = { ...data, kind: 'text', text: cover.text, source: cover.source || null }
  }
  await ctx.payload.update({
    collection: 'users',
    id: user.id,
    data: { cover: data },
    overrideAccess: true,
    depth: 0,
  })
  return { saved: true }
}

/* ---------- privacy ---------- */

export const privacySchema = z.object({
  visibility: z.enum(VISIBILITY.map((v) => v.value) as [string, ...string[]]),
  allowedViewers: z.array(z.number().int().positive()).max(MAX_ALLOWED_VIEWERS).default([]),
  showPhoto: z.boolean(),
  showCover: z.boolean(),
  showBio: z.boolean(),
  showDistrict: z.boolean(),
  showJourney: z.boolean(),
  showActivity: z.boolean(),
  discoverable: z.boolean(),
})
export type PrivacyInput = z.input<typeof privacySchema>

export async function updatePrivacy(ctx: ServiceContext, input: PrivacyInput) {
  const user = requireUser(ctx)
  const p = privacySchema.parse(input)
  // only real, active members can be on the list, never the owner
  const ids = [...new Set(p.allowedViewers)].filter((id) => id !== user.id)
  const valid = ids.length
    ? await ctx.payload.find({
        collection: 'users',
        where: {
          and: [
            { id: { in: ids } },
            { banned: { not_equals: true } },
            { deletionRequestedAt: { exists: false } },
          ],
        },
        select: { name: true },
        depth: 0,
        limit: MAX_ALLOWED_VIEWERS,
        overrideAccess: true,
      })
    : { docs: [] }
  await ctx.payload.update({
    collection: 'users',
    id: user.id,
    data: {
      privacy: {
        visibility: p.visibility as never,
        allowedViewers: valid.docs.map((d) => d.id),
        profilePublic: p.visibility === 'public' || p.visibility === 'members',
        showPhoto: p.showPhoto,
        showCover: p.showCover,
        showBio: p.showBio,
        showDistrict: p.showDistrict,
        showJourney: p.showJourney,
        showActivity: p.showActivity,
        discoverable: p.discoverable,
      },
    },
    overrideAccess: true,
    depth: 0,
  })
  return { saved: true }
}

/* ---------- finding members for the "who can see" list ---------- */

export type MemberHit = { id: number; name: string; username: string | null; image: string | null }

/**
 * Name search matches part of a name; email and phone must match exactly, so the search cannot be
 * used to read out addresses or numbers. Results carry only name, username and photo.
 */
export async function searchMembers(ctx: ServiceContext, q: string): Promise<MemberHit[]> {
  const user = requireUser(ctx)
  const query = q.trim()
  if (query.length < 2) return []
  const limit = await consumeRateLimit(ctx.payload, `member-search:${user.id}`, 60, 600)
  if (!limit.allowed) throw errors.rateLimited()

  const phone = normalizeBdPhone(query)
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query)
  // an exact email or number also finds the account it is an extra one on
  const owner =
    isEmail || phone
      ? await findContactOwner(
          ctx.payload,
          isEmail ? 'email' : 'phone',
          isEmail ? query.toLowerCase() : phone!,
        )
      : null
  const match: Where =
    isEmail || phone ? { id: { equals: owner?.userId ?? 0 } } : { name: { like: query } }
  const res = await ctx.payload.find({
    collection: 'users',
    where: {
      and: [
        match,
        { id: { not_equals: user.id } },
        { banned: { not_equals: true } },
        { deletionRequestedAt: { exists: false } },
      ],
    },
    select: { name: true, username: true, image: true, privacy: true },
    depth: 0,
    limit: 8,
    overrideAccess: true,
  })
  return res.docs.map((d) => ({
    id: d.id,
    name: d.name,
    username: d.username ?? null,
    image: d.privacy?.showPhoto === false ? null : (d.image ?? null),
  }))
}

/** Names for the ids already on the list (to show them in settings). */
export async function membersByIds(ctx: ServiceContext, ids: number[]): Promise<MemberHit[]> {
  requireUser(ctx)
  if (!ids.length) return []
  const res = await ctx.payload.find({
    collection: 'users',
    where: { id: { in: ids.slice(0, MAX_ALLOWED_VIEWERS) } },
    select: { name: true, username: true, image: true },
    depth: 0,
    limit: MAX_ALLOWED_VIEWERS,
    overrideAccess: true,
  })
  return res.docs.map((d) => ({
    id: d.id,
    name: d.name,
    username: d.username ?? null,
    image: d.image ?? null,
  }))
}
