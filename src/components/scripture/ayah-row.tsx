import { Fragment } from 'react'

import { bn } from '@/lib/format'
import { ayahReference, surahPath } from '@/lib/quran-meta'
import { cn } from '@/lib/utils'
import type { AyahView } from '@/server/queries/scripture'

import { AyahActions } from './ayah-actions'

/**
 * One ayah of a surah page, with a juz marker when a new juz starts. Rendered on the server for the
 * first block and in the browser for blocks added by "load more", so both look the same.
 */
export function AyahRow({
  a,
  prevJuz,
  focus,
}: {
  a: AyahView
  /** juz of the ayah shown just before this one (null for the first on the page) */
  prevJuz: number | null
  focus?: boolean
}) {
  const reference = ayahReference(a.surah, a.ayah)
  const newJuz = prevJuz !== null && a.juz !== null && a.juz !== prevJuz
  return (
    <Fragment>
      {newJuz ? (
        <li className="juz-marker" aria-hidden="true">
          পারা {bn(a.juz!)}
        </li>
      ) : null}
      <li id={`ayah-${a.ayah}`} className={cn('ayah-row', focus && 'is-focus')}>
        <span className="ayah-row__num" aria-label={`আয়াত ${bn(a.ayah)}`}>
          {bn(a.ayah)}
        </span>
        <p className="ar" lang="ar" dir="rtl">
          {a.arabic}
        </p>
        <p className="ayah-row__tr">{a.translation}</p>
        <AyahActions
          id={a.id}
          arabic={a.arabic}
          translation={a.translation}
          reference={reference}
          path={surahPath(a.surah, a.ayah)}
        />
      </li>
    </Fragment>
  )
}
