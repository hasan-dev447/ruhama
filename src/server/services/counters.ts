import type { CollectionSlug, Payload, PayloadRequest, Where } from 'payload'

/**
 * Cached aggregates. Counts are recomputed from the source of truth
 * whenever related rows change, so pages never count on every request.
 */

type Id = number | string

async function count(
  payload: Payload,
  collection: CollectionSlug,
  where: Where,
  req?: PayloadRequest,
) {
  const res = await payload.count({ collection, where, overrideAccess: true, req })
  return res.totalDocs
}

async function patch(
  payload: Payload,
  collection: CollectionSlug,
  id: Id,
  data: Record<string, unknown>,
  req?: PayloadRequest,
) {
  try {
    await payload.update({
      collection,
      id,
      data,
      depth: 0,
      overrideAccess: true,
      context: { skipCounters: true, skipWorkflow: true, isCounterUpdate: true },
      req,
    })
  } catch (err) {
    payload.logger.warn({ err, msg: `counter update failed for ${collection}:${id}` })
  }
}

const published: Where = { _status: { equals: 'published' } }

export async function recountCategory(payload: Payload, id: Id, req?: PayloadRequest) {
  const [articleCount, questionCount, videoCount] = await Promise.all([
    count(payload, 'articles', { and: [published, { category: { equals: id } }] }, req),
    count(payload, 'questions', { and: [published, { category: { equals: id } }] }, req),
    count(
      payload,
      'videos',
      { and: [{ status: { equals: 'published' } }, { category: { equals: id } }] },
      req,
    ),
  ])
  await patch(payload, 'categories', id, { articleCount, questionCount, videoCount }, req)
}

export async function recountPerson(payload: Payload, id: Id, req?: PayloadRequest) {
  const [
    articleCount,
    answerCount,
    lectureCount,
    reviewedArticles,
    reviewedIkhtilaf,
    reviewedAnswers,
    eventTalkCount,
    seriesCount,
  ] = await Promise.all([
    count(payload, 'articles', { and: [published, { author: { equals: id } }] }, req),
    count(payload, 'questions', { and: [published, { answeredBy: { equals: id } }] }, req),
    count(
      payload,
      'videos',
      { and: [{ status: { equals: 'published' } }, { speaker: { equals: id } }] },
      req,
    ),
    count(payload, 'articles', { and: [published, { reviewedBy: { contains: id } }] }, req),
    count(payload, 'ikhtilaf-topics', { and: [published, { reviewedBy: { contains: id } }] }, req),
    count(payload, 'questions', { and: [published, { reviewedBy: { contains: id } }] }, req),
    count(
      payload,
      'events',
      { and: [{ status: { equals: 'published' } }, { speakers: { contains: id } }] },
      req,
    ),
    count(payload, 'series', { author: { equals: id } }, req),
  ])
  await patch(
    payload,
    'people',
    id,
    {
      articleCount,
      answerCount,
      lectureCount,
      reviewedCount: reviewedArticles + reviewedIkhtilaf + reviewedAnswers,
      eventTalkCount,
      seriesCount,
    },
    req,
  )
}

export async function recountCourse(payload: Payload, id: Id, req?: PayloadRequest) {
  const [lessonCount, enrolledCount] = await Promise.all([
    count(
      payload,
      'lessons',
      { and: [{ course: { equals: id } }, { status: { equals: 'published' } }] },
      req,
    ),
    count(payload, 'enrollments', { course: { equals: id } }, req),
  ])
  await patch(payload, 'courses', id, { lessonCount, enrolledCount }, req)
}

/** Seats in use: offline reservations plus every confirmed registrant and their guests. */
export async function eventSeats(payload: Payload, id: Id, req?: PayloadRequest) {
  const regs = await payload.find({
    collection: 'event-registrations',
    where: { and: [{ event: { equals: id } }, { status: { equals: 'confirmed' } }] },
    select: { guests: true },
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
    req,
  })
  const event = await payload.findByID({
    collection: 'events',
    id,
    select: { reservedSeats: true },
    depth: 0,
    overrideAccess: true,
    req,
  })
  const seatsTaken =
    Number((event as { reservedSeats?: number | null }).reservedSeats ?? 0) +
    regs.docs.reduce((sum, r) => sum + 1 + Number((r as { guests?: number }).guests ?? 0), 0)
  return { seatsTaken, registrationCount: regs.docs.length }
}

export async function recountEvent(payload: Payload, id: Id, req?: PayloadRequest) {
  const { seatsTaken, registrationCount } = await eventSeats(payload, id, req)
  await patch(payload, 'events', id, { seatsTaken, registrationCount }, req)
  return seatsTaken
}

export async function recountCircle(payload: Payload, id: Id, req?: PayloadRequest) {
  const [approved, circle] = await Promise.all([
    count(
      payload,
      'circle-memberships',
      { and: [{ circle: { equals: id } }, { status: { equals: 'approved' } }] },
      req,
    ),
    payload.findByID({
      collection: 'circles',
      id,
      select: { offlineMembers: true },
      depth: 0,
      overrideAccess: true,
      req,
    }),
  ])
  const memberCount =
    approved + Number((circle as { offlineMembers?: number | null }).offlineMembers ?? 0)
  await patch(payload, 'circles', id, { memberCount }, req)
}

export async function recountMeetup(payload: Payload, id: Id, req?: PayloadRequest) {
  const attendingCount = await count(payload, 'meetup-rsvps', { meetup: { equals: id } }, req)
  await patch(payload, 'circle-meetups', id, { attendingCount }, req)
  return attendingCount
}

export async function recountPlaylist(payload: Payload, id: Id, req?: PayloadRequest) {
  const videoCount = await count(
    payload,
    'videos',
    { and: [{ status: { equals: 'published' } }, { playlist: { equals: id } }] },
    req,
  )
  await patch(payload, 'playlists', id, { videoCount }, req)
}

export async function recountForumCategory(payload: Payload, id: Id, req?: PayloadRequest) {
  const threadCount = await count(
    payload,
    'forum-threads',
    {
      and: [
        { category: { equals: id } },
        { status: { equals: 'published' } },
        { deletedAt: { exists: false } },
      ],
    },
    req,
  )
  await patch(payload, 'forum-categories', id, { threadCount }, req)
}

export async function recountThread(payload: Payload, id: Id, req?: PayloadRequest) {
  const replyCount = await count(
    payload,
    'forum-posts',
    {
      and: [
        { thread: { equals: id } },
        { status: { equals: 'published' } },
        { deletedAt: { exists: false } },
      ],
    },
    req,
  )
  await patch(payload, 'forum-threads', id, { replyCount }, req)
  return replyCount
}

export async function recountPostHelpful(payload: Payload, id: Id, req?: PayloadRequest) {
  const helpfulCount = await count(payload, 'forum-reactions', { post: { equals: id } }, req)
  await patch(payload, 'forum-posts', id, { helpfulCount }, req)
  return helpfulCount
}

export async function recountSeries(payload: Payload, id: Id, req?: PayloadRequest) {
  const articleCount = await count(
    payload,
    'articles',
    { and: [published, { series: { equals: id } }] },
    req,
  )
  await patch(payload, 'series', id, { articleCount }, req)
}
