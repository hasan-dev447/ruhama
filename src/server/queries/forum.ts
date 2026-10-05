import type { Payload, Where } from 'payload'

const idOf = (v: unknown) =>
  v && typeof v === 'object' && 'id' in v ? (v as { id: number }).id : (v as number | null)

export type ForumAuthor = {
  name: string
  username: string | null
  tone: 'teal' | 'gold'
  scholar: boolean
  staff: boolean
  hidden: boolean
}

export type ThreadRow = {
  id: number
  slug: string | null
  title: string
  category: { id: number; name: string; slug: string } | null
  author: ForumAuthor
  pinned: boolean
  hasHelpful: boolean
  replyCount: number
  viewCount: number
  lastActivityAt: string
  createdAt: string
}

export type PostView = {
  id: number
  parentId: number | null
  author: ForumAuthor
  authorId: number | null
  body: string | null
  arabic: string | null
  reference: string | null
  helpfulCount: number
  markedHelpful: boolean
  removed: boolean
  createdAt: string
}

const USER_SELECT = {
  name: true,
  username: true,
  avatarColor: true,
  role: true,
  person: true,
} as const
const STAFF = ['super_admin', 'shura', 'reviewer', 'editor', 'author', 'moderator']

/** Public author card; anonymous posts and deleted accounts never reveal who wrote them. */
export function toAuthor(u: unknown, anonymous = false): ForumAuthor {
  if (anonymous)
    return {
      name: 'নাম প্রকাশে অনিচ্ছুক',
      username: null,
      tone: 'teal',
      scholar: false,
      staff: false,
      hidden: true,
    }
  if (!u || typeof u !== 'object')
    return {
      name: 'অজ্ঞাত সদস্য',
      username: null,
      tone: 'teal',
      scholar: false,
      staff: false,
      hidden: true,
    }
  const user = u as {
    name?: string
    username?: string | null
    avatarColor?: string | null
    role?: string[] | null
    person?: unknown
  }
  const person =
    user.person && typeof user.person === 'object'
      ? (user.person as { kinds?: string[] | null })
      : null
  return {
    name: user.name ?? 'সদস্য',
    username: user.username ?? null,
    tone: user.avatarColor === 'teal' || user.avatarColor === 'deep' ? 'teal' : 'gold',
    scholar: Boolean(person?.kinds?.includes('scholar')),
    staff: (user.role ?? []).some((r) => STAFF.includes(r)),
    hidden: false,
  }
}

const visible: Where = {
  and: [{ status: { equals: 'published' } }, { deletedAt: { exists: false } }],
}

export async function listForumCategories(payload: Payload) {
  const res = await payload.find({
    collection: 'forum-categories',
    select: { name: true, slug: true, threadCount: true },
    depth: 0,
    sort: 'order',
    limit: 50,
    pagination: false,
  })
  return res.docs.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug ?? '',
    threadCount: c.threadCount ?? 0,
  }))
}

export async function listThreads(
  payload: Payload,
  params: {
    category?: string | null
    sort?: 'recent' | 'popular' | 'unanswered'
    page?: number
    limit?: number
    authorId?: number
  } = {},
) {
  const and: Where[] = [visible]
  if (params.category && params.category !== 'all')
    and.push({ 'category.slug': { equals: params.category } })
  if (params.sort === 'unanswered') and.push({ replyCount: { equals: 0 } })
  if (params.authorId) and.push({ author: { equals: params.authorId } })
  const sort =
    params.sort === 'popular'
      ? ['-pinned', '-replyCount', '-viewCount']
      : ['-pinned', '-lastActivityAt']
  const res = await payload.find({
    collection: 'forum-threads',
    where: { and },
    select: {
      title: true,
      slug: true,
      category: true,
      author: true,
      anonymous: true,
      pinned: true,
      helpfulPost: true,
      replyCount: true,
      viewCount: true,
      lastActivityAt: true,
      createdAt: true,
    },
    populate: {
      'forum-categories': { name: true, slug: true },
      users: USER_SELECT,
      people: { kinds: true },
    },
    depth: 2,
    sort,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  })
  return {
    docs: res.docs.map((t): ThreadRow => ({
      id: t.id,
      slug: t.slug ?? null,
      title: t.title,
      category:
        t.category && typeof t.category === 'object'
          ? { id: t.category.id, name: t.category.name, slug: t.category.slug ?? '' }
          : null,
      author: toAuthor(t.author, Boolean(t.anonymous)),
      pinned: Boolean(t.pinned),
      hasHelpful: Boolean(t.helpfulPost),
      replyCount: t.replyCount ?? 0,
      viewCount: t.viewCount ?? 0,
      lastActivityAt: t.lastActivityAt ?? t.createdAt,
      createdAt: t.createdAt,
    })),
    totalDocs: res.totalDocs,
    totalPages: res.totalPages,
    page: res.page ?? 1,
  }
}

/** A thread with its visible replies; replies removed by moderators remain as placeholders. */
export async function getThread(payload: Payload, id: number) {
  const res = await payload.find({
    collection: 'forum-threads',
    where: { and: [{ id: { equals: id } }, visible] },
    populate: {
      'forum-categories': { name: true, slug: true },
      users: USER_SELECT,
      people: { kinds: true },
    },
    depth: 2,
    limit: 1,
  })
  const t = res.docs[0]
  if (!t) return null
  const posts = await payload.find({
    collection: 'forum-posts',
    where: {
      and: [
        { thread: { equals: id } },
        { deletedAt: { exists: false } },
        { status: { in: ['published', 'removed'] } },
      ],
    },
    select: {
      parent: true,
      author: true,
      body: true,
      arabic: true,
      reference: true,
      helpfulCount: true,
      markedHelpful: true,
      status: true,
      createdAt: true,
    },
    populate: { users: USER_SELECT, people: { kinds: true } },
    depth: 2,
    sort: 'createdAt',
    limit: 500,
    pagination: false,
  })
  const mod =
    t.modNote && typeof t.modNote === 'object'
      ? (t.modNote as { text?: string | null; at?: string | null })
      : null
  return {
    thread: {
      id: t.id,
      slug: t.slug ?? null,
      title: t.title,
      body: t.body,
      category:
        t.category && typeof t.category === 'object'
          ? { id: t.category.id, name: t.category.name, slug: t.category.slug ?? '' }
          : null,
      author: toAuthor(t.author, Boolean(t.anonymous)),
      authorId: t.anonymous ? null : idOf(t.author),
      helpfulPostId: idOf(t.helpfulPost),
      locked: Boolean(t.locked),
      replyCount: t.replyCount ?? 0,
      viewCount: t.viewCount ?? 0,
      createdAt: t.createdAt,
      modNote: mod?.text ? { text: mod.text, at: mod.at ?? null } : null,
    },
    posts: posts.docs.map((p): PostView => ({
      id: p.id,
      parentId: idOf(p.parent),
      author: p.status === 'removed' ? toAuthor(null) : toAuthor(p.author),
      authorId: p.status === 'removed' ? null : idOf(p.author),
      body: p.status === 'removed' ? null : p.body,
      arabic: p.status === 'removed' ? null : (p.arabic ?? null),
      reference: p.status === 'removed' ? null : (p.reference ?? null),
      helpfulCount: p.helpfulCount ?? 0,
      markedHelpful: Boolean(p.markedHelpful),
      removed: p.status === 'removed',
      createdAt: p.createdAt,
    })),
  }
}

/** Moderator inbox: content waiting for approval and content with open reports. */
export async function moderationQueue(payload: Payload) {
  const [threads, posts, reports] = await Promise.all([
    payload.find({
      collection: 'forum-threads',
      where: { and: [{ status: { in: ['pending', 'hidden'] } }, { deletedAt: { exists: false } }] },
      select: {
        title: true,
        slug: true,
        body: true,
        status: true,
        flagReasons: true,
        author: true,
        reportCount: true,
        createdAt: true,
      },
      populate: { users: { name: true, username: true } },
      depth: 1,
      sort: '-createdAt',
      limit: 50,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'forum-posts',
      where: { and: [{ status: { in: ['pending', 'hidden'] } }, { deletedAt: { exists: false } }] },
      select: {
        body: true,
        status: true,
        flagReasons: true,
        author: true,
        thread: true,
        reportCount: true,
        createdAt: true,
      },
      populate: {
        users: { name: true, username: true },
        'forum-threads': { title: true, slug: true },
      },
      depth: 1,
      sort: '-createdAt',
      limit: 50,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'reports',
      where: { status: { equals: 'open' } },
      select: {
        targetType: true,
        thread: true,
        post: true,
        reason: true,
        note: true,
        createdAt: true,
      },
      populate: {
        'forum-threads': { title: true, slug: true, status: true },
        'forum-posts': { body: true, status: true },
      },
      depth: 1,
      sort: '-createdAt',
      limit: 100,
      overrideAccess: true,
    }),
  ])
  return { threads: threads.docs, posts: posts.docs, reports: reports.docs }
}
