import type { Payload } from 'payload'

export const threadPath = (t: { id: number | string; slug?: string | null }) =>
  `/forum/${t.id}${t.slug ? `/${t.slug}` : ''}`

export type MemberProfile = {
  id: number
  username: string
  name: string
  district: string | null
  bio: string | null
  avatarColor: string
  joinedAt: string
  roles: string[]
  isPublic: boolean
  journeyStage: string | null
  completedCourses: { title: string; slug: string; completedAt: string }[]
  activity: { kind: 'thread' | 'helpful' | 'circle'; text: string; href: string; at: string }[]
}

/**
 * A member's public page. Only what the member chose to show is read: contact details,
 * questions and bookmarks are never part of it.
 */
export async function getMemberProfile(
  payload: Payload,
  username: string,
): Promise<MemberProfile | null> {
  const res = await payload.find({
    collection: 'users',
    where: {
      and: [{ username: { equals: username } }, { deletionRequestedAt: { exists: false } }],
    },
    select: {
      username: true,
      name: true,
      district: true,
      bio: true,
      avatarColor: true,
      createdAt: true,
      role: true,
      privacy: true,
      journeyStage: true,
      banned: true,
    },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const u = res.docs[0]
  if (!u || u.banned) return null
  const privacy = u.privacy ?? {}
  const isPublic = privacy.profilePublic !== false
  const base: MemberProfile = {
    id: u.id,
    username: u.username ?? username,
    name: u.name,
    district: u.district ?? null,
    bio: isPublic ? (u.bio ?? null) : null,
    avatarColor: u.avatarColor ?? 'gold',
    joinedAt: u.createdAt,
    roles: (u.role ?? []) as string[],
    isPublic,
    journeyStage: isPublic && privacy.showJourney !== false ? (u.journeyStage ?? 'kalema') : null,
    completedCourses: [],
    activity: [],
  }
  if (!isPublic || privacy.showActivity === false) return base

  const [enrollments, threads, helpful, circles] = await Promise.all([
    payload.find({
      collection: 'enrollments',
      where: { and: [{ user: { equals: u.id } }, { completedAt: { exists: true } }] },
      depth: 1,
      populate: { courses: { title: true, slug: true, status: true } },
      sort: '-completedAt',
      limit: 10,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'forum-threads',
      where: {
        and: [
          { author: { equals: u.id } },
          { anonymous: { not_equals: true } },
          { status: { equals: 'published' } },
          { deletedAt: { exists: false } },
        ],
      },
      select: { title: true, slug: true, createdAt: true },
      depth: 0,
      sort: '-createdAt',
      limit: 4,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'forum-posts',
      where: {
        and: [
          { author: { equals: u.id } },
          { status: { equals: 'published' } },
          { helpfulCount: { greater_than: 0 } },
        ],
      },
      select: { helpfulCount: true, thread: true, createdAt: true },
      depth: 1,
      populate: { 'forum-threads': { title: true, slug: true } },
      sort: '-helpfulCount',
      limit: 2,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'circle-memberships',
      where: { and: [{ user: { equals: u.id } }, { status: { equals: 'approved' } }] },
      depth: 1,
      populate: { circles: { name: true, slug: true, status: true } },
      limit: 3,
      overrideAccess: true,
    }),
  ])

  base.completedCourses = enrollments.docs
    .filter((e) => e.course && typeof e.course === 'object' && e.course.status === 'published')
    .map((e) => {
      const c = e.course as { title: string; slug?: string | null }
      return { title: c.title, slug: c.slug ?? '', completedAt: e.completedAt ?? e.updatedAt }
    })

  const activity: MemberProfile['activity'] = [
    ...threads.docs.map((t) => ({
      kind: 'thread' as const,
      text: `ফোরামে আলোচনা শুরু করেছেন: “${t.title}”`,
      href: threadPath(t),
      at: t.createdAt,
    })),
    ...helpful.docs
      .filter((p) => p.thread && typeof p.thread === 'object')
      .map((p) => {
        const t = p.thread as { id: number; slug?: string | null; title: string }
        return {
          kind: 'helpful' as const,
          text: `একটি উত্তর ${p.helpfulCount ?? 0} জন “সহায়ক” হিসেবে চিহ্নিত করেছেন`,
          href: threadPath(t),
          at: p.createdAt,
        }
      }),
    ...circles.docs
      .filter(
        (m) =>
          m.circle &&
          typeof m.circle === 'object' &&
          (m.circle as { status?: string }).status === 'published',
      )
      .map((m) => {
        const c = m.circle as { name: string; slug?: string | null }
        return {
          kind: 'circle' as const,
          text: `${c.name}-এর নিয়মিত সদস্য`,
          href: `/circles/${c.slug}`,
          at: m.createdAt,
        }
      }),
  ]
  base.activity = activity.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6)
  return base
}
