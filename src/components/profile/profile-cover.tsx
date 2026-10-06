import Link from 'next/link'

import { cn } from '@/lib/utils'
import type { ProfileCover as Cover } from '@/server/queries/profile-cover'

/**
 * The band at the top of a profile. It carries the ayah, hadith or words the owner chose; without
 * one it is a quiet patterned band.
 */
export function ProfileCover({
  cover,
  tone = 'teal',
}: {
  cover: Cover | null
  tone?: 'teal' | 'gold'
}) {
  return (
    <div
      className={cn(
        'cover-band',
        tone === 'gold' && 'cover-band--gold',
        cover && 'cover-band--content',
      )}
    >
      <div className="rh-pattern" aria-hidden="true" />
      {cover ? (
        <figure className="cover-quote rh-container">
          {cover.arabic ? (
            <p className="cover-quote__ar" lang="ar" dir="rtl">
              {cover.arabic}
            </p>
          ) : null}
          <blockquote className="cover-quote__text">“{cover.text}”</blockquote>
          {cover.reference ? (
            <figcaption className="cover-quote__ref">
              {cover.href ? <Link href={cover.href}>{cover.reference}</Link> : cover.reference}
            </figcaption>
          ) : null}
        </figure>
      ) : null}
    </div>
  )
}
