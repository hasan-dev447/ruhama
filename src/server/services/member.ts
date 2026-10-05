import type { ServiceContext } from './context'
import { requireUser } from './context'

const idOf = (v: unknown) =>
  v && typeof v === 'object' && 'id' in v ? (v as { id: number }).id : (v as number)

export type MyRegistration = {
  id: number
  code: string
  guests: number
  event: {
    id: number
    slug: string
    title: string
    startsAt: string
    timeLabel: string | null
    mode: 'online' | 'in_person'
    venueName: string | null
    district: string | null
  }
}

/** The member's confirmed majlis registrations; upcoming first, then recent past. */
export async function myRegistrations(
  ctx: ServiceContext,
  opts: { upcomingOnly?: boolean; limit?: number } = {},
) {
  const user = requireUser(ctx)
  const res = await ctx.payload.find({
    collection: 'event-registrations',
    where: { and: [{ user: { equals: user.id } }, { status: { equals: 'confirmed' } }] },
    depth: 1,
    populate: {
      events: {
        slug: true,
        title: true,
        startsAt: true,
        timeLabel: true,
        mode: true,
        venueName: true,
        district: true,
      },
    },
    sort: '-createdAt',
    limit: 100,
    pagination: false,
    overrideAccess: true,
  })
  const cutoff = Date.now() - 3 * 3600 * 1000
  const all: MyRegistration[] = res.docs
    .filter((r) => r.event && typeof r.event === 'object')
    .map((r) => {
      const e = r.event as unknown as MyRegistration['event']
      return { id: r.id, code: r.code, guests: r.guests ?? 0, event: { ...e, id: idOf(r.event) } }
    })
  const upcoming = all
    .filter((r) => new Date(r.event.startsAt).getTime() >= cutoff)
    .sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt))
  const past = all
    .filter((r) => new Date(r.event.startsAt).getTime() < cutoff)
    .sort((a, b) => b.event.startsAt.localeCompare(a.event.startsAt))
  const list = opts.upcomingOnly ? upcoming : [...upcoming, ...past]
  return { upcoming: upcoming.length, docs: list.slice(0, opts.limit ?? 50) }
}

export type MyQuestion = {
  id: number
  slug: string | null
  title: string
  status: 'answered' | 'in_review' | 'pending' | 'rejected'
  submittedAt: string
  note: string | null
}

/** Questions the member asked, with a plain status for the dashboard. */
export async function myQuestions(ctx: ServiceContext, limit = 50): Promise<MyQuestion[]> {
  const user = requireUser(ctx)
  const res = await ctx.payload.find({
    collection: 'questions',
    where: { askedBy: { equals: user.id } },
    select: {
      title: true,
      slug: true,
      _status: true,
      moderation: true,
      moderationNote: true,
      createdAt: true,
    },
    draft: true,
    depth: 0,
    sort: '-createdAt',
    limit,
    overrideAccess: true,
  })
  return res.docs.map((q) => ({
    id: q.id,
    slug: q.slug ?? null,
    title: q.title,
    status:
      q._status === 'published'
        ? 'answered'
        : q.moderation === 'rejected' || q.moderation === 'duplicate'
          ? 'rejected'
          : q.moderation === 'accepted'
            ? 'in_review'
            : 'pending',
    submittedAt: q.createdAt,
    note:
      q.moderation === 'rejected' || q.moderation === 'duplicate'
        ? (q.moderationNote ?? null)
        : null,
  }))
}
