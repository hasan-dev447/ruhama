'use client'

import { IconSearchEmpty } from '@/components/icons'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'

import { Button, ButtonLink } from '@/components/ui/button'
import { Chip, EmptyState, Pager, Skeleton } from '@/components/ui/primitives'
import { UrlSearchBox } from '@/components/ui/url-search'
import { usePublicList } from '@/hooks/use-public-list'
import { bn } from '@/lib/format'
import type { QuestionCardView } from '@/server/queries/types'

import { QuestionCard } from './question-card'

type Page = { docs: QuestionCardView[]; totalDocs: number; totalPages: number; page: number }

const parsers = {
  q: parseAsString.withDefault(''),
  category: parseAsString.withDefault('all'),
  page: parseAsInteger.withDefault(1),
}
const options = { history: 'replace', shallow: true, scroll: false } as const

/** Large search box in the hero; writes the debounced query to the URL shared with the list. */
export function QuestionSearch() {
  return (
    <UrlSearchBox
      id="qa-search"
      label="প্রশ্ন খুঁজুন"
      placeholder="আগে উত্তর দেওয়া প্রশ্ন খুঁজুন, যেমন: যাকাত, সালাত, মাযহাব"
      wrapStyle={{ maxWidth: 640, marginTop: 28 }}
      inputStyle={{ minHeight: 56, fontSize: 17 }}
    />
  )
}

export function QuestionListSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="card"
          style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <Skeleton style={{ height: 22, width: 180 }} />
          <Skeleton style={{ height: 22, width: '85%' }} />
          <Skeleton style={{ height: 16, width: '95%' }} />
        </div>
      ))}
    </div>
  )
}

export function QuestionBrowser({
  initial,
  categories,
}: {
  initial: Page
  categories: { slug: string; name: string }[]
}) {
  const [state, setState] = useQueryStates(parsers, options)
  const { data, isFetching, isPending } = usePublicList<Page>(
    '/questions',
    { q: state.q, category: state.category, page: state.page > 1 ? state.page : null },
    initial,
  )
  const filtered = Boolean(state.q) || state.category !== 'all'

  return (
    <>
      <div
        className="chip-row"
        role="group"
        aria-label="বিষয় অনুযায়ী ফিল্টার"
        style={{ marginBottom: 20 }}
      >
        {[{ slug: 'all', name: 'সব' }, ...categories].map((c) => (
          <Chip
            key={c.slug}
            active={state.category === c.slug}
            onClick={() =>
              void setState({ category: c.slug === 'all' ? null : c.slug, page: null })
            }
          >
            {c.name}
          </Chip>
        ))}
      </div>
      <p className="t-small t-muted" role="status" style={{ marginBottom: 14 }}>
        {data
          ? state.q
            ? `“${state.q}” খুঁজে ${bn(data.totalDocs)}টি উত্তর পাওয়া গেছে`
            : `${bn(data.totalDocs)}টি রিভিউকৃত উত্তর`
          : 'খোঁজা হচ্ছে…'}
      </p>
      {isPending && !data ? (
        <QuestionListSkeleton />
      ) : data && data.docs.length ? (
        <div style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 200ms' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.docs.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
          <div style={{ marginTop: 36 }}>
            <Pager
              page={data.page}
              totalPages={data.totalPages}
              hrefFor={(p) => `/qa?page=${p}`}
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
            icon={<IconSearchEmpty className="ic ic-xl" aria-hidden="true" />}
            title={
              filtered ? 'এই খোঁজে কোনো উত্তর পাওয়া যায়নি' : 'এখনো কোনো উত্তর প্রকাশিত হয়নি'
            }
            text="অন্য শব্দে খুঁজে দেখুন, অথবা পাশের ফর্ম থেকে প্রশ্নটি জমা দিন। আলিম প্যানেল উত্তর দেবেন, ইনশাআল্লাহ।"
          >
            {filtered ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void setState({ q: null, category: null, page: null })}
              >
                ফিল্টার মুছুন
              </Button>
            ) : null}
            <ButtonLink href="#ask" variant="ghost" size="sm">
              প্রশ্ন করুন
            </ButtonLink>
          </EmptyState>
        </div>
      )}
    </>
  )
}
