import { getTranslation, type I18nClient } from '@payloadcms/translations'
import {
  ArrowUpRight,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Flag,
  Inbox,
  MessageCircleQuestion,
  Plus,
  Send,
  UploadCloud,
  UserPlus,
  Video,
} from 'lucide-react'
import type { CollectionSlug, Payload, SanitizedPermissions, Where } from 'payload'

import { ROLE_LABELS, rolesOf } from '@/lib/roles'
import type { User } from '@/payload-types'

import { ReviewQueue } from './review-queue'

type NavGroup = { label: string; entities: { label: unknown; slug: string; type: string }[] }
type Props = {
  payload: Payload
  user?: User | null
  permissions?: SanitizedPermissions
  navGroups?: NavGroup[]
  i18n: I18nClient
}

type Tone = 'green' | 'amber' | 'red' | 'blue' | 'slate'
type Stat = {
  label: string
  value: number
  href: string
  tone: Tone
  icon: typeof FileText
  hint: string
}

const ADMIN = '/admin'

const allowed = (p: unknown) =>
  p === true ||
  (typeof p === 'object' && p !== null && (p as { permission?: boolean }).permission === true)

const bn = (n: number) => n.toLocaleString('bn-BD')

/** ISO timestamp n days from now (negative for the past); kept outside render for the hooks lint. */
const isoDaysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString()

/** Count with the person's own access rules, so a number never reveals what they cannot open. */
async function countFor(payload: Payload, user: User, collection: CollectionSlug, where: Where) {
  try {
    const res = await payload.count({ collection, where, user, overrideAccess: false })
    return res.totalDocs
  } catch {
    return null
  }
}

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'Asia/Dhaka',
    }).format(new Date()),
  )
  if (hour < 5) return 'রাত্রি শুভ হোক'
  if (hour < 12) return 'শুভ সকাল'
  if (hour < 17) return 'শুভ দুপুর'
  return 'শুভ সন্ধ্যা'
}

/** The admin home: what needs attention, quick actions and every menu the person can open. */
export async function AdminDashboard({ payload, user, permissions, navGroups = [], i18n }: Props) {
  if (!user) return null
  const can = (slug: string, op: 'read' | 'create') =>
    allowed(
      (permissions?.collections as Record<string, Record<string, unknown>> | undefined)?.[slug]?.[
        op
      ],
    )
  const roles = rolesOf(user)
  const isModerator = roles.some((r) => ['super_admin', 'shura', 'moderator'].includes(r))
  const weekAgo = isoDaysFromNow(-7)
  const now = isoDaysFromNow(0)

  const reviewWhere: Where = { reviewStatus: { equals: 'in_review' } }
  const [
    inReviewArticles,
    inReviewIkhtilaf,
    inReviewAnswers,
    approved,
    newQuestions,
    pendingPosts,
    openReports,
    newMessages,
    newVolunteers,
    newMembers,
    upcoming,
  ] = await Promise.all([
    can('articles', 'read') ? countFor(payload, user, 'articles', reviewWhere) : null,
    can('ikhtilaf-topics', 'read') ? countFor(payload, user, 'ikhtilaf-topics', reviewWhere) : null,
    can('questions', 'read') ? countFor(payload, user, 'questions', reviewWhere) : null,
    can('articles', 'read')
      ? countFor(payload, user, 'articles', { reviewStatus: { equals: 'approved' } })
      : null,
    can('questions', 'read')
      ? countFor(payload, user, 'questions', { moderation: { equals: 'pending' } })
      : null,
    isModerator && can('forum-posts', 'read')
      ? countFor(payload, user, 'forum-posts', { status: { in: ['pending', 'hidden'] } })
      : null,
    isModerator && can('reports', 'read')
      ? countFor(payload, user, 'reports', { status: { equals: 'open' } })
      : null,
    can('contact-messages', 'read')
      ? countFor(payload, user, 'contact-messages', { status: { equals: 'new' } })
      : null,
    can('volunteers', 'read')
      ? countFor(payload, user, 'volunteers', { status: { equals: 'new' } })
      : null,
    can('users', 'read')
      ? countFor(payload, user, 'users', { createdAt: { greater_than: weekAgo } })
      : null,
    can('events', 'read')
      ? countFor(payload, user, 'events', {
          and: [{ startsAt: { greater_than: now } }, { status: { equals: 'published' } }],
        })
      : null,
  ])

  const inReview = [inReviewArticles, inReviewIkhtilaf, inReviewAnswers].reduce<number | null>(
    (sum, n) => (n === null ? sum : (sum ?? 0) + n),
    null,
  )

  const stats: Stat[] = []
  if (inReview !== null)
    stats.push({
      label: 'Review বাকি',
      value: inReview,
      href: `${ADMIN}/collections/articles?where[reviewStatus][equals]=in_review`,
      tone: 'amber',
      icon: ClipboardCheck,
      hint: 'আর্টিকেল, ইখতিলাফ ও উত্তর',
    })
  if (approved !== null && roles.some((r) => r === 'super_admin' || r === 'shura'))
    stats.push({
      label: 'Publish করার জন্য রেডি',
      value: approved,
      href: `${ADMIN}/collections/articles?where[reviewStatus][equals]=approved`,
      tone: 'green',
      icon: Send,
      hint: 'দুজন reviewer approve করেছেন',
    })
  if (newQuestions !== null)
    stats.push({
      label: 'নতুন প্রশ্ন',
      value: newQuestions,
      href: `${ADMIN}/collections/questions?where[moderation][equals]=pending`,
      tone: 'blue',
      icon: MessageCircleQuestion,
      hint: 'যাচাই করে উত্তর দিতে হবে',
    })
  if (pendingPosts !== null || openReports !== null)
    stats.push({
      label: 'ফোরাম মডারেশন',
      value: (pendingPosts ?? 0) + (openReports ?? 0),
      href: '/forum/moderation',
      tone: 'red',
      icon: Flag,
      hint: 'আটকে থাকা পোস্ট ও রিপোর্ট',
    })
  if (newMessages !== null || newVolunteers !== null)
    stats.push({
      label: 'নতুন বার্তা',
      value: (newMessages ?? 0) + (newVolunteers ?? 0),
      href: `${ADMIN}/collections/contact-messages?where[status][equals]=new`,
      tone: 'blue',
      icon: Inbox,
      hint: 'Contact ফর্ম ও ভলান্টিয়ার আবেদন',
    })
  if (newMembers !== null)
    stats.push({
      label: 'নতুন মেম্বার (৭ দিনে)',
      value: newMembers,
      href: `${ADMIN}/collections/users?sort=-createdAt`,
      tone: 'green',
      icon: UserPlus,
      hint: 'গত এক সপ্তাহে যোগ দিয়েছেন',
    })
  if (upcoming !== null)
    stats.push({
      label: 'সামনের মজলিস',
      value: upcoming,
      href: `${ADMIN}/collections/events?sort=startsAt`,
      tone: 'slate',
      icon: CalendarDays,
      hint: 'Publish করা, তারিখ সামনে',
    })

  const actions = [
    can('articles', 'create') && {
      label: 'নতুন আর্টিকেল',
      href: `${ADMIN}/collections/articles/create`,
      icon: FileText,
    },
    can('questions', 'read') && {
      label: 'প্রশ্নের উত্তর দিন',
      href: `${ADMIN}/collections/questions?where[moderation][equals]=pending`,
      icon: MessageCircleQuestion,
    },
    can('events', 'create') && {
      label: 'নতুন মজলিস',
      href: `${ADMIN}/collections/events/create`,
      icon: CalendarDays,
    },
    can('videos', 'create') && {
      label: 'নতুন ভিডিও',
      href: `${ADMIN}/collections/videos/create`,
      icon: Video,
    },
    can('media', 'create') && {
      label: 'ছবি বা ফাইল আপলোড',
      href: `${ADMIN}/collections/media/create`,
      icon: UploadCloud,
    },
    isModerator && {
      label: 'ফোরাম মডারেশন',
      href: '/forum/moderation',
      icon: Flag,
      external: true,
    },
  ].filter(Boolean) as { label: string; href: string; icon: typeof FileText; external?: boolean }[]

  const roleNames = roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')
  const today = new Intl.DateTimeFormat('bn-BD', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Dhaka',
  }).format(new Date())

  return (
    <div className="rh-dash gutter--left gutter--right">
      <header className="rh-dash__hero">
        <div>
          <p className="rh-dash__eyebrow">{today}</p>
          <h1 className="rh-dash__title">
            {greeting()}, {user.name?.split(' ')[0] || 'আপনাকে'}
          </h1>
          <p className="rh-dash__sub">
            আপনি <span className="rh-dash__role">{roleNames}</span> হিসেবে আছেন। যেকোনো মেনু বা কাজ
            খুঁজতে <kbd>Ctrl</kbd> + <kbd>K</kbd> চাপুন।
          </p>
        </div>
        <a className="rh-dash__site" href="/" target="_blank" rel="noopener">
          সাইট দেখুন <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </header>

      {stats.length ? (
        <section aria-label="এক নজরে" className="rh-dash__stats">
          {stats.map((s) => (
            <a
              key={s.label}
              href={s.href}
              className={`rh-stat rh-stat--${s.tone}`}
              {...(s.href.startsWith('/admin') ? {} : { target: '_blank', rel: 'noopener' })}
            >
              <span className="rh-stat__icon">
                <s.icon size={18} aria-hidden="true" />
              </span>
              <span className="rh-stat__value">{bn(s.value)}</span>
              <span className="rh-stat__label">{s.label}</span>
              <span className="rh-stat__hint">{s.hint}</span>
            </a>
          ))}
        </section>
      ) : null}

      {actions.length ? (
        <section aria-labelledby="rh-actions" className="rh-dash__section">
          <h2 id="rh-actions" className="rh-dash__h2">
            শর্টকাট
          </h2>
          <div className="rh-dash__actions">
            {actions.map((a) => (
              <a
                key={a.label}
                href={a.href}
                className="rh-action"
                {...(a.external ? { target: '_blank', rel: 'noopener' } : {})}
              >
                <a.icon size={16} aria-hidden="true" />
                {a.label}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <ReviewQueue payload={payload} user={user} />

      <section aria-labelledby="rh-menus" className="rh-dash__section">
        <h2 id="rh-menus" className="rh-dash__h2">
          সব মেনু
        </h2>
        <div className="rh-dash__groups">
          {navGroups.map((group) => (
            <div key={group.label} className="rh-group">
              <h3 className="rh-group__title">{group.label}</h3>
              <ul className="rh-group__list">
                {group.entities.map((e) => {
                  const href = `${ADMIN}/${e.type}/${e.slug}`
                  const creatable = e.type === 'collections' && can(e.slug, 'create')
                  return (
                    <li key={e.slug} className="rh-group__item">
                      <a href={href} className="rh-group__link">
                        {getTranslation(e.label as never, i18n)}
                      </a>
                      {creatable ? (
                        <a
                          href={`${href}/create`}
                          className="rh-group__add"
                          aria-label={`নতুন ${getTranslation(e.label as never, i18n)}`}
                          title="নতুন যোগ করুন"
                        >
                          <Plus size={14} aria-hidden="true" />
                        </a>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
