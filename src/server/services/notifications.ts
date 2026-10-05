import type { Payload, PayloadRequest, Where } from 'payload'

import { emailTemplates } from '../email/templates'
import { sendEmail } from '../email'
import { broadcast } from '../realtime/broadcast'
import type { ServiceContext } from './context'
import { requireUser } from './context'

export type NotificationKind = 'answer' | 'event' | 'forum' | 'course' | 'review' | 'system'

/** Maps a notification kind to the member preference row that controls it. */
const PREF_KEY: Record<NotificationKind, 'answer' | 'event' | 'forum' | 'course' | null> = {
  answer: 'answer',
  event: 'event',
  forum: 'forum',
  course: 'course',
  review: null,
  system: null,
}

type Prefs = Partial<
  Record<
    'answer' | 'event' | 'forum' | 'weekly' | 'course',
    { email?: boolean | null; site?: boolean | null }
  >
>

export type NotifyInput = {
  recipients: (number | string)[]
  kind: NotificationKind
  text: string
  link?: string | null
  /** Email subject; when omitted no email is sent */
  emailSubject?: string
  /** Send email even if the user turned email off for this kind (security notices only) */
  forceEmail?: boolean
  actorId?: number | string | null
}

/**
 * Create in-app notifications, push them over realtime and send emails,
 * honouring each member's notification preferences.
 */
export async function notify(
  payload: Payload,
  input: NotifyInput,
  req?: PayloadRequest,
): Promise<number> {
  const ids = [...new Set(input.recipients.map(String))].filter(
    (id) => id !== String(input.actorId ?? ''),
  )
  if (ids.length === 0) return 0

  const users = await payload.find({
    collection: 'users',
    where: { id: { in: ids } },
    select: { email: true, name: true, notificationPrefs: true, emailVerified: true },
    depth: 0,
    limit: ids.length,
    pagination: false,
    overrideAccess: true,
    req,
  })

  const prefKey = PREF_KEY[input.kind]
  let created = 0
  for (const user of users.docs) {
    const prefs = (user as { notificationPrefs?: Prefs }).notificationPrefs ?? {}
    const pref = prefKey ? prefs[prefKey] : undefined
    const wantsSite = pref?.site ?? true
    const wantsEmail =
      input.forceEmail ||
      (pref?.email ??
        (input.kind === 'review' || input.kind === 'answer' || input.kind === 'event'))

    if (wantsSite) {
      const doc = await payload.create({
        collection: 'notifications',
        data: {
          recipient: user.id,
          kind: input.kind,
          text: input.text,
          link: input.link ?? null,
          read: false,
        },
        overrideAccess: true,
        depth: 0,
        req,
      })
      created++
      void broadcast(`user:${user.id}`, 'notification', { id: doc.id, kind: input.kind })
    }

    const email = (user as { email?: string }).email
    const isPlaceholder = typeof email === 'string' && email.endsWith('.phone.ruhama.local')
    if (input.emailSubject && wantsEmail && email && !isPlaceholder) {
      const { html, text } = emailTemplates.notification(
        input.emailSubject,
        input.text,
        input.link ?? null,
      )
      await sendEmail({
        to: email,
        subject: input.emailSubject,
        html,
        text,
        tags: [{ name: 'kind', value: input.kind }],
      })
    }
  }
  return created
}

/** Staff members who hold any of the given roles. */
export async function usersWithRoles(payload: Payload, roles: string[], req?: PayloadRequest) {
  const res = await payload.find({
    collection: 'users',
    where: { role: { in: roles } },
    select: { name: true },
    depth: 0,
    limit: 200,
    pagination: false,
    overrideAccess: true,
    req,
  })
  return res.docs.map((d) => d.id)
}

/* ---------------- the member's inbox ---------------- */

export type InboxItem = {
  id: string
  kind: NotificationKind
  text: string
  link: string | null
  read: boolean
  createdAt: string
}

export async function listMyNotifications(
  ctx: ServiceContext,
  params: { page?: number; limit?: number; unreadOnly?: boolean } = {},
) {
  const user = requireUser(ctx)
  const where: Where = {
    and: [
      { recipient: { equals: user.id } },
      ...(params.unreadOnly ? [{ read: { equals: false } }] : []),
    ],
  }
  const [res, unread] = await Promise.all([
    ctx.payload.find({
      collection: 'notifications',
      where,
      select: { kind: true, text: true, link: true, read: true, createdAt: true },
      depth: 0,
      sort: '-createdAt',
      page: params.page ?? 1,
      limit: params.limit ?? 30,
      overrideAccess: true,
    }),
    ctx.payload.count({
      collection: 'notifications',
      where: { and: [{ recipient: { equals: user.id } }, { read: { equals: false } }] },
      overrideAccess: true,
    }),
  ])
  return {
    docs: res.docs.map((n) => ({
      id: String(n.id),
      kind: n.kind as NotificationKind,
      text: n.text,
      link: n.link ?? null,
      read: Boolean(n.read),
      createdAt: n.createdAt,
    })) as InboxItem[],
    unreadCount: unread.totalDocs,
    totalDocs: res.totalDocs,
    hasNextPage: res.hasNextPage,
    nextPage: res.nextPage ?? null,
  }
}

export async function markNotificationRead(ctx: ServiceContext, id: number) {
  const user = requireUser(ctx)
  // scoped to the recipient, so one member can never touch another's inbox
  await ctx.payload.update({
    collection: 'notifications',
    where: { and: [{ id: { equals: id } }, { recipient: { equals: user.id } }] },
    data: { read: true },
    overrideAccess: true,
  })
  return { ok: true as const }
}

export async function markAllNotificationsRead(ctx: ServiceContext) {
  const user = requireUser(ctx)
  await ctx.payload.update({
    collection: 'notifications',
    where: { and: [{ recipient: { equals: user.id } }, { read: { equals: false } }] },
    data: { read: true },
    overrideAccess: true,
  })
  return { ok: true as const }
}
