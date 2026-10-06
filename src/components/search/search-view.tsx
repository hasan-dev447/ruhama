'use client'

import { ArrowRight, ChevronRight, SearchX } from 'lucide-react'
import Link from 'next/link'
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'

import { ButtonLink } from '@/components/ui/button'
import { Chip, Pager, Skeleton } from '@/components/ui/primitives'
import { UrlSearchBox } from '@/components/ui/url-search'
import { usePublicList } from '@/hooks/use-public-list'
import { bn } from '@/lib/format'
import {
  SEARCH_TYPE_LABELS,
  SEARCH_TYPES,
  type Highlighted,
  type SearchHit,
  type SearchResults,
  type SearchType,
} from '@/server/search/types'

const MARKS: Record<SearchType, string> = {
  articles: 'প',
  ayahs: 'আ',
  hadiths: 'হা',
  questions: 'প্র',
  ikhtilaf: 'ম',
  videos: 'ভি',
  courses: 'কো',
  events: 'ম',
  people: 'স্ক',
}
const SUGGESTIONS = ['ভ্রাতৃত্ব', 'সালাত', 'তাকদির', 'মাযহাব', 'রাগ', 'যাকাত']

const parsers = {
  q: parseAsString.withDefault(''),
  type: parseAsStringLiteral(['all', ...SEARCH_TYPES] as const).withDefault('all'),
  page: parseAsInteger.withDefault(1),
}

function Marked({ parts }: { parts: Highlighted }) {
  return (
    <>
      {parts.map((p, i) => (p.hit ? <mark key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>))}
    </>
  )
}

function ResultItem({ hit }: { hit: SearchHit }) {
  return (
    <Link href={hit.href} className="result-item">
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="row-link__title clamp-3" style={{ fontSize: 17 }}>
          <Marked parts={hit.title} />
        </span>
        {hit.snippet ? (
          <span className="t-small clamp-2" style={{ color: 'var(--rh-muted)', lineHeight: 1.7 }}>
            <Marked parts={hit.snippet} />
          </span>
        ) : null}
        {hit.meta ? (
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {hit.reference ? (
              <span className="ref-badge">{hit.meta}</span>
            ) : (
              <span className="t-caption t-muted">{hit.meta}</span>
            )}
          </span>
        ) : null}
      </span>
      <ChevronRight
        className="ic"
        aria-hidden="true"
        style={{ color: 'var(--rh-muted)', marginTop: 4 }}
      />
    </Link>
  )
}

function GroupHead({
  type,
  count,
  onAll,
}: {
  type: SearchType
  count: number
  onAll?: () => void
}) {
  return (
    <div className="result-group__head">
      <h2 className="t-h4" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          className="icon-tile icon-tile--teal"
          style={{ width: 34, height: 34, fontSize: 14 }}
          aria-hidden="true"
        >
          {MARKS[type]}
        </span>
        {SEARCH_TYPE_LABELS[type]}{' '}
        <span
          className="t-small t-muted"
          style={{ fontFamily: 'var(--rh-font-body)', fontWeight: 400 }}
        >
          {bn(count)}
        </span>
      </h2>
      {onAll ? (
        <button
          type="button"
          className="link-arrow"
          onClick={onAll}
          style={{ background: 'none', border: 0, cursor: 'pointer' }}
        >
          সব দেখুন <ArrowRight className="ic" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}

/** Site-wide search (design `Search` board): query and filters live in the URL. */
export function SearchView() {
  const [state, setState] = useQueryStates(parsers, {
    history: 'replace',
    shallow: true,
    scroll: false,
  })
  const q = state.q.trim()
  const enabled = q.length >= 2
  const { data, isFetching } = usePublicList<SearchResults>(
    '/search',
    { q, type: state.type === 'all' ? null : state.type, page: state.page > 1 ? state.page : null },
    undefined,
    '',
    { enabled },
  )
  const results = enabled ? data : undefined
  const selectType = (t: SearchType | 'all') => {
    void setState({ type: t === 'all' ? null : t, page: null })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <section className="page-hero" aria-labelledby="s-title" style={{ paddingBottom: 32 }}>
        <div className="rh-pattern" aria-hidden="true" />
        <div className="rh-container">
          <h1 id="s-title" className="sr-only">
            সার্চ রেজাল্ট
          </h1>
          <form role="search" onSubmit={(e) => e.preventDefault()}>
            <UrlSearchBox
              id="gs"
              label="পুরো সাইটে খুঁজুন"
              placeholder="প্রবন্ধ, আয়াত, হাদিস, প্রশ্ন, ভিডিও…"
              inputStyle={{ minHeight: 64, fontSize: 19, paddingLeft: 54, borderRadius: 14 }}
            />
          </form>
          <p className="t-muted" role="status" style={{ marginTop: 14 }}>
            {!enabled
              ? 'অন্তত দুই অক্ষর লিখুন। প্রবন্ধ, কুরআনের আয়াত, হাদিস, প্রশ্নোত্তর, ভিডিও ও মজলিস একসাথে খোঁজা হবে।'
              : results
                ? `“${results.q}” লিখে ${bn(results.total)}টি ফলাফল পাওয়া গেছে`
                : 'খোঁজা হচ্ছে…'}
          </p>
          {results && results.total > 0 ? (
            <div
              className="chip-row"
              role="group"
              aria-label="ফলাফলের ধরন"
              style={{ marginTop: 16 }}
            >
              <Chip active={state.type === 'all'} onClick={() => selectType('all')}>
                সব <span style={{ opacity: 0.75 }}>{bn(results.total)}</span>
              </Chip>
              {SEARCH_TYPES.map((t) => (
                <Chip
                  key={t}
                  active={state.type === t}
                  onClick={() => selectType(t)}
                  disabled={!results.counts[t]}
                >
                  {SEARCH_TYPE_LABELS[t]}{' '}
                  <span style={{ opacity: 0.75 }}>{bn(results.counts[t])}</span>
                </Chip>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="section-sm">
        <div
          className="rh-container"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 36,
            opacity: isFetching ? 0.65 : 1,
            transition: 'opacity 200ms',
          }}
        >
          {enabled && !results ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} style={{ height: 96 }} />
              ))}
            </div>
          ) : null}

          {results && results.total === 0 ? (
            <div className="card">
              <div className="empty" style={{ paddingBlock: 56 }}>
                <span className="empty__icon">
                  <SearchX className="ic ic-xl" aria-hidden="true" />
                </span>
                <h2 className="t-h4">“{results.q}” লিখে কিছু পাওয়া যায়নি</h2>
                <p className="t-small t-muted" style={{ maxWidth: 420 }}>
                  বানান মিলিয়ে দেখুন, ছোট শব্দে খুঁজুন অথবা নিচের কোনো বিষয় দিয়ে শুরু করুন। উত্তর
                  না পেলে প্রশ্ন করতে পারেন।
                </p>
                <div className="chip-row" style={{ justifyContent: 'center' }}>
                  {SUGGESTIONS.map((s) => (
                    <Chip key={s} onClick={() => void setState({ q: s, type: null, page: null })}>
                      {s}
                    </Chip>
                  ))}
                </div>
                <ButtonLink href="/qa#ask" size="sm" style={{ marginTop: 6 }}>
                  প্রশ্ন করুন
                </ButtonLink>
              </div>
            </div>
          ) : null}

          {results && state.type === 'all'
            ? results.groups.map((g) => (
                <section
                  key={g.type}
                  className="result-group"
                  aria-label={SEARCH_TYPE_LABELS[g.type]}
                >
                  <GroupHead
                    type={g.type}
                    count={results.counts[g.type]}
                    onAll={
                      results.counts[g.type] > g.hits.length ? () => selectType(g.type) : undefined
                    }
                  />
                  {g.hits.map((h) => (
                    <ResultItem key={`${h.type}-${h.id}`} hit={h} />
                  ))}
                </section>
              ))
            : null}

          {results && state.type !== 'all' && results.hits.length ? (
            <section className="result-group" aria-label={SEARCH_TYPE_LABELS[state.type]}>
              <GroupHead type={state.type} count={results.counts[state.type]} />
              {results.hits.map((h) => (
                <ResultItem key={`${h.type}-${h.id}`} hit={h} />
              ))}
              <div style={{ marginTop: 28 }}>
                <Pager
                  page={results.page}
                  totalPages={results.totalPages}
                  hrefFor={(p) => `/search?q=${encodeURIComponent(q)}&type=${state.type}&page=${p}`}
                  onPage={(p) => {
                    void setState({ page: p > 1 ? p : null })
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                />
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </>
  )
}
