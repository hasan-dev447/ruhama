'use client'

import { ArrowRight, SearchX } from 'lucide-react'
import Link from 'next/link'
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs'
import { useEffect, useState } from 'react'

import { ArticleCard } from '@/components/content/cards'
import { Button, ButtonLink } from '@/components/ui/button'
import { SearchInput, Select } from '@/components/ui/form'
import { Chip, EmptyState, Pager, Skeleton } from '@/components/ui/primitives'
import { useDebouncedValue } from '@/hooks/use-debounced'
import { usePublicList } from '@/hooks/use-public-list'
import { bn } from '@/lib/format'
import type { Paged } from '@/server/queries/articles'
import type { ArticleCardView, CategoryView } from '@/server/queries/types'

const LEVELS = [
  { value: 'all', label: 'সব' },
  { value: 'beginner', label: 'প্রাথমিক' },
  { value: 'intermediate', label: 'মধ্যম' },
  { value: 'advanced', label: 'উচ্চ' },
] as const

const parsers = {
  category: parseAsArrayOf(parseAsString).withDefault([]),
  level: parseAsStringLiteral(['all', 'beginner', 'intermediate', 'advanced'] as const).withDefault(
    'all',
  ),
  q: parseAsString.withDefault(''),
  sort: parseAsStringLiteral(['new', 'short', 'long'] as const).withDefault('new'),
  page: parseAsInteger.withDefault(1),
}

export function ArticleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
        gap: 20,
      }}
      aria-busy="true"
      aria-label="লোড হচ্ছে"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ overflow: 'hidden' }}>
          <Skeleton style={{ height: 132, borderRadius: 0 }} />
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Skeleton style={{ height: 14, width: '50%' }} />
            <Skeleton style={{ height: 18, width: '90%' }} />
            <Skeleton style={{ height: 18, width: '70%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Ilm Center filters: categories, level, search and sort, all synced to the URL. */
export function ArticleBrowser({
  initial,
  categories,
}: {
  initial: Paged<ArticleCardView>
  categories: CategoryView[]
}) {
  const [state, setState] = useQueryStates(parsers, {
    history: 'replace',
    shallow: true,
    scroll: false,
  })
  const [search, setSearch] = useState(state.q)
  const debounced = useDebouncedValue(search, 350)

  useEffect(() => {
    if (debounced !== state.q) void setState({ q: debounced || null, page: null })
  }, [debounced, state.q, setState])

  const { data, isFetching, isPending } = usePublicList<Paged<ArticleCardView>>(
    '/articles',
    {
      category: state.category,
      level: state.level,
      q: state.q,
      sort: state.sort === 'new' ? null : state.sort,
      page: state.page > 1 ? state.page : null,
      limit: 12,
    },
    initial,
    'limit=12',
  )

  const filtered = state.category.length > 0 || state.level !== 'all' || Boolean(state.q)
  const toggleCategory = (slug: string) => {
    const next = state.category.includes(slug)
      ? state.category.filter((c) => c !== slug)
      : [...state.category, slug]
    void setState({ category: next.length ? next : null, page: null })
  }
  const reset = () => {
    setSearch('')
    void setState({ category: null, level: null, q: null, page: null })
  }

  return (
    <div className="layout-side">
      <aside className="layout-side__aside" aria-label="ফিল্টার">
        <div className="filter-group">
          <h3>বিষয়</h3>
          {categories.map((c) => (
            <label key={c.id} className="check">
              <input
                type="checkbox"
                checked={state.category.includes(c.slug)}
                onChange={() => toggleCategory(c.slug)}
              />
              <span>{c.name}</span>
              <span className="filter-count">{bn(c.articleCount)}</span>
            </label>
          ))}
        </div>
        <div className="filter-group">
          <h3>স্তর</h3>
          <div className="chip-row">
            {LEVELS.map((l) => (
              <Chip
                key={l.value}
                active={state.level === l.value}
                onClick={() =>
                  void setState({ level: l.value === 'all' ? null : l.value, page: null })
                }
              >
                {l.label}
              </Chip>
            ))}
          </div>
        </div>
        <div
          className="card"
          style={{
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            background: 'var(--rh-accent-soft)',
            borderColor: 'color-mix(in srgb, var(--rh-accent) 30%, transparent)',
          }}
        >
          <strong style={{ fontFamily: 'var(--rh-font-heading)' }}>কোথা থেকে শুরু করব?</strong>
          <p className="t-small t-muted">নতুন হলে “শেখার পথ”-এর সাজানো কোর্স দিয়ে শুরু করুন।</p>
          <Link href="/courses" className="link-arrow">
            শেখার পথ <ArrowRight className="ic" aria-hidden="true" />
          </Link>
        </div>
      </aside>
      <div className="layout-side__main">
        <div className="toolbar">
          <SearchInput
            label="প্রবন্ধ খুঁজুন"
            wrapClassName="grow"
            placeholder="শিরোনাম বা লেখকের নাম লিখুন"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            aria-label="সাজান"
            wrapStyle={{ flex: '0 1 220px' }}
            value={state.sort}
            onChange={(e) =>
              void setState({
                sort: e.target.value === 'new' ? null : (e.target.value as 'short' | 'long'),
                page: null,
              })
            }
          >
            <option value="new">সর্বশেষ প্রকাশিত</option>
            <option value="short">কম সময়ে পড়া যায়</option>
            <option value="long">বিস্তারিত আগে</option>
          </Select>
        </div>
        <p className="t-small t-muted" role="status" style={{ marginBottom: 18 }}>
          {data
            ? `${bn(data.totalDocs)}টি প্রবন্ধ দেখানো হচ্ছে${filtered ? ' (ফিল্টার চালু)' : ''}`
            : 'খোঁজা হচ্ছে…'}
        </p>
        {isPending && !data ? (
          <ArticleGridSkeleton />
        ) : data && data.docs.length > 0 ? (
          <div style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 200ms' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
                gap: 20,
              }}
            >
              {data.docs.map((a) => (
                <ArticleCard key={a.id} article={a} mediaHeight={132} showLevel titleSize={18} />
              ))}
            </div>
            <div style={{ marginTop: 48 }}>
              <Pager
                page={data.page}
                totalPages={data.totalPages}
                hrefFor={(p) => `/ilm?page=${p}`}
                onPage={(p) => {
                  void setState({ page: p > 1 ? p : null })
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            </div>
          </div>
        ) : (
          <div className="card">
            <EmptyState
              icon={<SearchX className="ic ic-xl" aria-hidden="true" />}
              title="এই ফিল্টারে কোনো প্রবন্ধ পাওয়া যায়নি"
              text="অন্য শব্দে খুঁজে দেখুন বা ফিল্টার কমিয়ে দিন। চাইলে বিষয়টি নিয়ে প্রশ্নও করতে পারেন।"
            >
              <Button variant="secondary" size="sm" onClick={reset}>
                ফিল্টার মুছুন
              </Button>
              <ButtonLink href="/qa" variant="ghost" size="sm">
                প্রশ্ন করুন
              </ButtonLink>
            </EmptyState>
          </div>
        )}
      </div>
    </div>
  )
}
