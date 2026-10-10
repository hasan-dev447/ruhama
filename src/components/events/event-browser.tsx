'use client'

import { IconCalendarOff } from '@/components/icons'
import { parseAsInteger, parseAsStringLiteral, parseAsString, useQueryStates } from 'nuqs'

import { ButtonLink } from '@/components/ui/button'
import { DistrictSelect } from '@/components/ui/district-select'
import { Chip, EmptyState, Pager, Skeleton } from '@/components/ui/primitives'
import { usePublicList } from '@/hooks/use-public-list'
import { bn } from '@/lib/format'
import type { EventCardView } from '@/server/queries/types'

import { EventCard } from './event-card'

type Page = { docs: EventCardView[]; totalDocs: number; totalPages: number; page: number }

const TYPES = [
  { value: 'all', label: 'সব' },
  { value: 'online', label: 'অনলাইন' },
  { value: 'in_person', label: 'সরাসরি' },
] as const

const WHEN = [
  { value: 'upcoming', label: 'আসন্ন' },
  { value: 'past', label: 'শেষ হয়েছে' },
] as const

const parsers = {
  when: parseAsStringLiteral(['upcoming', 'past'] as const).withDefault('upcoming'),
  mode: parseAsStringLiteral(['all', 'online', 'in_person'] as const).withDefault('all'),
  district: parseAsString.withDefault('all'),
  page: parseAsInteger.withDefault(1),
}

export function EventGridSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(360px, 100%), 1fr))',
        gap: 20,
      }}
      aria-busy="true"
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} style={{ height: 300, borderRadius: 'var(--rh-radius-lg)' }} />
      ))}
    </div>
  )
}

export function EventBrowser({
  initial,
  districts,
}: {
  initial: Page
  districts: { upcoming: string[]; past: string[] }
}) {
  const [state, setState] = useQueryStates(parsers, {
    history: 'replace',
    shallow: true,
    scroll: false,
  })
  const { data, isFetching, isPending } = usePublicList<Page>(
    '/events',
    {
      when: state.when === 'past' ? 'past' : null,
      mode: state.mode,
      district: state.district,
      page: state.page > 1 ? state.page : null,
    },
    initial,
  )
  const past = state.when === 'past'
  const filtered = state.mode !== 'all' || state.district !== 'all'
  const districtList = past ? districts.past : districts.upcoming

  return (
    <>
      <div className="event-tabs" role="tablist" aria-label="মজলিস">
        {WHEN.map((w) => (
          <button
            key={w.value}
            type="button"
            role="tab"
            aria-selected={state.when === w.value}
            className={state.when === w.value ? 'event-tabs__tab is-active' : 'event-tabs__tab'}
            onClick={() =>
              void setState({
                when: w.value === 'upcoming' ? null : w.value,
                district: null,
                page: null,
              })
            }
          >
            {w.label}
          </button>
        ))}
      </div>
      <div
        className="card"
        style={{
          padding: '16px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px 20px',
          marginBottom: 28,
        }}
      >
        <div className="chip-row" role="group" aria-label="মজলিসের ধরন">
          {TYPES.map((t) => (
            <Chip
              key={t.value}
              active={state.mode === t.value}
              onClick={() =>
                void setState({ mode: t.value === 'all' ? null : t.value, page: null })
              }
            >
              {t.label}
            </Chip>
          ))}
        </div>
        <label htmlFor="ev-district" className="sr-only">
          জেলা
        </label>
        <DistrictSelect
          id="ev-district"
          style={{ flex: '0 1 240px', marginLeft: 'auto' }}
          allLabel="সব জেলা"
          only={districtList}
          value={state.district}
          onChange={(v) => void setState({ district: v === 'all' ? null : v, page: null })}
        />
      </div>

      <p className="t-small t-muted" role="status" style={{ marginBottom: 16 }}>
        {data
          ? `${bn(data.totalDocs)}টি ${past ? 'শেষ হওয়া' : 'আসন্ন'} মজলিস${filtered ? ' (ফিল্টার চালু)' : ''}`
          : 'খোঁজা হচ্ছে…'}
      </p>
      {isPending && !data ? (
        <EventGridSkeleton />
      ) : data && data.docs.length ? (
        <div style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 200ms' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(360px, 100%), 1fr))',
              gap: 20,
            }}
          >
            {data.docs.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
          <div style={{ marginTop: 36 }}>
            <Pager
              page={data.page}
              totalPages={data.totalPages}
              hrefFor={(p) => `/events?${past ? 'when=past&' : ''}page=${p}`}
              onPage={(p) => void setState({ page: p > 1 ? p : null })}
            />
          </div>
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={<IconCalendarOff className="ic ic-xl" aria-hidden="true" />}
            title={
              past
                ? 'এখনো কোনো শেষ হওয়া মজলিস নেই'
                : state.district !== 'all'
                  ? 'এই জেলায় আপাতত কোনো মজলিস নেই'
                  : 'আপাতত কোনো আসন্ন মজলিস নেই'
            }
            text={
              past
                ? 'মজলিস শেষ হলে এখানে দেখাবে, ছবি ও ভিডিওসহ।'
                : 'আপনার এলাকায় মজলিস আয়োজনে সহযোগিতা করতে চাইলে যুক্ত হোন।'
            }
          >
            <ButtonLink href="/join?interest=events" variant="secondary" size="sm">
              আয়োজনে যুক্ত হোন
            </ButtonLink>
          </EmptyState>
        </div>
      )}
    </>
  )
}
