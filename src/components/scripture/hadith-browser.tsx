'use client'

import { IconSearchEmpty } from '@/components/icons'
import Link from 'next/link'
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'

import { GradeBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InfiniteSentinel } from '@/components/ui/infinite-sentinel'
import { Chip, EmptyState, Skeleton } from '@/components/ui/primitives'
import { UrlSearchBox } from '@/components/ui/url-search'
import { useInfinitePublicList } from '@/hooks/use-infinite-public-list'
import { bn } from '@/lib/format'
import type { HadithView } from '@/server/queries/scripture'

type Page = { docs: HadithView[]; totalDocs: number; totalPages: number; page: number }

const GRADES = [
  { value: 'all', label: 'সব মান' },
  { value: 'sahih', label: 'সহিহ' },
  { value: 'hasan', label: 'হাসান' },
  { value: 'daif', label: 'যঈফ' },
] as const

const parsers = {
  q: parseAsString.withDefault(''),
  grade: parseAsStringLiteral(['all', 'sahih', 'hasan', 'daif'] as const).withDefault('all'),
}

export function HadithRow({ h }: { h: HadithView }) {
  return (
    <article
      className="card card-hover"
      style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <Link
          href={`/hadith/${h.book.slug}/${h.numberLabel}`}
          className="ref-badge"
          style={{ textDecoration: 'none' }}
        >
          {h.book.shortName} : {bn(h.numberLabel)}
        </Link>
        {h.narrator ? <span className="t-small t-muted">{h.narrator}</span> : null}
        <GradeBadge grade={h.grade} style={{ marginLeft: 'auto' }} />
      </div>
      <p className="clamp-3" style={{ lineHeight: 1.8 }}>
        <Link
          href={`/hadith/${h.book.slug}/${h.numberLabel}`}
          style={{ color: 'var(--rh-ink)', textDecoration: 'none' }}
        >
          {h.text}
        </Link>
      </p>
    </article>
  )
}

export function HadithBrowser({ book, initial }: { book: string; initial: Page }) {
  const [state, setState] = useQueryStates(parsers, {
    history: 'replace',
    shallow: true,
    scroll: false,
  })
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isFetching } =
    useInfinitePublicList<HadithView>(
      `/hadith/books/${book}`,
      { q: state.q, grade: state.grade },
      initial,
    )
  const docs = data?.pages.flatMap((p) => p.docs) ?? []
  const total = data?.pages[0]?.totalDocs ?? 0
  const filtered = Boolean(state.q) || state.grade !== 'all'

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          marginBottom: 18,
        }}
      >
        <UrlSearchBox
          id="hadith-search"
          label="এই গ্রন্থে খুঁজুন"
          placeholder="শব্দ, বর্ণনাকারী বা হাদিস নম্বর"
          wrapStyle={{ flex: '1 1 300px', maxWidth: 480 }}
        />
        <div className="chip-row" role="group" aria-label="মান অনুযায়ী ফিল্টার">
          {GRADES.map((g) => (
            <Chip
              key={g.value}
              active={state.grade === g.value}
              onClick={() => void setState({ grade: g.value === 'all' ? null : g.value })}
            >
              {g.label}
            </Chip>
          ))}
        </div>
      </div>
      <p className="t-small t-muted" role="status" style={{ marginBottom: 16 }}>
        {isPending ? 'খোঁজা হচ্ছে…' : `${bn(total)}টি হাদিস${filtered ? ' পাওয়া গেছে' : ''}`}
      </p>
      {isPending ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} style={{ height: 130, borderRadius: 'var(--rh-radius-lg)' }} />
          ))}
        </div>
      ) : docs.length ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            opacity: isFetching && !isFetchingNextPage ? 0.6 : 1,
          }}
        >
          {docs.map((h) => (
            <HadithRow key={h.id} h={h} />
          ))}
          <InfiniteSentinel
            hasMore={Boolean(hasNextPage)}
            loading={isFetchingNextPage}
            onLoadMore={() => void fetchNextPage()}
          />
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={<IconSearchEmpty className="ic ic-xl" aria-hidden="true" />}
            title="কোনো হাদিস পাওয়া যায়নি"
            text="অন্য শব্দে খুঁজে দেখুন বা ফিল্টার কমিয়ে দিন।"
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void setState({ q: null, grade: null })}
            >
              ফিল্টার মুছুন
            </Button>
          </EmptyState>
        </div>
      )}
    </>
  )
}
