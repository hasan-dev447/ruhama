'use client'

import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'

import { CircleBeadsIcon } from '@/components/icons/design-icons'
import { ButtonLink } from '@/components/ui/button'
import { Select } from '@/components/ui/form'
import { Chip, Pager, Skeleton } from '@/components/ui/primitives'
import { usePublicList } from '@/hooks/use-public-list'
import { DIVISIONS, districtLabel } from '@/lib/districts'
import { bn } from '@/lib/format'
import type { CircleCardView } from '@/server/queries/types'

import { CircleCard } from './circle-card'

type Page = { docs: CircleCardView[]; totalDocs: number; totalPages: number; page: number }

const TYPES = [
  { value: 'all', label: 'সব' },
  { value: 'brothers', label: 'ভাইদের' },
  { value: 'sisters', label: 'বোনদের' },
  { value: 'family', label: 'পারিবারিক' },
] as const

const parsers = {
  district: parseAsString.withDefault('all'),
  type: parseAsStringLiteral(['all', 'brothers', 'sisters', 'family'] as const).withDefault('all'),
  page: parseAsInteger.withDefault(1),
}
const options = { history: 'replace', shallow: true, scroll: false } as const

/** District select (all 64, grouped by division) and type chips, shown in the hero card. */
export function CircleFilters() {
  const [state, setState] = useQueryStates(parsers, options)
  return (
    <div
      className="card"
      style={{
        marginTop: 28,
        padding: 16,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        maxWidth: 880,
      }}
    >
      <label htmlFor="c-district" className="sr-only">
        জেলা নির্বাচন করুন
      </label>
      <Select
        id="c-district"
        wrapStyle={{ flex: '1 1 260px' }}
        style={{ minHeight: 52 }}
        value={state.district}
        onChange={(e) =>
          void setState({ district: e.target.value === 'all' ? null : e.target.value, page: null })
        }
      >
        <option value="all">সব জেলা</option>
        {DIVISIONS.map((d) => (
          <optgroup key={d.value} label={d.label}>
            {d.districts.map((x) => (
              <option key={x.value} value={x.value}>
                {x.label}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>
      <div className="chip-row" role="group" aria-label="সার্কেলের ধরন">
        {TYPES.map((t) => (
          <Chip
            key={t.value}
            active={state.type === t.value}
            onClick={() => void setState({ type: t.value === 'all' ? null : t.value, page: null })}
          >
            {t.label}
          </Chip>
        ))}
      </div>
    </div>
  )
}

export function CircleGridSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))',
        gap: 20,
      }}
      aria-busy="true"
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} style={{ height: 340, borderRadius: 'var(--rh-radius-lg)' }} />
      ))}
    </div>
  )
}

export function CircleResults({ initial }: { initial: Page }) {
  const [state, setState] = useQueryStates(parsers, options)
  const { data, isFetching, isPending } = usePublicList<Page>(
    '/circles',
    { district: state.district, type: state.type, page: state.page > 1 ? state.page : null },
    initial,
  )
  const inDistrict = state.district !== 'all'
  const typeLabel = TYPES.find((t) => t.value === state.type)?.label

  if (isPending && !data) return <CircleGridSkeleton />
  return (
    <>
      <p className="t-small t-muted" role="status" style={{ marginBottom: 18 }}>
        {data
          ? `${inDistrict ? `${districtLabel(state.district)} জেলায় ` : '৬৪ জেলার মধ্যে '}${bn(data.totalDocs)}টি সার্কেল পাওয়া গেছে`
          : 'খোঁজা হচ্ছে…'}
      </p>
      {data && data.docs.length ? (
        <div style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 200ms' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))',
              gap: 20,
            }}
          >
            {data.docs.map((c) => (
              <CircleCard key={c.id} circle={c} />
            ))}
          </div>
          <div style={{ marginTop: 36 }}>
            <Pager
              page={data.page}
              totalPages={data.totalPages}
              hrefFor={(p) => `/circles?page=${p}`}
              onPage={(p) => void setState({ page: p > 1 ? p : null })}
            />
          </div>
        </div>
      ) : (
        <div className="card pattern-host" style={{ textAlign: 'center' }}>
          <div className="rh-pattern" aria-hidden="true" />
          <div className="empty" style={{ paddingBlock: 56 }}>
            <span className="empty__icon">
              <CircleBeadsIcon className="ic ic-xl" />
            </span>
            <h2 className="t-h4">
              {inDistrict
                ? `${districtLabel(state.district)} জেলায়`
                : state.type !== 'all'
                  ? `${typeLabel} ধরনের`
                  : 'এই ধরনের'}{' '}
              এখনো কোনো সার্কেল নেই
            </h2>
            <p className="t-small t-muted" style={{ maxWidth: 420 }}>
              প্রথম সার্কেলটি আপনিই শুরু করতে পারেন। আমরা আলোচনার সিলেবাস, সমন্বয়কের গাইড ও আলিমের
              অনলাইন সহায়তা দেব।
            </p>
            <ButtonLink href="/join" size="sm">
              নতুন সার্কেল শুরু করুন
            </ButtonLink>
          </div>
        </div>
      )}
    </>
  )
}
