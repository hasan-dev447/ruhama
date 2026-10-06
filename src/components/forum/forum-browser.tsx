'use client'

import { MessagesSquare, PenSquare } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MobileFilters } from '@/components/ui/mobile-filters'
import { Pager, Skeleton } from '@/components/ui/primitives'
import { RelativeTime } from '@/components/ui/relative-time'
import { UserAvatar } from '@/components/ui/user-avatar'
import { usePublicList } from '@/hooks/use-public-list'
import { authClient } from '@/lib/auth/client'
import { bn, bnCompact } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ThreadRow } from '@/server/queries/forum'

// the form (and its validation library) downloads only when someone starts a thread
const NewThreadModal = dynamic(() => import('./new-thread-modal').then((m) => m.NewThreadModal), {
  ssr: false,
})

type Page = { docs: ThreadRow[]; totalDocs: number; totalPages: number; page: number }
type Category = { id: number; name: string; slug: string; threadCount: number }

const SORTS = [
  { value: 'recent', label: 'সাম্প্রতিক' },
  { value: 'popular', label: 'জনপ্রিয়' },
  { value: 'unanswered', label: 'উত্তরহীন' },
] as const

const parsers = {
  category: parseAsString.withDefault('all'),
  sort: parseAsStringLiteral(['recent', 'popular', 'unanswered'] as const).withDefault('recent'),
  page: parseAsInteger.withDefault(1),
}

export const threadHref = (t: { id: number; slug: string | null }) =>
  `/forum/${t.id}${t.slug ? `/${t.slug}` : ''}`

/** "নতুন আলোচনা" button; guests are sent to login first. */
export function NewThreadButton({
  categories,
  size = 'lg',
}: {
  categories: Category[]
  size?: 'lg' | 'sm'
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = authClient.useSession()
  const [open, setOpen] = useState(false)
  const [opened, setOpened] = useState(false)
  return (
    <>
      <Button
        size={size}
        onClick={() => {
          if (!session?.user)
            return router.push(`/login?next=${encodeURIComponent(pathname ?? '/forum')}`)
          setOpened(true)
          setOpen(true)
        }}
      >
        <PenSquare className="ic" aria-hidden="true" />
        নতুন আলোচনা
      </Button>
      {opened ? (
        <NewThreadModal
          open={open}
          onOpenChange={setOpen}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      ) : null}
    </>
  )
}

export function ForumBrowser({ initial, categories }: { initial: Page; categories: Category[] }) {
  const [state, setState] = useQueryStates(parsers, {
    history: 'replace',
    shallow: true,
    scroll: false,
  })
  const { data, isFetching, isPending } = usePublicList<Page>(
    '/forum/threads',
    {
      category: state.category,
      sort: state.sort === 'recent' ? null : state.sort,
      page: state.page > 1 ? state.page : null,
    },
    initial,
  )
  const total = categories.reduce((s, c) => s + c.threadCount, 0)

  return (
    <div className="layout-side">
      <aside className="layout-side__aside" aria-label="বিভাগ" style={{ maxWidth: 280 }}>
        <MobileFilters label="বিভাগ বেছে নিন" activeCount={state.category === 'all' ? 0 : 1}>
          <nav className="card" style={{ padding: 10 }} aria-labelledby="fcat-h">
            <h2
              id="fcat-h"
              className="t-small"
              style={{
                fontFamily: 'var(--rh-font-body)',
                fontWeight: 600,
                color: 'var(--rh-muted)',
                padding: '8px 12px',
              }}
            >
              বিভাগ
            </h2>
            {[{ id: 0, slug: 'all', name: 'সব বিভাগ', threadCount: total }, ...categories].map(
              (c) => (
                <button
                  key={c.slug}
                  type="button"
                  className={cn('cat-link', state.category === c.slug && 'is-active')}
                  aria-pressed={state.category === c.slug}
                  onClick={() =>
                    void setState({ category: c.slug === 'all' ? null : c.slug, page: null })
                  }
                  style={{
                    width: '100%',
                    border: 0,
                    background: 'none',
                    font: 'inherit',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ flex: 1 }}>{c.name}</span>
                  <span className="t-caption t-muted">{bn(c.threadCount)}</span>
                </button>
              ),
            )}
          </nav>
        </MobileFilters>
      </aside>
      <div className="layout-side__main">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div className="tabs" role="tablist" aria-label="সাজানো" style={{ borderBottom: 0 }}>
            {SORTS.map((s) => (
              <button
                key={s.value}
                type="button"
                role="tab"
                className={cn('tab', state.sort === s.value && 'is-active')}
                aria-selected={state.sort === s.value}
                data-state={state.sort === s.value ? 'active' : 'inactive'}
                onClick={() =>
                  void setState({ sort: s.value === 'recent' ? null : s.value, page: null })
                }
              >
                {s.label}
              </button>
            ))}
          </div>
          <span className="t-small t-muted" role="status">
            {data ? `${bn(data.totalDocs)}টি আলোচনা` : 'খোঁজা হচ্ছে…'}
          </span>
        </div>
        <div
          className="card"
          style={{
            overflow: 'hidden',
            opacity: isFetching ? 0.65 : 1,
            transition: 'opacity 200ms',
          }}
        >
          <div
            className="thread-row"
            aria-hidden="true"
            style={{
              paddingBlock: 10,
              background: 'var(--rh-sage)',
              fontSize: 13,
              color: 'var(--rh-muted)',
              fontWeight: 600,
            }}
          >
            <span />
            <span>আলোচনা</span>
            <span className="thread-stat">উত্তর</span>
            <span className="thread-stat">দেখা</span>
            <span className="thread-last">সর্বশেষ</span>
          </div>
          {isPending && !data ? (
            <div style={{ padding: 20 }}>
              <Skeleton style={{ height: 240 }} />
            </div>
          ) : data && data.docs.length ? (
            data.docs.map((t) => (
              <Link key={t.id} href={threadHref(t)} className="thread-row">
                <UserAvatar name={t.author.name} tone={t.author.tone} />
                <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="thread-row__title">{t.title}</span>
                  <span
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '6px 10px',
                      fontSize: 13,
                      color: 'var(--rh-muted)',
                    }}
                  >
                    {t.pinned ? (
                      <Badge variant="level" style={{ height: 24 }}>
                        পিন করা
                      </Badge>
                    ) : null}
                    {t.category ? (
                      <Badge variant="cat" style={{ height: 24 }}>
                        {t.category.name}
                      </Badge>
                    ) : null}
                    {t.hasHelpful ? (
                      <Badge variant="reviewed" style={{ height: 24 }}>
                        সহায়ক উত্তর আছে
                      </Badge>
                    ) : t.replyCount === 0 ? (
                      <Badge variant="warning" style={{ height: 24 }}>
                        উত্তরহীন
                      </Badge>
                    ) : null}
                    <span>{t.author.name}</span>
                  </span>
                </span>
                <span className="thread-stat">
                  <strong>{bn(t.replyCount)}</strong>
                  <span>উত্তর</span>
                </span>
                <span className="thread-stat">
                  <strong>{bnCompact(t.viewCount)}</strong>
                  <span>দেখা</span>
                </span>
                <span className="thread-last t-small t-muted">
                  <RelativeTime value={t.lastActivityAt} />
                </span>
              </Link>
            ))
          ) : (
            <div className="empty">
              <span className="empty__icon">
                <MessagesSquare className="ic ic-lg" aria-hidden="true" />
              </span>
              <h2 className="t-h4">এখানে এখনো কোনো আলোচনা নেই</h2>
              <p className="t-small t-muted">প্রথম আলোচনাটি আপনিই শুরু করুন।</p>
              <NewThreadButton categories={categories} size="sm" />
            </div>
          )}
        </div>
        {data && data.totalPages > 1 ? (
          <div style={{ marginTop: 28 }}>
            <Pager
              page={data.page}
              totalPages={data.totalPages}
              hrefFor={(p) => `/forum?page=${p}`}
              onPage={(p) => void setState({ page: p > 1 ? p : null })}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
