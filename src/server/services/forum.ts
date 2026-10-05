import type { z } from 'zod'

import { flagReasons, type ModerationRules } from '@/lib/moderation'
import { hasRole, MODERATOR_ROLES, STAFF_ROLES } from '@/lib/roles'
import {
  moderateSchema,
  newPostSchema,
  newThreadSchema,
  reportSchema,
} from '@/lib/validation/forum'
import type { User } from '@/payload-types'

import { broadcast } from '../realtime/broadcast'
import type { ServiceContext } from './context'
import { requireUser } from './context'
import { recountForumCategory, recountThread } from './counters'
import { errors } from './errors'
import { notify, usersWithRoles } from './notifications'
import { consumeRateLimit } from './rate-limit'

const idOf = (v: unknown) =>
  v && typeof v === 'object' && 'id' in v ? (v as { id: number }).id : (v as number)
export { moderateSchema, newPostSchema, newThreadSchema, reportSchema }

const threadHref = (t: { id: number; slug?: string | null }) =>
  `/forum/${t.id}${t.slug ? `/${t.slug}` : ''}`

async function rules(
  ctx: ServiceContext,
): Promise<ModerationRules & { reportThreshold: number; postsPerHour: number }> {
  const g = (await ctx.payload.findGlobal({
    slug: 'moderation-settings',
    depth: 0,
    overrideAccess: true,
  })) as {
    firstPostsModerated?: number | null
    maxLinks?: number | null
    blockedTerms?: string[] | null
    reportThreshold?: number | null
    postsPerHour?: number | null
  }
  return {
    firstPostsModerated: g.firstPostsModerated ?? 3,
    maxLinks: g.maxLinks ?? 2,
    blockedTerms: g.blockedTerms ?? [],
    reportThreshold: g.reportThreshold ?? 3,
    postsPerHour: g.postsPerHour ?? 10,
  }
}

/** Posting rules shared by threads and replies: mute, rate limit and auto-flags. */
async function gate(ctx: ServiceContext, user: User, text: string) {
  const r = await rules(ctx)
  const stats =
    (
      user as {
        forumStats?: {
          approvedPosts?: number | null
          trusted?: boolean | null
          mutedUntil?: string | null
        }
      }
    ).forumStats ?? {}
  if (stats.mutedUntil && new Date(stats.mutedUntil).getTime() > Date.now()) {
    throw errors.forbidden(
      'আদব নীতিমালা ভঙ্গের কারণে আপনার পোস্ট করার সুবিধা সাময়িকভাবে বন্ধ আছে।',
    )
  }
  const limit = await consumeRateLimit(
    ctx.payload,
    `forum:post:user:${user.id}`,
    r.postsPerHour,
    60 * 60,
  )
  if (!limit.allowed)
    throw errors.rateLimited('এক ঘণ্টায় অনেক পোস্ট হয়ে গেছে। কিছুক্ষণ পর আবার লিখুন।')
  const reasons = flagReasons(text, r, {
    approvedPosts: stats.approvedPosts ?? 0,
    trusted: Boolean(stats.trusted),
    staff: hasRole(user, ...STAFF_ROLES),
  })
  return { status: reasons.length ? ('pending' as const) : ('published' as const), reasons }
}

async function bumpApproved(ctx: ServiceContext, userId: number | null | undefined) {
  if (!userId) return
  const u = await ctx.payload.findByID({
    collection: 'users',
    id: userId,
    depth: 0,
    select: { forumStats: true },
    overrideAccess: true,
    disableErrors: true,
  })
  if (!u) return
  const stats = (u.forumStats ?? {}) as { approvedPosts?: number | null }
  await ctx.payload.update({
    collection: 'users',
    id: userId,
    data: { forumStats: { ...u.forumStats, approvedPosts: (stats.approvedPosts ?? 0) + 1 } },
    overrideAccess: true,
    depth: 0,
  })
}

async function tellModerators(ctx: ServiceContext, text: string) {
  const mods = await usersWithRoles(ctx.payload, [...MODERATOR_ROLES])
  await notify(ctx.payload, {
    recipients: mods,
    kind: 'review',
    text,
    link: '/forum/moderation',
    actorId: ctx.user?.id,
  })
}

export async function createThread(ctx: ServiceContext, input: z.input<typeof newThreadSchema>) {
  const user = requireUser(ctx)
  const data = newThreadSchema.parse(input)
  const category = await ctx.payload.findByID({
    collection: 'forum-categories',
    id: data.categoryId,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
  })
  if (!category)
    throw errors.invalid('একটি বিভাগ বেছে নিন।', [
      { path: 'categoryId', message: 'বিভাগটি পাওয়া যায়নি।' },
    ])
  const { status, reasons } = await gate(ctx, user, `${data.title}\n${data.body}`)
  const now = new Date().toISOString()
  const doc = await ctx.payload.create({
    collection: 'forum-threads',
    data: {
      title: data.title,
      category: data.categoryId,
      author: user.id,
      anonymous: data.anonymous,
      body: data.body,
      status,
      flagReasons: reasons,
      lastActivityAt: now,
      replyCount: 0,
    },
    overrideAccess: true,
    depth: 0,
  })
  if (status === 'published') {
    await bumpApproved(ctx, user.id)
    void broadcast('forum', 'thread', { id: doc.id })
  } else {
    await tellModerators(ctx, `নতুন আলোচনা মডারেশনে: “${data.title}”`)
  }
  return { id: doc.id, slug: doc.slug ?? null, status }
}

async function visibleThread(ctx: ServiceContext, threadId: number) {
  const t = await ctx.payload.findByID({
    collection: 'forum-threads',
    id: threadId,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
  })
  if (!t || t.deletedAt || t.status !== 'published')
    throw errors.notFound('আলোচনাটি পাওয়া যায়নি।')
  return t
}

export async function createPost(ctx: ServiceContext, input: z.input<typeof newPostSchema>) {
  const user = requireUser(ctx)
  const data = newPostSchema.parse(input)
  const thread = await visibleThread(ctx, data.threadId)
  if (thread.locked) throw errors.forbidden('এই আলোচনায় নতুন উত্তর বন্ধ করা হয়েছে।')
  let parentAuthor: number | null = null
  if (data.parentId) {
    const parent = await ctx.payload.findByID({
      collection: 'forum-posts',
      id: data.parentId,
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
    })
    if (!parent || idOf(parent.thread) !== thread.id)
      throw errors.invalid('যে উত্তরের জবাব দিচ্ছেন তা পাওয়া যায়নি।')
    parentAuthor = parent.author ? idOf(parent.author) : null
  }
  const { status, reasons } = await gate(ctx, user, data.body)
  const doc = await ctx.payload.create({
    collection: 'forum-posts',
    data: {
      thread: thread.id,
      parent: data.parentId ?? null,
      author: user.id,
      body: data.body,
      reference: data.reference || null,
      status,
      flagReasons: reasons,
    },
    overrideAccess: true,
    depth: 0,
  })
  if (status === 'published') await onPostPublished(ctx, thread, doc.id, user, parentAuthor)
  else await tellModerators(ctx, `নতুন উত্তর মডারেশনে: “${thread.title}”`)
  return { id: doc.id, status }
}

/** Counters, activity, notifications and the live update for a newly visible reply. */
async function onPostPublished(
  ctx: ServiceContext,
  thread: { id: number; slug?: string | null; title: string; author?: unknown },
  postId: number,
  author: { id: number; name: string },
  parentAuthor: number | null,
) {
  await recountThread(ctx.payload, thread.id)
  await ctx.payload.update({
    collection: 'forum-threads',
    id: thread.id,
    data: { lastActivityAt: new Date().toISOString(), lastReplyBy: author.id },
    overrideAccess: true,
    depth: 0,
    context: { skipCounters: true },
  })
  await bumpApproved(ctx, author.id)
  const recipients = [thread.author ? idOf(thread.author) : null, parentAuthor].filter(
    (v): v is number => Boolean(v),
  )
  await notify(ctx.payload, {
    recipients,
    kind: 'forum',
    text: `${author.name} আপনার আলোচনায় উত্তর দিয়েছেন: “${thread.title}”`,
    link: `${threadHref(thread)}#post-${postId}`,
    actorId: author.id,
  })
  void broadcast(`thread:${thread.id}`, 'post', { id: postId })
}

/** "সহায়ক" toggle on a reply (not on one's own). */
export async function toggleHelpful(ctx: ServiceContext, postId: number) {
  const user = requireUser(ctx)
  const post = await ctx.payload.findByID({
    collection: 'forum-posts',
    id: postId,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
  })
  if (!post || post.deletedAt || post.status !== 'published')
    throw errors.notFound('উত্তরটি পাওয়া যায়নি।')
  if (post.author && idOf(post.author) === user.id)
    throw errors.invalid('নিজের উত্তর নিজে সহায়ক চিহ্নিত করা যায় না।')
  const existing = await ctx.payload.find({
    collection: 'forum-reactions',
    where: { and: [{ post: { equals: postId } }, { user: { equals: user.id } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (existing.docs[0])
    await ctx.payload.delete({
      collection: 'forum-reactions',
      id: existing.docs[0].id,
      overrideAccess: true,
    })
  else
    await ctx.payload.create({
      collection: 'forum-reactions',
      data: { post: postId, thread: idOf(post.thread), user: user.id },
      overrideAccess: true,
    })
  const count = await ctx.payload.count({
    collection: 'forum-reactions',
    where: { post: { equals: postId } },
    overrideAccess: true,
  })
  void broadcast(`thread:${idOf(post.thread)}`, 'helpful', { id: postId, count: count.totalDocs })
  return { helpful: !existing.docs[0], count: count.totalDocs }
}

/** The thread author picks the reply that helped most (or clears it). */
export async function markHelpfulAnswer(ctx: ServiceContext, postId: number) {
  const user = requireUser(ctx)
  const post = await ctx.payload.findByID({
    collection: 'forum-posts',
    id: postId,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
  })
  if (!post || post.deletedAt || post.status !== 'published')
    throw errors.notFound('উত্তরটি পাওয়া যায়নি।')
  const thread = await visibleThread(ctx, idOf(post.thread))
  const isOwner = thread.author && idOf(thread.author) === user.id
  if (!isOwner && !hasRole(user, ...MODERATOR_ROLES))
    throw errors.forbidden('শুধু আলোচনা শুরুকারী সহায়ক উত্তর বেছে নিতে পারেন।')
  const clearing = idOf(thread.helpfulPost) === postId
  if (thread.helpfulPost)
    await ctx.payload.update({
      collection: 'forum-posts',
      id: idOf(thread.helpfulPost),
      data: { markedHelpful: false },
      overrideAccess: true,
      context: { skipCounters: true },
    })
  if (!clearing)
    await ctx.payload.update({
      collection: 'forum-posts',
      id: postId,
      data: { markedHelpful: true },
      overrideAccess: true,
      context: { skipCounters: true },
    })
  await ctx.payload.update({
    collection: 'forum-threads',
    id: thread.id,
    data: { helpfulPost: clearing ? null : postId },
    overrideAccess: true,
    context: { skipCounters: true },
  })
  return { helpfulPost: clearing ? null : postId }
}

/**
 * Report a thread or reply. One open report per member and target; at the threshold
 * the content is hidden automatically until a moderator decides.
 */
export async function reportContent(ctx: ServiceContext, input: z.input<typeof reportSchema>) {
  const user = requireUser(ctx)
  const data = reportSchema.parse(input)
  const limit = await consumeRateLimit(ctx.payload, `forum:report:user:${user.id}`, 20, 24 * 3600)
  if (!limit.allowed) throw errors.rateLimited()
  const collection = data.targetType === 'thread' ? 'forum-threads' : 'forum-posts'
  const target = await ctx.payload.findByID({
    collection,
    id: data.id,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
  })
  if (!target || target.deletedAt) throw errors.notFound('বিষয়টি পাওয়া যায়নি।')
  if (target.author && idOf(target.author) === user.id)
    throw errors.invalid('নিজের পোস্ট রিপোর্ট করা যায় না।')

  const field = data.targetType === 'thread' ? 'thread' : 'post'
  const dup = await ctx.payload.count({
    collection: 'reports',
    where: {
      and: [
        { [field]: { equals: data.id } },
        { reporter: { equals: user.id } },
        { status: { equals: 'open' } },
      ],
    },
    overrideAccess: true,
  })
  if (dup.totalDocs) return { reported: true, hidden: target.status === 'hidden' }

  const threadId =
    data.targetType === 'thread' ? data.id : idOf((target as { thread?: unknown }).thread)
  await ctx.payload.create({
    collection: 'reports',
    data: {
      targetType: data.targetType,
      thread: threadId,
      post: data.targetType === 'post' ? data.id : null,
      reporter: user.id,
      reason: data.reason,
      note: data.note || null,
      status: 'open',
    },
    overrideAccess: true,
  })
  const open = await ctx.payload.count({
    collection: 'reports',
    where: { and: [{ [field]: { equals: data.id } }, { status: { equals: 'open' } }] },
    overrideAccess: true,
  })
  const r = await rules(ctx)
  const hide = target.status === 'published' && open.totalDocs >= r.reportThreshold
  await ctx.payload.update({
    collection,
    id: data.id,
    data: { reportCount: open.totalDocs, ...(hide ? { status: 'hidden' } : {}) } as never,
    overrideAccess: true,
    context: hide ? {} : { skipCounters: true },
  })
  if (hide) {
    if (data.targetType === 'post') await recountThread(ctx.payload, threadId)
    await tellModerators(
      ctx,
      `একাধিক রিপোর্টের কারণে একটি ${data.targetType === 'thread' ? 'আলোচনা' : 'উত্তর'} স্বয়ংক্রিয়ভাবে লুকানো হয়েছে`,
    )
    void broadcast(`thread:${threadId}`, 'moderated', { type: data.targetType, id: data.id })
  } else if (open.totalDocs === 1) {
    await tellModerators(ctx, `নতুন রিপোর্ট জমা পড়েছে`)
  }
  return { reported: true, hidden: hide }
}

/** Authors can delete their own posts; moderators any. Nothing is erased, only hidden. */
export async function softDelete(ctx: ServiceContext, targetType: 'thread' | 'post', id: number) {
  const user = requireUser(ctx)
  const collection = targetType === 'thread' ? 'forum-threads' : 'forum-posts'
  const target = await ctx.payload.findByID({
    collection,
    id,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
  })
  if (!target || target.deletedAt) throw errors.notFound('বিষয়টি পাওয়া যায়নি।')
  const own = target.author && idOf(target.author) === user.id
  if (!own && !hasRole(user, ...MODERATOR_ROLES)) throw errors.forbidden()
  await ctx.payload.update({
    collection,
    id,
    data: { deletedAt: new Date().toISOString(), deletedBy: user.id } as never,
    overrideAccess: true,
  })
  const threadId = targetType === 'thread' ? id : idOf((target as { thread?: unknown }).thread)
  if (targetType === 'post') await recountThread(ctx.payload, threadId)
  else await recountForumCategory(ctx.payload, idOf((target as { category?: unknown }).category))
  void broadcast(`thread:${threadId}`, 'moderated', { type: targetType, id })
  return { deleted: true }
}

/** Moderator decisions; open reports on the target are resolved with the same decision. */
export async function moderate(ctx: ServiceContext, input: z.input<typeof moderateSchema>) {
  const user = requireUser(ctx)
  if (!hasRole(user, ...MODERATOR_ROLES))
    throw errors.forbidden('শুধু মডারেটররা এই কাজ করতে পারেন।')
  const data = moderateSchema.parse(input)
  const collection = data.targetType === 'thread' ? 'forum-threads' : 'forum-posts'
  const target = await ctx.payload.findByID({
    collection,
    id: data.id,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
  })
  if (!target) throw errors.notFound()
  const wasPublished = target.status === 'published'
  const status =
    data.action === 'approve' || data.action === 'restore' || data.action === 'dismiss'
      ? 'published'
      : data.action === 'hide'
        ? 'hidden'
        : 'removed'
  await ctx.payload.update({
    collection,
    id: data.id,
    data: {
      status,
      ...(data.action === 'remove' ? { removedReason: data.reason || null } : {}),
      ...(data.action === 'restore' ? { deletedAt: null } : {}),
      reportCount: 0,
    } as never,
    overrideAccess: true,
  })
  const field = data.targetType === 'thread' ? 'thread' : 'post'
  await ctx.payload.update({
    collection: 'reports',
    where: {
      and: [
        { [field]: { equals: data.id } },
        { status: { equals: 'open' } },
        ...(data.targetType === 'thread' ? [{ targetType: { equals: 'thread' } }] : []),
      ],
    },
    data: {
      status: data.action === 'dismiss' || data.action === 'approve' ? 'dismissed' : 'actioned',
      resolution: data.reason || null,
      resolvedBy: user.id,
      resolvedAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })

  const authorId = target.author ? idOf(target.author) : null
  if (data.muteDays && authorId) {
    const u = await ctx.payload.findByID({
      collection: 'users',
      id: authorId,
      depth: 0,
      select: { forumStats: true },
      overrideAccess: true,
    })
    const mutedUntil = new Date(Date.now() + data.muteDays * 86400000).toISOString()
    await ctx.payload.update({
      collection: 'users',
      id: authorId,
      data: { forumStats: { ...u.forumStats, mutedUntil } },
      overrideAccess: true,
    })
  }
  const threadId =
    data.targetType === 'thread' ? data.id : idOf((target as { thread?: unknown }).thread)
  if (status === 'published' && !wasPublished && target.status === 'pending') {
    if (data.targetType === 'post') {
      const thread = await ctx.payload.findByID({
        collection: 'forum-threads',
        id: threadId,
        depth: 0,
        overrideAccess: true,
      })
      const author = authorId
        ? await ctx.payload.findByID({
            collection: 'users',
            id: authorId,
            depth: 0,
            select: { name: true },
            overrideAccess: true,
          })
        : null
      if (author)
        await onPostPublished(ctx, thread, data.id, { id: author.id, name: author.name }, null)
    } else {
      await bumpApproved(ctx, authorId)
      if (authorId)
        await notify(ctx.payload, {
          recipients: [authorId],
          kind: 'forum',
          text: `আপনার আলোচনা “${(target as { title?: string }).title}” প্রকাশিত হয়েছে।`,
          link: threadHref(target as { id: number; slug?: string | null }),
        })
    }
  } else if (data.targetType === 'post') {
    await recountThread(ctx.payload, threadId)
  }
  if (data.action === 'remove' && authorId) {
    await notify(ctx.payload, {
      recipients: [authorId],
      kind: 'system',
      text: `আদব নীতিমালা ভঙ্গের কারণে আপনার একটি পোস্ট সরানো হয়েছে।${data.reason ? ` কারণ: ${data.reason}` : ''}`,
      link: '/adab',
    })
  }
  void broadcast(`thread:${threadId}`, 'moderated', { type: data.targetType, id: data.id })
  return { status }
}

/** Approximate view counter, at most once an hour per visitor and thread. Never touches caches. */
export async function countView(ctx: ServiceContext, threadId: number, visitor: string) {
  const res = await consumeRateLimit(ctx.payload, `forum:view:${threadId}:${visitor}`, 1, 3600)
  if (!res.allowed) return { counted: false }
  const pool = (
    ctx.payload.db as unknown as { pool: { query: (q: string, v: unknown[]) => Promise<unknown> } }
  ).pool
  await pool.query(
    'UPDATE forum_threads SET view_count = coalesce(view_count, 0) + 1 WHERE id = $1 AND deleted_at IS NULL',
    [threadId],
  )
  return { counted: true }
}

/** What the signed-in member sees on top of the cached thread: their helpful marks and pending replies. */
export async function myThreadState(ctx: ServiceContext, threadId: number) {
  if (!ctx.user)
    return {
      helpful: [] as number[],
      pending: [] as { id: number; body: string; createdAt: string }[],
    }
  const [reactions, pending] = await Promise.all([
    ctx.payload.find({
      collection: 'forum-reactions',
      where: { and: [{ thread: { equals: threadId } }, { user: { equals: ctx.user.id } }] },
      select: { post: true },
      depth: 0,
      limit: 500,
      pagination: false,
      overrideAccess: true,
    }),
    ctx.payload.find({
      collection: 'forum-posts',
      where: {
        and: [
          { thread: { equals: threadId } },
          { author: { equals: ctx.user.id } },
          { status: { equals: 'pending' } },
          { deletedAt: { exists: false } },
        ],
      },
      select: { body: true, createdAt: true },
      depth: 0,
      limit: 20,
      overrideAccess: true,
    }),
  ])
  return {
    helpful: reactions.docs.map((r) => idOf(r.post)),
    pending: pending.docs.map((p) => ({ id: p.id, body: p.body, createdAt: p.createdAt })),
  }
}
