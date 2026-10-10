import type { Payload, Where } from 'payload'
import { EVENT_GRACE_MS, eventEnded } from '@/lib/events'
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

const nowIso = (now: number) => new Date(now).toISOString()

/** Published মজলিস still to come or under way (lib/events.ts: until the end time, else 3 hours). */
export function upcomingWhere(now = Date.now()): Where {
  return {
    and: [
      { status: { equals: 'published' } },
      {
        or: [
          { endsAt: { greater_than_equal: nowIso(now) } },
          {
            and: [
              { endsAt: { exists: false } },
              { startsAt: { greater_than_equal: nowIso(now - EVENT_GRACE_MS) } },
            ],
          },
        ],
      },
    ],
  }
}

/** Published মজলিস that are over. */
export function endedWhere(now = Date.now()): Where {
  return {
    and: [
      { status: { equals: 'published' } },
      {
        or: [
          { endsAt: { less_than: nowIso(now) } },
          {
            and: [
              { endsAt: { exists: false } },
              { startsAt: { less_than: nowIso(now - EVENT_GRACE_MS) } },
            ],
          },
        ],
      },
    ],
  }
}

/** Which of these মজলিস have a published recap. */
async function withRecaps(payload: Payload, ids: (number | string)[]): Promise<Set<number>> {
  if (!ids.length) return new Set()
  const res = await payload.find({
    collection: 'event-recaps',
    where: { and: [{ event: { in: ids } }, { _status: { equals: 'published' } }] },
    select: { event: true },
    depth: 0,
    limit: ids.length,
    pagination: false,
  })
  return new Set(res.docs.map((r) => r.event as number))
}

async function toCards(payload: Payload, docs: unknown[]): Promise<EventCardView[]> {
  const list = docs as { id: number; [k: string]: unknown }[]
  const ended = list.filter((d) =>
    eventEnded({ startsAt: d.startsAt as string, endsAt: d.endsAt as string | null }),
  )
  const recaps = await withRecaps(
    payload,
    ended.map((d) => d.id),
  )
  return list.map((d) => toEventCard(d as never, recaps.has(d.id)))
}

/**
 * The home page's মজলিস: the next ones to come; when fewer than `limit` are coming, the most
 * recent ones that are over fill the rest (they show as over, with what happened).
 */
export async function listUpcomingEvents(
  payload: Payload,
  limit = 3,
): Promise<{ docs: EventCardView[]; upcoming: number }> {
  const upcoming = await payload.find({
    collection: 'events',
    where: upcomingWhere(),
    select: EVENT_SELECT,
    populate: { categories: CATEGORY_POPULATE },
    depth: 1,
    sort: 'startsAt',
    limit,
  })
  let past: unknown[] = []
  if (upcoming.docs.length < limit) {
    const res = await payload.find({
      collection: 'events',
      where: endedWhere(),
      select: EVENT_SELECT,
      populate: { categories: CATEGORY_POPULATE },
      depth: 1,
      sort: '-startsAt',
      limit: limit - upcoming.docs.length,
    })
    past = res.docs
  }
  return {
    docs: await toCards(payload, [...upcoming.docs, ...past]),
    upcoming: upcoming.docs.length,
  }
}

export async function listEvents(
  payload: Payload,
  params: {
    mode?: string | null
    district?: string | null
    page?: number
    limit?: number
    speakerId?: number | string
    /** the "upcoming" tab (default) or the "over" tab, newest first */
    when?: 'upcoming' | 'past'
  } = {},
) {
  const past = params.when === 'past'
  const and: Where[] = [past ? endedWhere() : upcomingWhere()]
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
    sort: past ? '-startsAt' : 'startsAt',
    page: params.page ?? 1,
    limit: params.limit ?? 12,
  })
  return {
    docs: await toCards(payload, res.docs),
    totalDocs: res.totalDocs,
    totalPages: res.totalPages,
    page: res.page ?? 1,
    hasNextPage: res.hasNextPage,
  }
}

/** Districts with in-person events in that tab (for the filter). */
export async function eventDistricts(
  payload: Payload,
  when: 'upcoming' | 'past' = 'upcoming',
): Promise<string[]> {
  const res = await payload.find({
    collection: 'events',
    where: {
      and: [when === 'past' ? endedWhere() : upcomingWhere(), { mode: { equals: 'in_person' } }],
    },
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

/** What happened at a মজলিস that is over (published; a draft too when previewing). */
export async function getEventRecap(
  payload: Payload,
  eventId: number,
  opts: { draft?: boolean; user?: User | null } = {},
) {
  const res = await payload.find({
    collection: 'event-recaps',
    where: { event: { equals: eventId } },
    depth: 1,
    limit: 1,
    draft: opts.draft,
    overrideAccess: false,
    user: opts.user ?? undefined,
    select: {
      summary: true,
      attendance: true,
      content: true,
      gallery: true,
      videos: true,
      _status: true,
    },
    populate: { media: { url: true, alt: true, width: true, height: true, sizes: true } },
  })
  const recap = res.docs[0]
  if (!recap || (!opts.draft && recap._status !== 'published')) return null
  return recap
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
