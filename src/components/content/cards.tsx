import {
  IconBalance,
  IconBook,
  IconClock,
  IconColumns,
  IconExplore,
  IconGrowth,
  IconHeart,
  IconHome,
  IconInstitution,
  IconLocation,
  IconMorning,
  IconNext,
  IconPlay,
  IconSpeaker,
  IconUsers,
  IconVideo,
  IconWallet,
} from '@/components/icons'
import Link from 'next/link'

import { BrandMark } from '@/components/icons/brand-mark'
import { Badge, LevelBadge, ModeBadge, ReviewedBadge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { DateTile } from '@/components/ui/primitives'
import { UserAvatar } from '@/components/ui/user-avatar'
import { districtLabel } from '@/lib/districts'
import {
  bn,
  formatDay,
  formatMonth,
  formatTime,
  formatWeekday,
  formatYear,
  readingTimeLabel,
} from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ArticleCardView, EventCardView, PersonRef } from '@/server/queries/types'

/* ---------------- category icon ---------------- */

const CATEGORY_ICON = {
  compass: IconExplore,
  scale: IconBalance,
  sunrise: IconMorning,
  sprout: IconGrowth,
  heart: IconHeart,
  wallet: IconWallet,
  users: IconUsers,
  book: IconBook,
  columns: IconColumns,
  home: IconHome,
  landmark: IconInstitution,
  mic: IconSpeaker,
} as const

export function CategoryIcon({
  icon,
  className = 'ic ic-lg',
}: {
  icon?: string | null
  className?: string
}) {
  const Icon = CATEGORY_ICON[(icon ?? 'book') as keyof typeof CATEGORY_ICON] ?? IconBook
  return <Icon className={className} aria-hidden="true" />
}

/* ---------------- person ---------------- */

export function PersonAvatar({
  person,
  size = 'md',
  ring,
}: {
  person: Pick<PersonRef, 'name' | 'tone'> | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  ring?: boolean
}) {
  return (
    <UserAvatar
      name={person?.name}
      tone={person?.tone === 'gold' ? 'gold' : 'teal'}
      size={size}
      ring={ring}
    />
  )
}

export function PersonRow({
  person,
  caption,
  href,
}: {
  person: PersonRef
  caption: string
  href?: string
}) {
  const name = href ? (
    <Link href={href} style={{ color: 'inherit', textDecoration: 'none' }}>
      {person.name}
    </Link>
  ) : (
    person.name
  )
  return (
    <div className="person-row">
      <PersonAvatar person={person} />
      <div>
        <span>{caption}</span>
        <strong>{name}</strong>
      </div>
    </div>
  )
}

export function personHref(person: Pick<PersonRef, 'slug' | 'kinds'>): string {
  return person.kinds?.includes('scholar') ? `/scholars/${person.slug}` : `/speakers/${person.slug}`
}

/* ---------------- article ---------------- */

const TINT_CLASS = {
  sage: '',
  gold: 'article-card__media--gold',
  teal: 'article-card__media--teal',
} as const

/** Design `.article-card`; `compact` drops the media band (related articles). */
export function ArticleCard({
  article,
  compact,
  mediaHeight,
  showLevel,
  className,
  titleSize,
}: {
  article: ArticleCardView
  compact?: boolean
  mediaHeight?: number
  showLevel?: boolean
  className?: string
  titleSize?: number
}) {
  const href = `/ilm/${article.slug}`
  return (
    <article className={cn('card card-hover article-card', className)}>
      {!compact ? (
        <div
          className={cn('article-card__media', TINT_CLASS[article.tint] ?? '')}
          style={mediaHeight ? { height: mediaHeight } : undefined}
        >
          <div className="rh-pattern" aria-hidden="true" />
          <BrandMark />
        </div>
      ) : null}
      <div className="article-card__body" style={mediaHeight ? { padding: 20 } : undefined}>
        <div className="article-card__meta">
          {article.category ? <Badge variant="cat">{article.category.name}</Badge> : null}
          {showLevel ? <LevelBadge level={article.level} /> : null}
          <span>
            {compact || showLevel
              ? `${bn(article.readingTime)} মিনিট`
              : readingTimeLabel(article.readingTime)}
          </span>
        </div>
        <h3 className="article-card__title" style={titleSize ? { fontSize: titleSize } : undefined}>
          {/* stretched over the whole card (ruhama.css), so a click anywhere opens the article */}
          <Link href={href} className="article-card__link">
            {article.title}
          </Link>
        </h3>
        {article.author ? (
          <div className="article-card__author">
            {article.author.slug ? (
              <Link
                href={personHref(article.author)}
                target="_blank"
                rel="noopener"
                className="article-card__person"
                aria-label={`${article.author.name}: প্রোফাইল (নতুন ট্যাবে)`}
              >
                <PersonAvatar person={article.author} size="sm" />
                <span>{article.author.name}</span>
              </Link>
            ) : (
              <span className="article-card__person">
                <PersonAvatar person={article.author} size="sm" />
                <span>{article.author.name}</span>
              </span>
            )}
            {article.reviewed ? <ReviewedBadge /> : null}
          </div>
        ) : null}
      </div>
    </article>
  )
}

/* ---------------- category tile ---------------- */

export function CategoryTile({
  name,
  icon,
  href,
  foot,
  all,
}: {
  name: string
  icon?: string | null
  href: string
  foot: string
  all?: boolean
}) {
  return (
    <Link href={href} className={cn('card card-hover cat-tile', all && 'cat-tile--all')}>
      <span className={cn('icon-tile', !all && 'icon-tile--teal')}>
        <CategoryIcon icon={icon} />
      </span>
      <h3>{name}</h3>
      <div className="cat-tile__foot">
        <span>{foot}</span>
        <IconNext
          className="ic"
          aria-hidden="true"
          style={all ? { opacity: 1, transform: 'none' } : undefined}
        />
      </div>
    </Link>
  )
}

/* ---------------- events ---------------- */

export function eventPlace(
  e: Pick<EventCardView, 'mode' | 'venueName' | 'district'> & { ended?: boolean },
): string {
  if (e.mode === 'online') return e.ended ? 'অনলাইন লাইভ সেশন' : 'লাইভ সেশন, লিংক রেজিস্ট্রেশনের পর'
  return [e.venueName, districtLabel(e.district)].filter(Boolean).join(', ')
}

export function eventWhen(e: Pick<EventCardView, 'startsAt' | 'timeLabel'>): string {
  return `${formatWeekday(e.startsAt)}, ${e.timeLabel || formatTime(e.startsAt)}`
}

/** Horizontal event row used on the home page (`.event-row`). */
export function EventRow({ event }: { event: EventCardView }) {
  const href = `/events/${event.slug}`
  return (
    <article className={cn('card card-hover event-row', event.ended && 'event-row--ended')}>
      <DateTile
        size="auto"
        day={formatDay(event.startsAt)}
        month={formatMonth(event.startsAt)}
        weekday={event.ended ? formatYear(event.startsAt) : undefined}
      />
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          <ModeBadge mode={event.mode} />
          {event.ended ? <EndedBadge recap={event.hasRecap} /> : null}
        </div>
        <h3>
          <Link href={href} style={{ color: 'inherit', textDecoration: 'none' }}>
            {event.title}
          </Link>
        </h3>
        <div className="event-meta">
          <span>
            <IconClock className="ic" aria-hidden="true" />
            {eventWhen(event)}
          </span>
          <span>
            {event.mode === 'online' ? (
              <IconVideo className="ic" aria-hidden="true" />
            ) : (
              <IconLocation className="ic" aria-hidden="true" />
            )}
            {eventPlace(event)}
          </span>
        </div>
      </div>
      {event.ended ? (
        <ButtonLink href={event.hasRecap ? `${href}#recap` : href} variant="ghost">
          {event.hasRecap ? 'কী হয়েছিল দেখুন' : 'বিস্তারিত'}
        </ButtonLink>
      ) : (
        <ButtonLink href={href} variant="secondary">
          রেজিস্টার করুন
        </ButtonLink>
      )}
    </article>
  )
}

/** "Over" on a মজলিস card, and whether photos and recordings were added. */
export function EndedBadge({ recap }: { recap?: boolean }) {
  return (
    <>
      <Badge variant="neutral">শেষ হয়েছে</Badge>
      {recap ? (
        <Badge variant="cat">
          <IconPlay className="ic" aria-hidden="true" />
          ছবি ও ভিডিও
        </Badge>
      ) : null}
    </>
  )
}

/* ---------------- value card ---------------- */

export function ValueCard({
  icon,
  title,
  text,
  className,
}: {
  icon: React.ReactNode
  title: string
  text: string
  className?: string
}) {
  return (
    <article className={cn('card card-hover value-card', className)}>
      <span className="icon-tile">{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  )
}
