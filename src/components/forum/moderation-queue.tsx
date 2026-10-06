'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { IconDelete, IconHide, IconReport, IconShow, IconSuccess } from '@/components/icons'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { moderateAction } from '@/actions/forum'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/primitives'
import { RelativeTime } from '@/components/ui/relative-time'
import { apiFetch } from '@/lib/api-client'
import { bn } from '@/lib/format'
import { FLAG_LABELS, type FlagReason } from '@/lib/moderation'

type Rel<T> = (T & { id: number }) | number | null | undefined
type QueueThread = {
  id: number
  title: string
  slug?: string | null
  body: string
  status: string
  flagReasons?: string[] | null
  author?: Rel<{ name: string; username?: string | null }>
  reportCount?: number | null
  createdAt: string
}
type QueuePost = {
  id: number
  body: string
  status: string
  flagReasons?: string[] | null
  author?: Rel<{ name: string; username?: string | null }>
  thread?: Rel<{ title: string; slug?: string | null }>
  reportCount?: number | null
  createdAt: string
}
type QueueReport = {
  id: number
  targetType: 'thread' | 'post'
  thread?: Rel<{ title: string; slug?: string | null; status: string }>
  post?: Rel<{ body: string; status: string }>
  reason: string
  note?: string | null
  createdAt: string
}
type Queue = { threads: QueueThread[]; posts: QueuePost[]; reports: QueueReport[] }

const REASON_LABEL: Record<string, string> = {
  disrespect: 'কটাক্ষ বা অসম্মানজনক ভাষা',
  unsourced: 'উৎসবিহীন বা ভুল দলিল',
  partisan: 'দলীয় বা রাজনৈতিক প্রচারণা',
  spam: 'স্প্যাম বা বিজ্ঞাপন',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'অনুমোদনের অপেক্ষায়',
  hidden: 'রিপোর্টের কারণে লুকানো',
}
const obj = <T,>(v: Rel<T>): (T & { id: number }) | null => (v && typeof v === 'object' ? v : null)
const href = (t: { id: number; slug?: string | null } | null) =>
  t ? `/forum/${t.id}${t.slug ? `/${t.slug}` : ''}` : '/forum'

function Flags({ reasons }: { reasons?: string[] | null }) {
  if (!reasons?.length) return null
  return (
    <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {reasons.map((r) => (
        <Badge key={r} variant="warning">
          {FLAG_LABELS[r as FlagReason] ?? r}
        </Badge>
      ))}
    </span>
  )
}

function Decision({
  type,
  id,
  threadId,
  status,
}: {
  type: 'thread' | 'post'
  id: number
  threadId: number
  status: string
}) {
  const qc = useQueryClient()
  const [reason, setReason] = useState('')
  const [pending, start] = useTransition()
  function act(action: 'approve' | 'hide' | 'remove' | 'dismiss') {
    start(async () => {
      const res = await moderateAction(
        { targetType: type, id, action, reason: reason || undefined },
        threadId,
      )
      if (!res.ok) {
        toast.error('সম্পন্ন করা যায়নি', { description: res.error })
        return
      }
      toast.success('সিদ্ধান্ত সংরক্ষিত হয়েছে')
      void qc.invalidateQueries({ queryKey: ['forum', 'moderation'] })
    })
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 12 }}>
      <input
        className="input"
        style={{ flex: '1 1 220px', minHeight: 40 }}
        placeholder="কারণ (ঐচ্ছিক, সরালে লেখককে জানানো হবে)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        aria-label="কারণ"
      />
      <Button
        size="sm"
        onClick={() => act(status === 'pending' ? 'approve' : 'dismiss')}
        pending={pending}
      >
        <IconSuccess className="ic" aria-hidden="true" />
        {status === 'pending' ? 'অনুমোদন' : status === 'hidden' ? 'আবার দেখান' : 'রিপোর্ট খারিজ'}
      </Button>
      {status !== 'hidden' ? (
        <Button size="sm" variant="secondary" onClick={() => act('hide')} disabled={pending}>
          <IconHide className="ic" aria-hidden="true" />
          লুকান
        </Button>
      ) : null}
      <Button size="sm" variant="danger" onClick={() => act('remove')} disabled={pending}>
        <IconDelete className="ic" aria-hidden="true" />
        সরিয়ে দিন
      </Button>
    </div>
  )
}

/** Moderator inbox: flagged posts waiting for approval and open reports. */
export function ModerationQueue() {
  const { data, isPending, error } = useQuery({
    queryKey: ['forum', 'moderation'],
    queryFn: () => apiFetch<Queue>('/forum/moderation'),
    refetchInterval: 60_000,
  })
  if (isPending) return <Skeleton style={{ height: 400 }} />
  if (error || !data) return <p className="t-muted">মডারেশন কিউ লোড করা যায়নি।</p>

  const total = data.threads.length + data.posts.length + data.reports.length
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <p className="t-muted" role="status">
        {total ? `${bn(total)}টি বিষয় সিদ্ধান্তের অপেক্ষায়` : 'কিউ খালি। জাযাকাল্লাহু খাইরান!'}
      </p>

      {data.threads.length ? (
        <section aria-labelledby="mq-threads">
          <h2 id="mq-threads" className="t-h4" style={{ marginBottom: 12 }}>
            আলোচনা ({bn(data.threads.length)})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.threads.map((t) => (
              <article key={t.id} className="card card-pad">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <Badge variant={t.status === 'hidden' ? 'warning' : 'neutral'}>
                    {STATUS_LABEL[t.status] ?? t.status}
                  </Badge>
                  <Flags reasons={t.flagReasons} />
                  <span className="t-caption t-muted" style={{ marginLeft: 'auto' }}>
                    {obj(t.author)?.name ?? 'অজ্ঞাত'} · <RelativeTime value={t.createdAt} />
                  </span>
                </div>
                <h3 className="t-h4" style={{ fontSize: 18, marginTop: 10 }}>
                  {t.title}
                </h3>
                <p className="t-small clamp-3" style={{ marginTop: 6, whiteSpace: 'pre-line' }}>
                  {t.body}
                </p>
                {t.status === 'hidden' ? (
                  <Link href={href(t)} className="link t-small" target="_blank">
                    <IconShow className="ic ic-sm" aria-hidden="true" /> পুরো আলোচনা
                  </Link>
                ) : null}
                <Decision type="thread" id={t.id} threadId={t.id} status={t.status} />
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {data.posts.length ? (
        <section aria-labelledby="mq-posts">
          <h2 id="mq-posts" className="t-h4" style={{ marginBottom: 12 }}>
            উত্তর ({bn(data.posts.length)})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.posts.map((p) => {
              const thread = obj(p.thread)
              return (
                <article key={p.id} className="card card-pad">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <Badge variant={p.status === 'hidden' ? 'warning' : 'neutral'}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </Badge>
                    <Flags reasons={p.flagReasons} />
                    <span className="t-caption t-muted" style={{ marginLeft: 'auto' }}>
                      {obj(p.author)?.name ?? 'অজ্ঞাত'} · <RelativeTime value={p.createdAt} />
                    </span>
                  </div>
                  {thread ? (
                    <Link
                      href={href(thread)}
                      className="t-small link"
                      target="_blank"
                      style={{ display: 'inline-block', marginTop: 8 }}
                    >
                      আলোচনা: {thread.title}
                    </Link>
                  ) : null}
                  <p className="t-small" style={{ marginTop: 6, whiteSpace: 'pre-line' }}>
                    {p.body}
                  </p>
                  <Decision type="post" id={p.id} threadId={thread?.id ?? 0} status={p.status} />
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      {data.reports.length ? (
        <section aria-labelledby="mq-reports">
          <h2 id="mq-reports" className="t-h4" style={{ marginBottom: 12 }}>
            খোলা রিপোর্ট ({bn(data.reports.length)})
          </h2>
          <div className="card" style={{ overflow: 'hidden' }}>
            {data.reports.map((r) => {
              const thread = obj(r.thread)
              const post = obj(r.post)
              const target = r.targetType === 'post' ? post : thread
              return (
                <div
                  key={r.id}
                  className="setting-row"
                  style={{ padding: '14px 18px', alignItems: 'flex-start' }}
                >
                  <IconReport
                    className="ic"
                    aria-hidden="true"
                    style={{ color: 'var(--rh-error)', marginTop: 4 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{REASON_LABEL[r.reason] ?? r.reason}</strong>
                    <p className="clamp-2">
                      {r.targetType === 'post' ? post?.body : thread?.title}
                    </p>
                    {r.note ? <p className="t-caption">নোট: {r.note}</p> : null}
                    <span className="t-caption t-muted">
                      <RelativeTime value={r.createdAt} />
                    </span>
                    {target ? (
                      <Decision
                        type={r.targetType}
                        id={target.id}
                        threadId={thread?.id ?? 0}
                        status={target.status}
                      />
                    ) : null}
                  </div>
                  {thread ? (
                    <Link
                      href={`${href(thread)}${post ? `#post-${post.id}` : ''}`}
                      className="btn btn-ghost btn-sm"
                      target="_blank"
                    >
                      দেখুন
                    </Link>
                  ) : null}
                </div>
              )
            })}
          </div>
          <p className="t-caption t-muted" style={{ marginTop: 8 }}>
            একটি পোস্টের ওপর নেওয়া সিদ্ধান্তে সেটির সব খোলা রিপোর্ট একসাথে বন্ধ হয়।
          </p>
        </section>
      ) : null}
    </div>
  )
}
