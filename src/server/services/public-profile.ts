import type { Payload, PayloadRequest } from 'payload'
import { z } from 'zod'

import { PROFILE_KIND_OF, rolesOf, type Role } from '@/lib/roles'

import { peopleRules } from '../rules'
import type { ServiceContext } from './context'
import { requireUser } from './context'
import { errors } from './errors'
import { notify, usersWithRoles } from './notifications'
import { hasLevel, rolesAt } from '@/server/permissions'

/**
 * A member's own public profile (আলিম, লেখক ও বক্তা). It is made when an admin gives them a profile
 * role (people menu's rule) and linked to their account; they fill it in from their settings. When
 * the menu's rule asks for approval, their changes wait in `pendingChanges` until the team approves.
 */

/** What a member may write in their own profile (the rest stays with the admin team). */
type SelfField = 'name' | 'title' | 'specialty' | 'bio' | 'location' | 'education' | 'expertise'

export const publicProfileSchema = z.object({
  name: z.string().trim().min(2, 'নাম লিখুন।').max(80),
  title: z.string().trim().max(80).optional().default(''),
  specialty: z.string().trim().max(120).optional().default(''),
  bio: z.string().trim().max(1500).optional().default(''),
  location: z.string().trim().max(60).optional().default(''),
  education: z
    .array(
      z.object({
        degree: z.string().trim().min(1).max(120),
        institution: z.string().trim().max(160).optional().default(''),
      }),
    )
    .max(10)
    .optional()
    .default([]),
  expertise: z.array(z.string().trim().min(1).max(40)).max(12).optional().default([]),
})

export type PublicProfileInput = z.input<typeof publicProfileSchema>
type ProfileValues = z.output<typeof publicProfileSchema>

type PersonDoc = {
  id: number
  slug?: string | null
  kinds?: string[] | null
  active?: boolean | null
  pendingChanges?: unknown
  pendingAt?: string | null
  user?: number | { id: number } | null
} & Partial<Record<SelfField, unknown>>

const pick = (doc: PersonDoc): ProfileValues =>
  publicProfileSchema.parse({
    name: doc.name ?? '',
    title: doc.title ?? '',
    specialty: doc.specialty ?? '',
    bio: doc.bio ?? '',
    location: doc.location ?? '',
    education: ((doc.education as { degree?: string; institution?: string }[] | null) ?? []).map(
      (e) => ({ degree: e.degree ?? '', institution: e.institution ?? '' }),
    ),
    expertise: (doc.expertise as string[] | null) ?? [],
  })

export const publicPathOf = (p: { slug?: string | null; kinds?: string[] | null }) =>
  p.slug ? `${(p.kinds ?? []).includes('scholar') ? '/scholars' : '/speakers'}/${p.slug}` : null

async function linkedProfile(payload: Payload, userId: number | string, req?: PayloadRequest) {
  const res = await payload.find({
    collection: 'people',
    where: { user: { equals: userId } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
    showHiddenFields: true,
    req,
  })
  return (res.docs[0] as unknown as PersonDoc | undefined) ?? null
}

/** The signed-in member's public profile, or null when they have none. */
export async function getMyPublicProfile(ctx: ServiceContext) {
  const user = requireUser(ctx)
  const doc = await linkedProfile(ctx.payload, user.id)
  if (!doc) return null
  const rules = await peopleRules()
  const pending = doc.pendingChanges
    ? (publicProfileSchema.safeParse(doc.pendingChanges).data ?? null)
    : null
  return {
    values: pick(doc),
    pending,
    pendingAt: doc.pendingAt ?? null,
    requireApproval: rules.requireApproval,
    active: doc.active !== false,
    publicPath: publicPathOf(doc),
  }
}

/** Save the member's own profile: live at once, or waiting for approval by the menu's rule. */
export async function saveMyPublicProfile(ctx: ServiceContext, input: PublicProfileInput) {
  const user = requireUser(ctx)
  const values = publicProfileSchema.parse(input)
  const doc = await linkedProfile(ctx.payload, user.id)
  if (!doc) throw errors.forbidden('আপনার কোনো পাবলিক প্রোফাইল নেই।')
  const rules = await peopleRules()

  if (!rules.requireApproval) {
    await ctx.payload.update({
      collection: 'people',
      id: doc.id,
      data: { ...values, pendingChanges: null, pendingAt: null } as never,
      overrideAccess: true,
      depth: 0,
    })
    return { pending: false }
  }

  const firstTime = !doc.pendingAt
  await ctx.payload.update({
    collection: 'people',
    id: doc.id,
    data: { pendingChanges: values, pendingAt: new Date().toISOString() } as never,
    overrideAccess: true,
    depth: 0,
  })
  if (firstTime) {
    const approvers = await usersWithRoles(ctx.payload, await rolesAt('people', 'edit'))
    await notify(ctx.payload, {
      recipients: approvers,
      kind: 'system',
      text: `${values.name} তাঁর পাবলিক প্রোফাইল বদলেছেন; অনুমোদনের অপেক্ষায়।`,
      link: `/admin/collections/people/${doc.id}`,
      actorId: user.id,
    })
  }
  return { pending: true }
}

/** The member withdraws their waiting changes. */
export async function cancelMyPendingProfile(ctx: ServiceContext) {
  const user = requireUser(ctx)
  const doc = await linkedProfile(ctx.payload, user.id)
  if (!doc?.pendingAt) return { pending: false }
  await ctx.payload.update({
    collection: 'people',
    id: doc.id,
    data: { pendingChanges: null, pendingAt: null } as never,
    overrideAccess: true,
    depth: 0,
  })
  return { pending: false }
}

/** Super admin, শূরা or সম্পাদক approves or rejects a member's waiting profile changes. */
export async function decidePendingProfile(
  ctx: ServiceContext,
  input: { id: number; decision: 'approve' | 'reject'; note?: string },
) {
  const user = requireUser(ctx)
  if (!(await hasLevel(user, 'people', 'edit')))
    throw errors.forbidden('অনুমোদন দিতে “আলিম, লেখক ও বক্তা” মেনুতে এডিটের অনুমতি লাগে।')
  const doc = (await ctx.payload
    .findByID({
      collection: 'people',
      id: input.id,
      depth: 0,
      overrideAccess: true,
      showHiddenFields: true,
    })
    .catch(() => null)) as unknown as PersonDoc | null
  if (!doc) throw errors.notFound()
  const pending = doc.pendingChanges ? publicProfileSchema.safeParse(doc.pendingChanges) : null
  if (!pending?.success) throw errors.conflict('অনুমোদনের অপেক্ষায় কোনো পরিবর্তন নেই।')

  await ctx.payload.update({
    collection: 'people',
    id: doc.id,
    data: {
      ...(input.decision === 'approve' ? pending.data : {}),
      pendingChanges: null,
      pendingAt: null,
    } as never,
    overrideAccess: true,
    depth: 0,
  })
  const note = input.note?.trim().slice(0, 500) || null
  await ctx.payload.create({
    collection: 'audit-logs',
    data: {
      action: 'profile_review',
      actor: user.id,
      targetCollection: 'people',
      targetId: String(doc.id),
      summary: `${input.decision === 'approve' ? 'প্রোফাইলের পরিবর্তন অনুমোদিত' : 'প্রোফাইলের পরিবর্তন বাতিল'}: ${pending.data.name}${note ? ` (${note})` : ''}`,
    },
    overrideAccess: true,
  })
  const owner = doc.user && typeof doc.user === 'object' ? doc.user.id : doc.user
  if (owner)
    await notify(ctx.payload, {
      recipients: [owner],
      kind: 'system',
      text:
        input.decision === 'approve'
          ? 'আপনার পাবলিক প্রোফাইলের পরিবর্তন অনুমোদিত হয়েছে, এখন সাইটে দেখা যাচ্ছে।'
          : `আপনার পাবলিক প্রোফাইলের পরিবর্তন গ্রহণ করা হয়নি।${note ? ` কারণ: ${note}` : ''}`,
      link: '/settings#public-profile',
      actorId: user.id,
    })
  return { ok: true }
}

const slugify = (raw: string) =>
  raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

/**
 * After a member's roles change: a profile role (people menu's rule) gives them a public profile,
 * made and linked here the first time, with the matching "ভূমিকা"; losing every such role hides it
 * (it is never deleted, an admin may still want it).
 */
export async function syncProfileForRoles(
  payload: Payload,
  user: { id: number; name?: string | null; username?: string | null; role?: unknown },
  previousRoles: Role[],
  req?: PayloadRequest,
) {
  const rules = await peopleRules()
  const now = rolesOf(user).filter((r) => rules.profileRoles.includes(r))
  const before = previousRoles.filter((r) => rules.profileRoles.includes(r))
  if (now.join() === before.join()) return
  const kinds = [...new Set(now.map((r) => PROFILE_KIND_OF[r]).filter(Boolean))] as string[]
  const doc = await linkedProfile(payload, user.id, req)

  if (!now.length) {
    if (doc && doc.active !== false)
      await payload.update({
        collection: 'people',
        id: doc.id,
        data: { active: false },
        overrideAccess: true,
        depth: 0,
        req,
      })
    return
  }
  if (doc) {
    await payload.update({
      collection: 'people',
      id: doc.id,
      data: {
        active: true,
        kinds: [...new Set([...(doc.kinds ?? []), ...kinds])] as never,
      },
      overrideAccess: true,
      depth: 0,
      req,
    })
    return
  }
  const base = slugify(user.username ?? '') || 'member'
  const taken = await payload.count({
    collection: 'people',
    where: { slug: { equals: base } },
    overrideAccess: true,
    req,
  })
  await payload.create({
    collection: 'people',
    data: {
      name: user.name || user.username || 'নাম যোগ করা হয়নি',
      slug: taken.totalDocs ? `${base}-${user.id}` : base,
      kinds: (kinds.length ? kinds : ['scholar']) as never,
      user: user.id,
      active: true,
      verified: false,
    } as never,
    overrideAccess: true,
    depth: 0,
    req,
  })
}
