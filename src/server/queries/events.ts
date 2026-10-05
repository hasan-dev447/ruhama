import type { Payload, Where } from 'payload'
import type { User } from '@/payload-types'

import { CATEGORY_POPULATE, PERSON_POPULATE } from './articles'
import { toCircleCard, toEventCard } from './mappers'
import type { CircleCardView, EventCardView } from './types'

const EVENT_SELECT = {
  title: true,
  slug: true,
  summary: true,
  startsAt: true,
  endsAt: true,
  timeLabel: true,
  mode: true,
  district: true,
  venueName: true,
  capacity: true,
  seatsTaken: true,
  category: true,
} as const

/** Events still to come (an event stays listed until it ends). */
function upcomingWhere(now = new Date()): Where {
  const cutoff = new Date(now.getTime() - 3 * 3600 * 1000).toISOString()
  return { and: [{ status: { equals: 'published' } }, { startsAt: { greater_than: cutoff } }] }
}

export async function listUpcomingEvents(payload: Payload, limit = 3): Promise<EventCardView[]> {
  const res = await payload.find({
    collection: 'events',
    where: upcomingWhere(),
    select: EVENT_SELECT,
    populate: { categories: CATEGORY_POPULATE },
    depth: 1,
    sort: 'startsAt',
    limit,
  })
  return res.docs.map((d) => toEventCard(d as never))
}

export async function listEvents(
  payload: Payload,
  params: {
    mode?: string | null
    district?: string | null
    page?: number
    limit?: number
    speakerId?: number | string
  } = {},
) {
  const and: Where[] = [upcomingWhere()]
  if (params.mode === 'online' || params.mode === 'in_person')
    and.push({ mode: { equals: params.mode } })
  if (params.district && params.district !== 'all')
    and.push({ district: { equals: params.district } })
  if (params.speakerId) and.push({ speakers: { contains: params.speakerId } })
  const res = await payload.find({
    collection: 'events',
    where: { and },
    select: EVENT_SELECT,
    populate: { categories: CATEGORY_POPULATE },
    depth: 1,
    sort: 'startsAt',
    page: params.page ?? 1,
    limit: params.limit ?? 12,
  })
  return {
    docs: res.docs.map((d) => toEventCard(d as never)),
    totalDocs: res.totalDocs,
    totalPages: res.totalPages,
    page: res.page ?? 1,
    hasNextPage: res.hasNextPage,
  }
}

/** Districts that currently have upcoming in-person events (for the filter). */
export async function eventDistricts(payload: Payload): Promise<string[]> {
  const res = await payload.find({
    collection: 'events',
    where: { and: [upcomingWhere(), { mode: { equals: 'in_person' } }] },
    select: { district: true },
    depth: 0,
    limit: 200,
    pagination: false,
  })
  return [...new Set(res.docs.map((d) => d.district).filter(Boolean) as string[])]
}

export async function getEvent(
  payload: Payload,
  slug: string,
  opts: { draft?: boolean; user?: User | null } = {},
) {
  const res = await payload.find({
    collection: 'events',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
    overrideAccess: false,
    user: opts.user ?? undefined,
    populate: {
      categories: CATEGORY_POPULATE,
      people: PERSON_POPULATE,
      circles: { name: true, slug: true },
    },
  })
  const doc = res.docs[0]
  if (!doc || (!opts.draft && doc.status !== 'published')) return null
  return doc
}

/* ---------------- circles ---------------- */

const CIRCLE_SELECT = {
  name: true,
  slug: true,
  district: true,
  type: true,
  focus: true,
  frequency: true,
  scheduleLabel: true,
  memberCount: true,
  memberUnit: true,
} as const

export async function listCircles(
  payload: Payload,
  params: { district?: string | null; type?: string | null; page?: number; limit?: number } = {},
) {
  const and: Where[] = [{ status: { equals: 'published' } }]
  if (params.district && params.district !== 'all')
    and.push({ district: { equals: params.district } })
  if (params.type && params.type !== 'all') and.push({ type: { equals: params.type } })
  const res = await payload.find({
    collection: 'circles',
    where: { and },
    select: CIRCLE_SELECT,
    depth: 0,
    sort: 'name',
    page: params.page ?? 1,
    limit: params.limit ?? 24,
  })
  const ids = res.docs.map((d) => d.id)
  const next = new Map<number, CircleCardView['nextMeetup']>()
  if (ids.length) {
    const meetups = await payload.find({
      collection: 'circle-meetups',
      where: {
        and: [
          { circle: { in: ids } },
          { startsAt: { greater_than_equal: new Date().toISOString() } },
        ],
      },
      select: { circle: true, startsAt: true, topic: true },
      depth: 0,
      sort: 'startsAt',
      limit: 200,
      pagination: false,
    })
    for (const m of meetups.docs) {
      const cid = m.circle as number
      if (!next.has(cid)) next.set(cid, { startsAt: m.startsAt, topic: m.topic })
    }
  }
  return {
    docs: res.docs.map((d) => toCircleCard(d as never, next.get(d.id) ?? null)),
    totalDocs: res.totalDocs,
    totalPages: res.totalPages,
    page: res.page ?? 1,
  }
}

export async function getCircle(payload: Payload, slug: string) {
  const res = await payload.find({
    collection: 'circles',
    where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
    depth: 0,
    limit: 1,
  })
  const doc = res.docs[0]
  if (!doc) return null
  const meetups = await payload.find({
    collection: 'circle-meetups',
    where: {
      and: [
        { circle: { equals: doc.id } },
        { startsAt: { greater_than_equal: new Date(Date.now() - 3 * 3600 * 1000).toISOString() } },
      ],
    },
    select: { startsAt: true, topic: true, meta: true, attendingCount: true },
    depth: 0,
    sort: 'startsAt',
    limit: 8,
  })
  return { circle: doc, meetups: meetups.docs }
}
