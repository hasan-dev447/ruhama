'use client'

import { IconBook } from '@/components/icons'
import Link from 'next/link'
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'

import { Chip, EmptyState } from '@/components/ui/primitives'
import { UrlSearchBox } from '@/components/ui/url-search'
import { bn } from '@/lib/format'
import { surahPath } from '@/lib/quran-meta'
import type { SurahView } from '@/server/queries/scripture'

const TYPES = [
  { value: 'all', label: 'সব সূরা' },
  { value: 'meccan', label: 'মাক্কী' },
  { value: 'medinan', label: 'মাদানী' },
] as const

const parsers = {
  q: parseAsString.withDefault(''),
  type: parseAsStringLiteral(['all', 'meccan', 'medinan'] as const).withDefault('all'),
}

const toAscii = (s: string) => s.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)))

export function SurahBrowser({ surahs }: { surahs: SurahView[] }) {
  const [state, setState] = useQueryStates(parsers, {
    history: 'replace',
    shallow: true,
    scroll: false,
  })
  const q = toAscii(state.q.trim().toLowerCase())
  const shown = surahs.filter(
    (s) =>
      (state.type === 'all' || s.revelation === state.type) &&
      (!q ||
        String(s.number) === q ||
        s.nameBangla.toLowerCase().includes(q) ||
        s.nameLatin.includes(q) ||
        s.nameArabic.includes(state.q.trim())),
  )
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <UrlSearchBox
          id="quran-search"
          label="সূরা খুঁজুন"
          placeholder="সূরার নাম বা নম্বর, যেমন: কাহফ, ১৮"
          wrapStyle={{ flex: '1 1 300px', maxWidth: 480 }}
        />
        <div className="chip-row" role="group" aria-label="অবতরণের স্থান">
          {TYPES.map((t) => (
            <Chip
              key={t.value}
              active={state.type === t.value}
              onClick={() => void setState({ type: t.value === 'all' ? null : t.value })}
            >
              {t.label}
            </Chip>
          ))}
        </div>
      </div>
      <p className="t-small t-muted" role="status" style={{ marginBottom: 16 }}>
        {bn(shown.length)}টি সূরা
      </p>
      {shown.length ? (
        <div className="surah-grid">
          {shown.map((s) => (
            <Link key={s.number} href={surahPath(s.number)} className="card card-hover surah-card">
              <span className="surah-card__num" aria-hidden="true">
                <span>{bn(s.number)}</span>
              </span>
              <span style={{ minWidth: 0 }}>
                <strong style={{ display: 'block', lineHeight: 1.5 }}>
                  <span className="sr-only">সূরা {bn(s.number)}: </span>
                  {s.nameBangla}
                </strong>
                <span className="t-caption t-muted">
                  {s.revelation === 'medinan' ? 'মাদানী' : 'মাক্কী'} · {bn(s.ayahCount)} আয়াত
                </span>
              </span>
              <span className="surah-card__ar" lang="ar">
                {s.nameArabic}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={<IconBook className="ic ic-xl" aria-hidden="true" />}
            title="এই নামে কোনো সূরা পাওয়া যায়নি"
            text="বানান মিলিয়ে দেখুন অথবা সূরার নম্বর লিখুন।"
          />
        </div>
      )}
    </>
  )
}
