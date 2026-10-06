'use client'

import { IconVideoOff } from '@/components/icons'
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'

import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/form'
import { Chip, EmptyState, Pager, Skeleton } from '@/components/ui/primitives'
import { usePublicList } from '@/hooks/use-public-list'
import { bn } from '@/lib/format'
import type { VideoCardView } from '@/server/queries/types'

import { VideoCard } from './video-card'

type Page = { docs: VideoCardView[]; totalDocs: number; totalPages: number; page: number }

const DURATIONS = [
  { value: 'all', label: 'সব' },
  { value: 'short', label: '১০ মিনিটের কম' },
  { value: 'medium', label: '১০ থেকে ৩০ মিনিট' },
  { value: 'long', label: '৩০ মিনিটের বেশি' },
] as const

const parsers = {
  q: parseAsString.withDefault(''),
  category: parseAsString.withDefault('all'),
  duration: parseAsStringLiteral(['all', 'short', 'medium', 'long'] as const).withDefault('all'),
  speaker: parseAsString.withDefault('all'),
  page: parseAsInteger.withDefault(1),
}

export function VideoGridSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
        gap: 20,
      }}
      aria-busy="true"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} style={{ height: 300, borderRadius: 'var(--rh-radius-lg)' }} />
      ))}
    </div>
  )
}

export function VideoBrowser({
  initial,
  categories,
  speakers,
}: {
  initial: Page
  categories: { slug: string; name: string }[]
  speakers: { slug: string; name: string }[]
}) {
  const [state, setState] = useQueryStates(parsers, {
    history: 'replace',
    shallow: true,
    scroll: false,
  })
  const { data, isFetching, isPending } = usePublicList<Page>(
    '/videos',
    {
      q: state.q,
      category: state.category,
      duration: state.duration,
      speaker: state.speaker,
      page: state.page > 1 ? state.page : null,
      limit: 12,
    },
    initial,
    'limit=12',
  )
  const filtered =
    Boolean(state.q) ||
    state.category !== 'all' ||
    state.duration !== 'all' ||
    state.speaker !== 'all'

  return (
    <>
      <div
        className="card"
        style={{
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <span className="t-small t-muted" style={{ minWidth: 72 }}>
            ক্যাটাগরি
          </span>
          <div className="chip-row" role="group" aria-label="ক্যাটাগরি">
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
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <span className="t-small t-muted" style={{ minWidth: 72 }}>
            সময়কাল
          </span>
          <div className="chip-row" role="group" aria-label="সময়কাল">
            {DURATIONS.map((d) => (
              <Chip
                key={d.value}
                active={state.duration === d.value}
                onClick={() =>
                  void setState({ duration: d.value === 'all' ? null : d.value, page: null })
                }
              >
                {d.label}
              </Chip>
            ))}
          </div>
          <label htmlFor="v-speaker" className="sr-only">
            বক্তা
          </label>
          <Select
            id="v-speaker"
            wrapStyle={{ flex: '0 1 240px', marginLeft: 'auto' }}
            value={state.speaker}
            onChange={(e) =>
              void setState({
                speaker: e.target.value === 'all' ? null : e.target.value,
                page: null,
              })
            }
          >
            <option value="all">সব বক্তা</option>
            {speakers.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <p className="t-small t-muted" role="status" style={{ marginBottom: 16 }}>
        {data
          ? `${bn(data.totalDocs)}টি ভিডিও${filtered ? ' (ফিল্টার চালু)' : ''}`
          : 'খোঁজা হচ্ছে…'}
      </p>
      {isPending && !data ? (
        <VideoGridSkeleton />
      ) : data && data.docs.length ? (
        <div style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 200ms' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
              gap: 20,
            }}
          >
            {data.docs.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
          <div style={{ marginTop: 40 }}>
            <Pager
              page={data.page}
              totalPages={data.totalPages}
              hrefFor={(p) => `/videos?page=${p}`}
              onPage={(p) => void setState({ page: p > 1 ? p : null })}
            />
          </div>
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={<IconVideoOff className="ic ic-xl" aria-hidden="true" />}
            title="এই ফিল্টারে কোনো ভিডিও নেই"
            text="ফিল্টার কমিয়ে আবার দেখুন।"
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                void setState({
                  q: null,
                  category: null,
                  duration: null,
                  speaker: null,
                  page: null,
                })
              }
            >
              ফিল্টার মুছুন
            </Button>
          </EmptyState>
        </div>
      )}
    </>
  )
}
