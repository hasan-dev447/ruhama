import { IconCheck, IconLocation, IconVerified, IconVideo } from '@/components/icons'

import { cn } from '@/lib/utils'

type Variant =
  | 'cat'
  | 'reviewed'
  | 'level'
  | 'sahih'
  | 'hasan'
  | 'online'
  | 'live'
  | 'neutral'
  | 'warning'
  | 'verified'
  | 'plain'

export function Badge({
  variant = 'plain',
  className,
  children,
  style,
  title,
}: {
  variant?: Variant
  className?: string
  children: React.ReactNode
  style?: React.CSSProperties
  title?: string
}) {
  return (
    <span
      className={cn('badge', variant !== 'plain' && `badge-${variant}`, className)}
      style={style}
      title={title}
    >
      {children}
    </span>
  )
}

export function ReviewedBadge({
  label = 'রিভিউকৃত',
  style,
}: {
  label?: string
  style?: React.CSSProperties
}) {
  return (
    <Badge variant="reviewed" style={style}>
      <IconVerified className="ic" aria-hidden="true" />
      {label}
    </Badge>
  )
}

export function RefBadge({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span className={cn('ref-badge', className)} style={style}>
      {children}
    </span>
  )
}

const GRADE_LABEL: Record<string, string> = {
  sahih: 'সহিহ',
  hasan: 'হাসান',
  daif: 'যঈফ',
  mawdu: 'মাওযু',
}

/** Hadith grade. `note` overrides the label, e.g. “ইমাম তিরমিযী: হাসান”. */
export function GradeBadge({
  grade,
  note,
  style,
}: {
  grade?: string | null
  note?: string | null
  style?: React.CSSProperties
}) {
  if (!grade || grade === 'unknown')
    return note ? (
      <Badge variant="neutral" style={style}>
        {note}
      </Badge>
    ) : null
  const label = note || GRADE_LABEL[grade] || grade
  if (grade === 'sahih')
    return (
      <Badge variant="sahih" style={style}>
        <IconCheck className="ic" aria-hidden="true" />
        {label}
      </Badge>
    )
  if (grade === 'hasan')
    return (
      <Badge variant="hasan" style={style}>
        {label}
      </Badge>
    )
  return (
    <Badge variant="warning" style={style}>
      {label}
    </Badge>
  )
}

export function ModeBadge({
  mode,
  style,
}: {
  mode: 'online' | 'in_person' | string
  style?: React.CSSProperties
}) {
  return mode === 'online' ? (
    <Badge variant="online" style={style}>
      <IconVideo className="ic" aria-hidden="true" />
      অনলাইন
    </Badge>
  ) : (
    <Badge variant="live" style={style}>
      <IconLocation className="ic" aria-hidden="true" />
      সরাসরি
    </Badge>
  )
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: 'প্রাথমিক',
  intermediate: 'মধ্যম',
  advanced: 'উচ্চ',
}
export const levelLabel = (level?: string | null) => LEVEL_LABEL[level ?? ''] ?? ''

export function LevelBadge({ level }: { level?: string | null }) {
  if (!level) return null
  return <Badge variant="level">{levelLabel(level)}</Badge>
}
