import {
  ArrowRight,
  BookOpen,
  Clock,
  Columns2,
  Compass,
  Heart,
  House,
  Landmark,
  MapPin,
  Mic,
  Scale,
  Sprout,
  Sunrise,
  Users,
  Video,
  Wallet,
} from 'lucide-react'
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
  readingTimeLabel,
} from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ArticleCardView, EventCardView, PersonRef } from '@/server/queries/types'

/* ---------------- category icon ---------------- */

const CATEGORY_ICON = {
  compass: Compass,
  scale: Scale,
  sunrise: Sunrise,
  sprout: Sprout,
  heart: Heart,
  wallet: Wallet,
  users: Users,
  book: BookOpen,
  columns: Columns2,
  home: House,
  landmark: Landmark,
  mic: Mic,
} as const

export function CategoryIcon({
  icon,
  className = 'ic ic-lg',
}: {
  icon?: string | null
  className?: string
}) {
  const Icon = CATEGORY_ICON[(icon ?? 'book') as keyof typeof CATEGORY_ICON] ?? BookOpen
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
          <Link href={href}>{article.title}</Link>
        </h3>
        {article.author ? (
          <div className="article-card__author">
            <PersonAvatar person={article.author} size="sm" />
            <span style={{ flex: 1 }}>{article.author.name}</span>
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
        <ArrowRight
          className="ic"
          aria-hidden="true"
          style={all ? { opacity: 1, transform: 'none' } : undefined}
        />
      </div>
    </Link>
  )
}

/* ---------------- events ---------------- */

export function eventPlace(e: Pick<EventCardView, 'mode' | 'venueName' | 'district'>): string {
  if (e.mode === 'online') return 'লাইভ সেশন, লিংক রেজিস্ট্রেশনের পর'
  return [e.venueName, districtLabel(e.district)].filter(Boolean).join(', ')
}

export function eventWhen(e: Pick<EventCardView, 'startsAt' | 'timeLabel'>): string {
  return `${formatWeekday(e.startsAt)}, ${e.timeLabel || formatTime(e.startsAt)}`
}

/** Horizontal event row used on the home page (`.event-row`). */
export function EventRow({ event }: { event: EventCardView }) {
  const href = `/events/${event.slug}`
  return (
    <article className="card card-hover event-row">
      <DateTile size="auto" day={formatDay(event.startsAt)} month={formatMonth(event.startsAt)} />
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          <ModeBadge mode={event.mode} />
        </div>
        <h3>
          <Link href={href} style={{ color: 'inherit', textDecoration: 'none' }}>
            {event.title}
          </Link>
        </h3>
        <div className="event-meta">
          <span>
            <Clock className="ic" aria-hidden="true" />
            {eventWhen(event)}
          </span>
          <span>
            {event.mode === 'online' ? (
              <Video className="ic" aria-hidden="true" />
            ) : (
              <MapPin className="ic" aria-hidden="true" />
            )}
            {eventPlace(event)}
          </span>
        </div>
      </div>
      <ButtonLink href={href} variant="secondary">
        রেজিস্টার করুন
      </ButtonLink>
    </article>
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
