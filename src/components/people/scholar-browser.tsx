'use client'

import { IconSearchEmpty, IconVerified } from '@/components/icons'
import Link from 'next/link'
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'

import { PersonAvatar } from '@/components/content/cards'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { Select } from '@/components/ui/form'
import { Chip, EmptyState, Skeleton } from '@/components/ui/primitives'
import { UrlSearchBox } from '@/components/ui/url-search'
import { usePublicList } from '@/hooks/use-public-list'
import { bn } from '@/lib/format'
import type { ScholarCard as ScholarCardView } from '@/server/queries/people'

const parsers = {
  q: parseAsString.withDefault(''),
  field: parseAsString.withDefault('all'),
  sort: parseAsStringLiteral(['name', 'answers', 'lectures'] as const).withDefault('name'),
}
const options = { history: 'replace', shallow: true, scroll: false } as const

export function ScholarCard({ scholar }: { scholar: ScholarCardView }) {
  const href = `/scholars/${scholar.slug}`
  return (
    <article className="card card-hover scholar-card">
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <PersonAvatar person={{ name: scholar.name, tone: scholar.tone }} size="lg" />
        {scholar.verified ? (
          <Badge variant="verified">
            <IconVerified className="ic" aria-hidden="true" />
            যাচাইকৃত
          </Badge>
        ) : null}
      </div>
      <div>
        <h2 className="t-h4" style={{ fontSize: 19 }}>
          <Link href={href} style={{ color: 'var(--rh-ink)', textDecoration: 'none' }}>
            {scholar.name}
          </Link>
        </h2>
        {scholar.title ? <p className="t-small t-muted">{scholar.title}</p> : null}
      </div>
      {scholar.expertise.length ? (
        <div className="tag-row">
          {scholar.expertise.slice(0, 3).map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mini-stats" style={{ marginTop: 'auto' }}>
        <div>
          <strong>{bn(scholar.articleCount)}</strong>
          <span>প্রবন্ধ</span>
        </div>
        <div>
          <strong>{bn(scholar.answerCount)}</strong>
          <span>উত্তর</span>
        </div>
        <div>
          <strong>{bn(scholar.lectureCount)}</strong>
          <span>লেকচার</span>
        </div>
      </div>
      <ButtonLink href={href} variant="secondary" size="sm" block>
        প্রোফাইল দেখুন
      </ButtonLink>
    </article>
  )
}

/** Hero controls: search by name or subject, and sort. */
export function ScholarControls() {
  const [state, setState] = useQueryStates(parsers, options)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 28, maxWidth: 760 }}>
      <UrlSearchBox
        id="sc-search"
        label="নাম বা বিষয় দিয়ে খুঁজুন"
        placeholder="নাম বা বিষয় দিয়ে খুঁজুন"
        wrapStyle={{ flex: '1 1 320px' }}
        inputStyle={{ minHeight: 54 }}
      />
      <label htmlFor="sc-sort" className="sr-only">
        সাজান
      </label>
      <Select
        id="sc-sort"
        wrapStyle={{ flex: '0 1 220px' }}
        style={{ minHeight: 54 }}
        value={state.sort}
        onChange={(e) =>
          void setState({
            sort: e.target.value === 'name' ? null : (e.target.value as 'answers' | 'lectures'),
          })
        }
      >
        <option value="name">নাম অনুযায়ী</option>
        <option value="answers">বেশি উত্তর আগে</option>
        <option value="lectures">বেশি লেকচার আগে</option>
      </Select>
    </div>
  )
}

export function ScholarGridSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(270px, 100%), 1fr))',
        gap: 20,
      }}
      aria-busy="true"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} style={{ height: 340, borderRadius: 'var(--rh-radius-lg)' }} />
      ))}
    </div>
  )
}

export function ScholarResults({
  initial,
  fields,
}: {
  initial: ScholarCardView[]
  fields: string[]
}) {
  const [state, setState] = useQueryStates(parsers, options)
  const { data, isFetching, isPending } = usePublicList<{ docs: ScholarCardView[] }>(
    '/scholars',
    { q: state.q, field: state.field, sort: state.sort === 'name' ? null : state.sort },
    { docs: initial },
  )
  const filtered = Boolean(state.q) || state.field !== 'all'

  return (
    <>
      <div
        className="chip-row"
        role="group"
        aria-label="বিশেষজ্ঞতা অনুযায়ী ফিল্টার"
        style={{ marginBottom: 18 }}
      >
        {['all', ...fields].map((f) => (
          <Chip
            key={f}
            active={state.field === f}
            onClick={() => void setState({ field: f === 'all' ? null : f })}
          >
            {f === 'all' ? 'সব' : f}
          </Chip>
        ))}
      </div>
      <p className="t-small t-muted" role="status" style={{ marginBottom: 18 }}>
        {data ? `${bn(data.docs.length)} জন আলিম${filtered ? ' পাওয়া গেছে' : ''}` : 'খোঁজা হচ্ছে…'}
      </p>
      {isPending && !data ? (
        <ScholarGridSkeleton />
      ) : data && data.docs.length ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(270px, 100%), 1fr))',
            gap: 20,
            opacity: isFetching ? 0.6 : 1,
            transition: 'opacity 200ms',
          }}
        >
          {data.docs.map((s) => (
            <ScholarCard key={s.id} scholar={s} />
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={<IconSearchEmpty className="ic ic-xl" aria-hidden="true" />}
            title="এই খোঁজে কাউকে পাওয়া যায়নি"
            text="বানান মিলিয়ে দেখুন অথবা অন্য বিষয় বেছে নিন।"
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void setState({ q: null, field: null })}
            >
              ফিল্টার মুছুন
            </Button>
          </EmptyState>
        </div>
      )}
    </>
  )
}
