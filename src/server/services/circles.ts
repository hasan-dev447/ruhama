import { z } from 'zod'

import { MODERATOR_ROLES } from '@/lib/roles'

import type { ServiceContext } from './context'
import { requireUser } from './context'
import { errors } from './errors'
import { notify, usersWithRoles } from './notifications'
import { consumeRateLimit } from './rate-limit'

const idOf = (v: unknown) =>
  v && typeof v === 'object' && 'id' in v ? (v as { id: number }).id : (v as number)

export const joinCircleSchema = z.object({
  message: z.string().trim().max(500, 'বার্তাটি ৫০০ অক্ষরের মধ্যে লিখুন।').optional().default(''),
})

async function publishedCircle(ctx: ServiceContext, circleId: number) {
  const circle = await ctx.payload.findByID({
    collection: 'circles',
    id: circleId,
    depth: 0,
    select: { name: true, slug: true, status: true, coordinator: true },
    overrideAccess: true,
    disableErrors: true,
  })
  if (!circle || circle.status !== 'published') throw errors.notFound('সার্কেলটি পাওয়া যায়নি।')
  return circle
}

/** Ask to join a circle; the coordinator follows up. Re-requesting after a cancel is allowed. */
export async function requestToJoinCircle(
  ctx: ServiceContext,
  circleId: number,
  input: z.input<typeof joinCircleSchema>,
) {
  const user = requireUser(ctx)
  const { message } = joinCircleSchema.parse(input)
  const limit = await consumeRateLimit(ctx.payload, `circle-join:user:${user.id}`, 10, 24 * 60 * 60)
  if (!limit.allowed) throw errors.rateLimited()
  const circle = await publishedCircle(ctx, circleId)

  const existing = await ctx.payload.find({
    collection: 'circle-memberships',
    where: { and: [{ circle: { equals: circleId } }, { user: { equals: user.id } }] },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const current = existing.docs[0]
  if (current && (current.status === 'pending' || current.status === 'approved'))
    return { status: current.status }
  if (current) {
    await ctx.payload.update({
      collection: 'circle-memberships',
      id: current.id,
      data: { status: 'pending', message: message || null },
      overrideAccess: true,
      depth: 0,
    })
  } else {
    await ctx.payload.create({
      collection: 'circle-memberships',
      data: { circle: circleId, user: user.id, message: message || null, status: 'pending' },
      overrideAccess: true,
      depth: 0,
    })
  }

  const recipients = circle.coordinator
    ? [idOf(circle.coordinator)]
    : await usersWithRoles(ctx.payload, [...MODERATOR_ROLES])
  await notify(ctx.payload, {
    recipients,
    kind: 'system',
    text: `${user.name} “${circle.name}”-এ যুক্ত হতে চান।${message ? ` বার্তা: ${message.slice(0, 120)}` : ''}`,
    link: '/admin/collections/circle-memberships',
    emailSubject: 'সার্কেলে যুক্ত হওয়ার নতুন অনুরোধ · Ruhama',
    actorId: user.id,
  })
  return { status: 'pending' as const }
}

export async function cancelJoinRequest(ctx: ServiceContext, circleId: number) {
  const user = requireUser(ctx)
  const existing = await ctx.payload.find({
    collection: 'circle-memberships',
    where: { and: [{ circle: { equals: circleId } }, { user: { equals: user.id } }] },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const current = existing.docs[0]
  if (!current || current.status === 'cancelled') return { status: 'cancelled' as const }
  await ctx.payload.update({
    collection: 'circle-memberships',
    id: current.id,
    data: { status: 'cancelled' },
    overrideAccess: true,
    depth: 0,
  })
  return { status: 'cancelled' as const }
}

/** Membership status and RSVPs for the circle page. */
export async function myCircleState(ctx: ServiceContext, circleId: number) {
  if (!ctx.user) return { membership: null, rsvps: [] as number[] }
  const [membership, meetups] = await Promise.all([
    ctx.payload.find({
      collection: 'circle-memberships',
      where: { and: [{ circle: { equals: circleId } }, { user: { equals: ctx.user.id } }] },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    }),
    ctx.payload.find({
      collection: 'circle-meetups',
      where: {
        and: [
          { circle: { equals: circleId } },
          {
            startsAt: { greater_than_equal: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
          },
        ],
      },
      select: { startsAt: true },
      depth: 0,
      limit: 20,
      pagination: false,
      overrideAccess: true,
    }),
  ])
  const ids = meetups.docs.map((m) => m.id)
  const rsvps = ids.length
    ? await ctx.payload.find({
        collection: 'meetup-rsvps',
        where: { and: [{ meetup: { in: ids } }, { user: { equals: ctx.user.id } }] },
        select: { meetup: true },
        depth: 0,
        limit: 20,
        pagination: false,
        overrideAccess: true,
      })
    : { docs: [] }
  return {
    membership: membership.docs[0]?.status ?? null,
    rsvps: rsvps.docs.map((r) => idOf(r.meetup)),
  }
}

/** "আসছি" toggle for a circle meetup. */
export async function toggleMeetupRsvp(ctx: ServiceContext, meetupId: number) {
  const user = requireUser(ctx)
  const meetup = await ctx.payload.findByID({
    collection: 'circle-meetups',
    id: meetupId,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
  })
  if (!meetup) throw errors.notFound('বৈঠকটি পাওয়া যায়নি।')
  if (new Date(meetup.startsAt).getTime() < Date.now() - 3 * 3600 * 1000)
    throw errors.conflict('বৈঠকটি শেষ হয়ে গেছে।')
  await publishedCircle(ctx, idOf(meetup.circle))

  const existing = await ctx.payload.find({
    collection: 'meetup-rsvps',
    where: { and: [{ meetup: { equals: meetupId } }, { user: { equals: user.id } }] },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) {
    await ctx.payload.delete({
      collection: 'meetup-rsvps',
      id: existing.docs[0].id,
      overrideAccess: true,
    })
  } else {
    await ctx.payload.create({
      collection: 'meetup-rsvps',
      data: { meetup: meetupId, user: user.id },
      overrideAccess: true,
      depth: 0,
    })
  }
  const count = await ctx.payload.count({
    collection: 'meetup-rsvps',
    where: { meetup: { equals: meetupId } },
    overrideAccess: true,
  })
  return { attending: !existing.docs[0], attendingCount: count.totalDocs }
}
