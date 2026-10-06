'use client'

import { IconChevronDown } from '@/components/icons'
import { useState } from 'react'

import { apiFetch } from '@/lib/api-client'
import { bn } from '@/lib/format'
import { AYAH_PAGE, surahPath } from '@/lib/quran-meta'
import type { AyahView } from '@/server/queries/scripture'

import { AyahRow } from './ayah-row'

type Block = { ayahs: AyahView[]; nextFrom: number | null }

/**
 * "Load more" under a surah page: adds the next block of ayahs in place. The button is a real link to
 * that block's own page, so search engines and readers without JavaScript can still go on.
 */
export function MoreAyahs({
  surah,
  from,
  total,
  lastJuz,
}: {
  surah: number
  /** first ayah not shown yet */
  from: number
  total: number
  lastJuz: number | null
}) {
  const [ayahs, setAyahs] = useState<AyahView[]>([])
  const [next, setNext] = useState<number | null>(from <= total ? from : null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  async function load(e: React.MouseEvent) {
    // a plain click loads in place; ctrl/cmd-click still opens the block's page
    if (e.metaKey || e.ctrlKey || e.shiftKey) return
    e.preventDefault()
    if (next === null || loading) return
    setLoading(true)
    setFailed(false)
    try {
      const block = await apiFetch<Block>(`/quran/surahs/${surah}?from=${next}&limit=${AYAH_PAGE}`)
      setAyahs((list) => [...list, ...block.ayahs])
      setNext(block.nextFrom)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  const end = next === null ? total : next - 1
  return (
    <>
      {ayahs.length ? (
        <ol className="ayah-list list-reset" start={from}>
          {ayahs.map((a, i) => (
            <AyahRow key={a.id} a={a} prevJuz={i === 0 ? lastJuz : (ayahs[i - 1]?.juz ?? null)} />
          ))}
        </ol>
      ) : null}
      {next !== null ? (
        <div className="more-ayahs">
          <p className="t-small t-muted" role="status">
            {bn(total)}টির মধ্যে {bn(end)}টি আয়াত দেখানো হয়েছে
          </p>
          <a
            href={surahPath(surah, next)}
            className="btn btn-secondary"
            onClick={load}
            aria-disabled={loading}
          >
            {loading ? 'লোড হচ্ছে…' : 'আরও আয়াত দেখুন'}
            {loading ? null : <IconChevronDown className="ic" aria-hidden="true" />}
          </a>
          {failed ? (
            <p className="t-small" style={{ color: 'var(--rh-danger, #b91c1c)' }}>
              লোড করা যায়নি। আবার চেষ্টা করুন।
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
