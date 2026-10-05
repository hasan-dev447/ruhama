'use client'

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCheck, CircleCheck, SlidersHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button, ButtonLink } from '@/components/ui/button'
import { InfiniteSentinel } from '@/components/ui/infinite-sentinel'
import { Skeleton } from '@/components/ui/primitives'
import {
  notificationKeys,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  type NotificationItem,
  type NotificationPage,
} from '@/hooks/use-notifications'
import { useBroadcast } from '@/hooks/use-realtime'
import { apiFetch } from '@/lib/api-client'
import { authClient } from '@/lib/auth/client'
import { bn, formatDate, formatRelative, TIME_ZONE } from '@/lib/format'
import { cn } from '@/lib/utils'

import { NotifIcon } from './notif-icon'

const dayKey = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(d)

/** "আজ", "গতকাল", "এই সপ্তাহে", then the date. */
function groupLabel(iso: string, now = new Date()): string {
  const d = new Date(iso)
  const today = dayKey(now)
  const yesterday = dayKey(new Date(now.getTime() - 86400000))
  const key = dayKey(d)
  if (key === today) return 'আজ'
  if (key === yesterday) return 'গতকাল'
  if (now.getTime() - d.getTime() < 7 * 86400000) return 'এই সপ্তাহে'
  return formatDate(d).split(' ').slice(1).join(' ')
}

export function NotificationList() {
  const router = useRouter()
  const qc = useQueryClient()
  const { data: session } = authClient.useSession()
  const [tab, setTab] = useState<'all' | 'unread'>('all')
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  useBroadcast(session?.user ? `user:${session.user.id}` : null, 'notification', () => {
    void qc.invalidateQueries({ queryKey: notificationKeys.all })
  })

  const query = useInfiniteQuery({
    queryKey: notificationKeys.list({ page: 'infinite', tab }),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      apiFetch<NotificationPage>(
        `/me/notifications?limit=20&page=${pageParam}${tab === 'unread' ? '&unread=1' : ''}`,
      ),
    getNextPageParam: (last) => last.nextPage ?? undefined,
    enabled: Boolean(session?.user),
  })
  const items = query.data?.pages.flatMap((p) => p.docs) ?? []
  const unread = query.data?.pages[0]?.unreadCount ?? 0

  const groups: { label: string; items: NotificationItem[] }[] = []
  for (const n of items) {
    const label = groupLabel(n.createdAt)
    const last = groups[groups.length - 1]
    if (last?.label === label) last.items.push(n)
    else groups.push({ label, items: [n] })
  }

  function open(n: NotificationItem) {
    if (!n.read) markRead.mutate(n.id)
    if (!n.link) return
    if (n.link.startsWith('/admin')) window.location.assign(n.link)
    else router.push(n.link)
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          marginTop: 18,
        }}
      >
        <div>
          <h1 className="t-h1">নোটিফিকেশন</h1>
          <p className="t-muted" role="status" style={{ marginTop: 4 }}>
            {query.isPending
              ? 'লোড হচ্ছে…'
              : unread
                ? `${bn(unread)}টি অপঠিত নোটিফিকেশন`
                : 'সব নোটিফিকেশন পড়া হয়েছে'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={!unread}
            pending={markAll.isPending}
          >
            <CheckCheck className="ic" aria-hidden="true" />
            সব পড়া হয়েছে
          </Button>
          <ButtonLink href="/settings#notify" variant="ghost" size="sm">
            <SlidersHorizontal className="ic" aria-hidden="true" />
            পছন্দ ঠিক করুন
          </ButtonLink>
        </div>
      </div>
      <div className="tabs" role="tablist" aria-label="ফিল্টার" style={{ marginTop: 24 }}>
        {(['all', 'unread'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            className={cn('tab', tab === t && 'is-active')}
            aria-selected={tab === t}
            data-state={tab === t ? 'active' : 'inactive'}
            onClick={() => setTab(t)}
          >
            {t === 'all' ? 'সব' : `অপঠিত${unread ? ` (${bn(unread)})` : ''}`}
          </button>
        ))}
      </div>
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 28, marginTop: 24 }}
        role="tabpanel"
      >
        {query.isPending ? (
          <Skeleton style={{ height: 260, borderRadius: 'var(--rh-radius-lg)' }} />
        ) : groups.length ? (
          <>
            {groups.map((g) => (
              <section key={g.label} aria-label={g.label}>
                <h2
                  className="t-small"
                  style={{
                    fontFamily: 'var(--rh-font-body)',
                    fontWeight: 600,
                    color: 'var(--rh-muted)',
                    marginBottom: 10,
                  }}
                >
                  {g.label}
                </h2>
                <div className="card" style={{ overflow: 'hidden' }}>
                  {g.items.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className={cn('notif-item', !n.read && 'is-unread')}
                      onClick={() => open(n)}
                      style={{ padding: '18px 20px' }}
                    >
                      <NotifIcon kind={n.kind} />
                      <span className="notif-item__text">
                        <p style={{ fontWeight: n.read ? 400 : 600 }}>{n.text}</p>
                        <time dateTime={n.createdAt}>{formatRelative(n.createdAt)}</time>
                      </span>
                      {!n.read ? <span className="unread-dot" aria-label="অপঠিত" /> : null}
                    </button>
                  ))}
                </div>
              </section>
            ))}
            <InfiniteSentinel
              hasMore={Boolean(query.hasNextPage)}
              loading={query.isFetchingNextPage}
              onLoadMore={() => void query.fetchNextPage()}
            />
          </>
        ) : (
          <div className="card">
            <div className="empty">
              <span
                className="empty__icon"
                style={{ background: 'var(--rh-success-soft)', color: 'var(--rh-success)' }}
              >
                <CircleCheck className="ic ic-lg" aria-hidden="true" />
              </span>
              <h2 className="t-h4">
                {tab === 'unread' ? 'সব পড়া হয়ে গেছে' : 'এখনো কোনো নোটিফিকেশন নেই'}
              </h2>
              <p className="t-small t-muted">
                নতুন কিছু এলে এখানে দেখাবে। ততক্ষণে আজকের আয়াতটি পড়ে নিতে পারেন।
              </p>
              <ButtonLink href="/" variant="secondary" size="sm">
                হোমে যান
              </ButtonLink>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
