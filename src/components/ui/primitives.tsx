import { IconChevronBack, IconChevronNext } from '@/components/icons'
import Link from 'next/link'

import { bn } from '@/lib/format'
import { cn } from '@/lib/utils'

/* ---------------- section heads ---------------- */

export function Eyebrow({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <span className="eyebrow" style={style}>
      {children}
    </span>
  )
}

export function SectionHead({
  eyebrow,
  title,
  lead,
  id,
  align = 'center',
  className,
  style,
  titleClass = 't-h2',
}: {
  eyebrow?: string
  title: React.ReactNode
  lead?: React.ReactNode
  id?: string
  align?: 'center' | 'left'
  className?: string
  style?: React.CSSProperties
  titleClass?: string
}) {
  return (
    <div
      className={cn('section-head', align === 'left' && 'section-head--left', className)}
      style={style}
    >
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h2 id={id} className={titleClass}>
        {title}
      </h2>
      {lead ? <p className="lead">{lead}</p> : null}
    </div>
  )
}

/** Left-aligned head with an action link on the right (`.split-head`). */
export function SplitHead({
  children,
  action,
  className,
}: {
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('split-head', className)}>
      <div className="section-head section-head--left" style={{ marginBottom: 0 }}>
        {children}
      </div>
      {action}
    </div>
  )
}

/* ---------------- breadcrumbs ---------------- */

export type Crumb = { label: string; href?: string }

export function Breadcrumbs({
  items,
  className,
  style,
  linkStyle,
}: {
  items: Crumb[]
  className?: string
  style?: React.CSSProperties
  linkStyle?: React.CSSProperties
}) {
  return (
    <nav aria-label="ব্রেডক্রাম্ব">
      <ol className={cn('crumbs', className)} style={style}>
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <li key={`${item.label}-${i}`} style={{ display: 'contents' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {item.href && !last ? (
                  <Link href={item.href} style={linkStyle}>
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={last ? 'page' : undefined}>{item.label}</span>
                )}
                {!last ? <IconChevronNext className="ic" aria-hidden="true" /> : null}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/* ---------------- page hero ---------------- */

export function PageHero({
  crumbs,
  title,
  lead,
  children,
  id,
  narrow,
  style,
  containerStyle,
  aside,
}: {
  crumbs?: Crumb[]
  title: React.ReactNode
  lead?: React.ReactNode
  children?: React.ReactNode
  id?: string
  narrow?: boolean
  style?: React.CSSProperties
  containerStyle?: React.CSSProperties
  /** Shown beside the title on wide screens (stats, actions). */
  aside?: React.ReactNode
}) {
  const heading = (
    <>
      <h1 id={id} className="t-h1">
        {title}
      </h1>
      {lead ? <p className="lead">{lead}</p> : null}
    </>
  )
  return (
    <section className="page-hero" aria-labelledby={id} style={style}>
      <div className="rh-pattern" aria-hidden="true" />
      <div className={narrow ? 'rh-container-narrow' : 'rh-container'} style={containerStyle}>
        {crumbs ? <Breadcrumbs items={crumbs} /> : null}
        {aside ? (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 24,
            }}
          >
            <div>{heading}</div>
            {aside}
          </div>
        ) : (
          heading
        )}
        {children}
      </div>
    </section>
  )
}

/* ---------------- chips ---------------- */

export function Chip({
  active,
  children,
  onClick,
  disabled,
  style,
  className,
}: {
  active?: boolean
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  style?: React.CSSProperties
  className?: string
}) {
  return (
    <button
      type="button"
      className={cn('chip', active && 'is-active', className)}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  )
}

export function ChipLink({
  href,
  children,
  active,
}: {
  href: string
  children: React.ReactNode
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn('chip', active && 'is-active')}
      style={{ minHeight: 36, textDecoration: 'none' }}
    >
      {children}
    </Link>
  )
}

/* ---------------- pager ---------------- */

/** Page numbers with gaps, e.g. 1 2 3 … 53 */
export function pageWindow(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set([1, total, current, current - 1, current + 1])
  if (current <= 3) [2, 3, 4].forEach((n) => set.add(n))
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((n) => set.add(n))
  const pages = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  const out: (number | 'gap')[] = []
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1]! > 1) out.push('gap')
    out.push(p)
  })
  return out
}

export function Pager({
  page,
  totalPages,
  hrefFor,
  onPage,
}: {
  page: number
  totalPages: number
  hrefFor?: (page: number) => string
  onPage?: (page: number) => void
}) {
  if (totalPages <= 1) return null
  const item = (p: number, label: React.ReactNode, aria?: string) =>
    onPage ? (
      <a
        key={`${aria ?? p}`}
        href={hrefFor ? hrefFor(p) : '#'}
        aria-label={aria}
        onClick={(e) => {
          e.preventDefault()
          onPage(p)
        }}
      >
        {label}
      </a>
    ) : (
      <Link key={`${aria ?? p}`} href={hrefFor!(p)} aria-label={aria} scroll>
        {label}
      </Link>
    )
  return (
    <nav aria-label="পৃষ্ঠা">
      <div className="pager">
        {page > 1
          ? item(page - 1, <IconChevronBack className="ic" aria-hidden="true" />, 'আগের পৃষ্ঠা')
          : null}
        {pageWindow(page, totalPages).map((p, i) =>
          p === 'gap' ? (
            <span key={`gap-${i}`} className="is-gap">
              …
            </span>
          ) : p === page ? (
            <span key={p} className="is-current" aria-current="page">
              {bn(p)}
            </span>
          ) : (
            item(p, bn(p))
          ),
        )}
        {page < totalPages
          ? item(page + 1, <IconChevronNext className="ic" aria-hidden="true" />, 'পরের পৃষ্ঠা')
          : null}
      </div>
    </nav>
  )
}

/* ---------------- feedback ---------------- */

export function EmptyState({
  icon,
  title,
  text,
  children,
  tone,
  style,
}: {
  icon: React.ReactNode
  title: React.ReactNode
  text?: React.ReactNode
  children?: React.ReactNode
  tone?: 'success'
  style?: React.CSSProperties
}) {
  return (
    <div className="empty" role={tone === 'success' ? 'status' : undefined} style={style}>
      <span
        className="empty__icon"
        style={
          tone === 'success'
            ? { background: 'var(--rh-success-soft)', color: 'var(--rh-success)' }
            : undefined
        }
      >
        {icon}
      </span>
      <h2 className="t-h4">{title}</h2>
      {text ? (
        <p className="t-small t-muted" style={{ maxWidth: 380 }}>
          {text}
        </p>
      ) : null}
      {children ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {children}
        </div>
      ) : null}
    </div>
  )
}

export function Skeleton({
  style,
  className,
}: {
  style?: React.CSSProperties
  className?: string
}) {
  return <span className={cn('sk', className)} style={style} aria-hidden="true" />
}

export function Progress({
  value,
  gold,
  label,
  style,
}: {
  value: number
  gold?: boolean
  label: string
  style?: React.CSSProperties
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      className={cn('progress', gold && 'progress--gold')}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
      style={style}
    >
      <span style={{ width: `${v}%` }} />
    </div>
  )
}

/* ---------------- misc ---------------- */

export function DateTile({
  day,
  month,
  weekday,
  size = 'md',
  style,
}: {
  day: string
  month: string
  weekday?: string
  size?: 'sm' | 'md' | 'lg' | 'xs' | 'auto'
  style?: React.CSSProperties
}) {
  if (size === 'auto') {
    return (
      <div className="date-tile" aria-hidden="true" style={style}>
        <span className="date-tile__day">{day}</span>
        <span className="date-tile__mon">{month}</span>
        {weekday ? <span className="t-caption t-muted">{weekday}</span> : null}
      </div>
    )
  }
  const dims = {
    xs: { width: 60, height: 64, font: 22, mon: 12 },
    sm: { width: 68, height: 72, font: 24, mon: 13 },
    md: { width: 76, height: 84, font: 28, mon: 13 },
    lg: { width: 104, height: 112, font: 40, mon: 13 },
  }[size]
  return (
    <div
      className="date-tile"
      aria-hidden="true"
      style={{ width: dims.width, height: dims.height, flex: 'none', ...style }}
    >
      <span className="date-tile__day" style={{ fontSize: dims.font }}>
        {day}
      </span>
      <span className="date-tile__mon" style={{ fontSize: dims.mon }}>
        {month}
      </span>
      {weekday ? <span className="t-caption t-muted">{weekday}</span> : null}
    </div>
  )
}

export function IconTile({
  children,
  teal,
  size,
  style,
}: {
  children: React.ReactNode
  teal?: boolean
  size?: number
  style?: React.CSSProperties
}) {
  return (
    <span
      className={cn('icon-tile', teal && 'icon-tile--teal')}
      style={{ ...(size ? { width: size, height: size } : {}), ...style }}
    >
      {children}
    </span>
  )
}

export function MetaDot() {
  return <span className="meta-dot" aria-hidden="true" />
}

export function TagRow({ tags }: { tags: string[] }) {
  if (!tags.length) return null
  return (
    <div className="tag-row">
      {tags.map((t) => (
        <span key={t} className="tag">
          {t}
        </span>
      ))}
    </div>
  )
}
