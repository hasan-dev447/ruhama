import { BookOpen, Quote } from 'lucide-react'
import Link from 'next/link'

import { BrandMark } from '@/components/icons/brand-mark'
import { GradeBadge, RefBadge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/** Quran verse card (`.ayah-card`) with the ornamental mark. */
export function AyahCard({
  arabic,
  translation,
  reference,
  compact,
  eyebrow,
  actions,
  className,
  style,
  translationStyle,
  labelledBy,
}: {
  arabic?: string | null
  translation: string
  reference: string
  compact?: boolean
  eyebrow?: React.ReactNode
  actions?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  translationStyle?: React.CSSProperties
  labelledBy?: string
}) {
  return (
    <article
      className={cn('ayah-card', compact && 'ayah-card--compact', className)}
      style={style}
      aria-labelledby={labelledBy}
    >
      <BrandMark className="ayah-card__orn" />
      {eyebrow}
      {arabic ? (
        <p className="ar" lang="ar" dir="rtl">
          {arabic}
        </p>
      ) : null}
      <p className="ayah-card__tr" style={translationStyle}>
        “{translation}”
      </p>
      <RefBadge>{reference}</RefBadge>
      {actions}
    </article>
  )
}

/** Hadith card (`.hadith-card`) with narrator, source and grade footer. */
export function HadithCard({
  arabic,
  text,
  narrator,
  source,
  grade,
  gradeNote,
  eyebrow,
  showQuote = true,
  className,
  style,
  textStyle,
  arabicStyle,
  href,
  labelledBy,
}: {
  arabic?: string | null
  text: string
  narrator?: string | null
  source?: string | null
  grade?: string | null
  gradeNote?: string | null
  eyebrow?: React.ReactNode
  showQuote?: boolean
  className?: string
  style?: React.CSSProperties
  textStyle?: React.CSSProperties
  arabicStyle?: React.CSSProperties
  href?: string
  labelledBy?: string
}) {
  return (
    <article className={cn('hadith-card', className)} style={style} aria-labelledby={labelledBy}>
      {eyebrow ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {eyebrow}
          <Quote className="hadith-card__quote" aria-hidden="true" />
        </div>
      ) : showQuote ? (
        <Quote className="hadith-card__quote" aria-hidden="true" />
      ) : null}
      {arabic ? (
        <p className="ar" lang="ar" dir="rtl" style={arabicStyle}>
          {arabic}
        </p>
      ) : null}
      <p className="hadith-card__text" style={textStyle}>
        “{text}”
      </p>
      <div className="hadith-card__foot" style={{ marginTop: 'auto' }}>
        {narrator ? <span>{narrator}</span> : null}
        {narrator && source ? <span className="meta-dot" aria-hidden="true" /> : null}
        {source ? (
          href ? (
            <Link href={href} style={{ color: 'inherit' }}>
              {source}
            </Link>
          ) : (
            <span>{source}</span>
          )
        ) : null}
        <GradeBadge grade={grade} note={gradeNote} style={{ marginLeft: 'auto' }} />
      </div>
    </article>
  )
}

export type DalilItem = {
  type: string
  citation: string
  note?: string | null
  url?: string | null
}

const DALIL_LABEL: Record<string, string> = {
  quran: 'কুরআন',
  hadith: 'হাদিস',
  ikhtilaf: 'মতপার্থক্য',
  athar: 'আসার',
  book: 'গ্রন্থ',
  other: 'অন্যান্য',
}

/** References box (`.dalil-box`). */
export function DalilBox({
  title = 'দলিল ও তথ্যসূত্র',
  items,
  id,
}: {
  title?: string
  items: DalilItem[]
  id: string
}) {
  if (!items.length) return null
  return (
    <aside className="dalil-box" aria-labelledby={id}>
      <div className="dalil-box__head" id={id}>
        <BookOpen className="ic" aria-hidden="true" />
        {title}
      </div>
      <ul className="dalil-list">
        {items.map((item, i) => {
          const body = item.note ? `${item.citation} · ${item.note}` : item.citation
          return (
            <li key={`${item.citation}-${i}`}>
              <span className="dalil-type">{DALIL_LABEL[item.type] ?? item.type}</span>
              <span>
                {item.url ? (
                  <Link className="link" href={item.url}>
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

export function DalilTag({ children }: { children: React.ReactNode }) {
  return <span className="dalil-type">{children}</span>
}
