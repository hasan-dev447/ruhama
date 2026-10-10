'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  IconDelete,
  IconHelpful,
  IconInfo,
  IconModeration,
  IconReply,
  IconReport,
  IconSuccess,
} from '@/components/icons'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, use, useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import {
  createPostAction,
  markHelpfulAnswerAction,
  moderateAction,
  reportContentAction,
  softDeleteAction,
  toggleHelpfulAction,
} from '@/actions/forum'
import { Button } from '@/components/ui/button'
import { CheckCard, Field, FormAlert, Textarea } from '@/components/ui/form'
import { ConfirmModal, Modal } from '@/components/ui/modal'
import { UserAvatar } from '@/components/ui/user-avatar'
import { fallbackInterval, useBroadcast } from '@/hooks/use-realtime'
import { apiFetch } from '@/lib/api-client'
import { authClient } from '@/lib/auth/client'
import { bn, formatRelative, initials } from '@/lib/format'
import { useAbilities } from '@/components/auth/use-abilities'
import { cn } from '@/lib/utils'

type ViewerState = { helpful: number[]; pending: { id: number; body: string; createdAt: string }[] }
type Ctx = {
  threadId: number
  replyTo: { id: number; name: string } | null
  setReplyTo: (r: { id: number; name: string } | null) => void
  focusReply: () => void
  registerReply: (el: HTMLTextAreaElement | null) => void
}

const ThreadContext = createContext<Ctx | null>(null)
const stateKey = (threadId: number) => ['me', 'forum', threadId] as const

function useViewer() {
  const { data: session } = authClient.useSession()
  const user = session?.user as
    | ({ id: string; username?: string | null; role?: unknown; name: string } & Record<
        string,
        unknown
      >)
    | undefined
  const { moderate: isModerator } = useAbilities(user)
  return { user, isModerator, userId: user ? Number(user.id) : null }
}

function useThreadState(threadId: number) {
  const { user } = useViewer()
  return useQuery({
    queryKey: stateKey(threadId),
    queryFn: () => apiFetch<ViewerState>(`/me/forum/threads/${threadId}`),
    enabled: Boolean(user),
  })
}

/** Shares reply targeting between post buttons and the reply box; refreshes on live updates. */
export function ThreadProvider({
  threadId,
  children,
}: {
  threadId: number
  children: React.ReactNode
}) {
  const router = useRouter()
  const qc = useQueryClient()
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null)
  const replyEl = useRef<HTMLTextAreaElement | null>(null)

  useBroadcast(`thread:${threadId}`, '*', () => {
    router.refresh()
    void qc.invalidateQueries({ queryKey: stateKey(threadId) })
  })

  // without Supabase Realtime, refresh the thread periodically instead
  useEffect(() => {
    const every = fallbackInterval(45_000)
    if (!every) return
    const t = setInterval(() => router.refresh(), every)
    return () => clearInterval(t)
  }, [router])

  // approximate view counter; the API ignores repeats within an hour
  useEffect(() => {
    void apiFetch(`/forum/threads/${threadId}/view`, { method: 'POST' }).catch(() => undefined)
  }, [threadId])

  return (
    <ThreadContext
      value={{
        threadId,
        replyTo,
        setReplyTo,
        focusReply: () => {
          replyEl.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          replyEl.current?.focus({ preventScroll: true })
        },
        registerReply: (el) => {
          replyEl.current = el
        },
      }}
    >
      {children}
    </ThreadContext>
  )
}

function ReportModal({
  open,
  onOpenChange,
  target,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  target: { type: 'thread' | 'post'; id: number }
}) {
  const { threadId } = use(ThreadContext)!
  const router = useRouter()
  const [reason, setReason] = useState<'disrespect' | 'unsourced' | 'partisan' | 'spam' | null>(
    null,
  )
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const REASONS = [
    ['disrespect', 'কটাক্ষ বা অসম্মানজনক ভাষা'],
    ['unsourced', 'উৎসবিহীন বা ভুল দলিল'],
    ['partisan', 'দলীয় বা রাজনৈতিক প্রচারণা'],
    ['spam', 'স্প্যাম বা বিজ্ঞাপন'],
  ] as const

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason) return setError('একটি কারণ বেছে নিন।')
    setError(null)
    start(async () => {
      const res = await reportContentAction(
        { targetType: target.type, id: target.id, reason, note: note || undefined },
        threadId,
      )
      if (!res.ok) {
        setError(res.error)
        return
      }
      onOpenChange(false)
      setReason(null)
      setNote('')
      toast.success('রিপোর্ট পাঠানো হয়েছে', {
        description: 'জাযাকাল্লাহু খাইরান। মডারেটর ২৪ ঘণ্টার মধ্যে দেখবেন।',
      })
      if (res.data.hidden) router.refresh()
    })
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="পোস্টটি রিপোর্ট করুন"
      description="রিপোর্টকারীর পরিচয় গোপন রাখা হয়। মডারেটর ২৪ ঘণ্টার মধ্যে দেখবেন।"
      width={480}
      onSubmit={submit}
    >
      {error ? <FormAlert>{error}</FormAlert> : null}
      <fieldset
        style={{
          border: 0,
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <legend className="sr-only">কারণ</legend>
        {REASONS.map(([value, label]) => (
          <CheckCard
            key={value}
            type="radio"
            name="report-reason"
            label={label}
            checked={reason === value}
            onChange={() => setReason(value)}
          />
        ))}
      </fieldset>
      <Field label="আরও কিছু জানাতে চান?" optional htmlFor="rp-note">
        <Textarea
          id="rp-note"
          style={{ minHeight: 80 }}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
          বাতিল
        </Button>
        <Button type="submit" pending={pending}>
          রিপোর্ট পাঠান
        </Button>
      </div>
    </Modal>
  )
}

function ModeratorMenu({ target }: { target: { type: 'thread' | 'post'; id: number } }) {
  const { threadId } = use(ThreadContext)!
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [mute, setMute] = useState(0)
  const [pending, start] = useTransition()
  function act(action: 'hide' | 'remove') {
    start(async () => {
      const res = await moderateAction(
        {
          targetType: target.type,
          id: target.id,
          action,
          reason: reason || undefined,
          muteDays: mute || undefined,
        },
        threadId,
      )
      if (!res.ok) {
        toast.error('সম্পন্ন করা যায়নি', { description: res.error })
        return
      }
      setOpen(false)
      toast.success(action === 'hide' ? 'লুকানো হয়েছে' : 'সরানো হয়েছে')
      if (target.type === 'thread') router.push('/forum')
      else router.refresh()
    })
  }
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} aria-label="মডারেশন">
        <IconModeration className="ic" aria-hidden="true" />
        মডারেশন
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="মডারেশন"
        description="সরানো পোস্ট অন্যদের কাছে “আদব নীতিমালা ভঙ্গের কারণে সরানো হয়েছে” হিসেবে দেখাবে।"
        width={460}
      >
        <Field label="কারণ (লেখককে জানানো হবে)" htmlFor="mod-reason">
          <Textarea
            id="mod-reason"
            style={{ minHeight: 72 }}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        <Field label="লেখকের পোস্ট বন্ধ রাখুন" htmlFor="mod-mute">
          <select
            id="mod-mute"
            className="select"
            value={mute}
            onChange={(e) => setMute(Number(e.target.value))}
          >
            <option value={0}>বন্ধ নয়</option>
            <option value={1}>১ দিন</option>
            <option value={7}>৭ দিন</option>
            <option value={30}>৩০ দিন</option>
          </select>
        </Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => act('hide')} pending={pending}>
            লুকান
          </Button>
          <Button variant="danger" onClick={() => act('remove')} pending={pending}>
            সরিয়ে দিন
          </Button>
        </div>
      </Modal>
    </>
  )
}

/** Footer of the opening post. */
export function ThreadActions({ authorId }: { authorId: number | null }) {
  const { threadId, focusReply, setReplyTo } = use(ThreadContext)!
  const router = useRouter()
  const pathname = usePathname()
  const { user, userId, isModerator } = useViewer()
  const [reportOpen, setReportOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, start] = useTransition()
  const own = userId !== null && authorId === userId

  function needLogin() {
    router.push(`/login?next=${encodeURIComponent(pathname ?? '/forum')}`)
  }
  function remove() {
    start(async () => {
      const res = await softDeleteAction('thread', threadId, threadId)
      if (!res.ok) {
        toast.error('মুছে ফেলা যায়নি', { description: res.error })
        return
      }
      setConfirmOpen(false)
      toast.success('আলোচনাটি মুছে ফেলা হয়েছে')
      router.push('/forum')
    })
  }

  return (
    <div className="post__foot">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (!user) return needLogin()
          setReplyTo(null)
          focusReply()
        }}
      >
        <IconReply className="ic" aria-hidden="true" />
        উত্তর দিন
      </Button>
      <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
        {own ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            aria-label="আলোচনা মুছুন"
          >
            <IconDelete className="ic" aria-hidden="true" />
            মুছুন
          </Button>
        ) : user ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReportOpen(true)}
            aria-label="মূল পোস্ট রিপোর্ট করুন"
          >
            <IconReport className="ic" aria-hidden="true" />
            রিপোর্ট
          </Button>
        ) : null}
        {isModerator ? <ModeratorMenu target={{ type: 'thread', id: threadId }} /> : null}
      </span>
      <ReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        target={{ type: 'thread', id: threadId }}
      />
      <ConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="আলোচনাটি মুছে ফেলবেন?"
        description="আলোচনা ও এর সব উত্তর ফোরাম থেকে সরে যাবে।"
        confirmLabel="মুছে ফেলুন"
        onConfirm={remove}
        pending={pending}
      />
    </div>
  )
}

/** Footer of a reply: helpful, reply, mark as most helpful, report or delete. */
export function PostActions({
  post,
  threadAuthorId,
  helpfulPostId,
}: {
  post: { id: number; authorId: number | null; authorName: string; helpfulCount: number }
  threadAuthorId: number | null
  helpfulPostId: number | null
}) {
  const { threadId, focusReply, setReplyTo } = use(ThreadContext)!
  const qc = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()
  const { user, userId, isModerator } = useViewer()
  const { data: viewer } = useThreadState(threadId)
  const [reportOpen, setReportOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [count, setCount] = useState(post.helpfulCount)
  const [pending, start] = useTransition()
  const liked = Boolean(viewer?.helpful.includes(post.id))
  const own = userId !== null && post.authorId === userId
  const isThreadOwner = userId !== null && threadAuthorId === userId

  function needLogin() {
    router.push(`/login?next=${encodeURIComponent(pathname ?? '/forum')}`)
  }
  function like() {
    if (!user) return needLogin()
    const next = !liked
    qc.setQueryData<ViewerState>(stateKey(threadId), (prev) => ({
      pending: prev?.pending ?? [],
      helpful: next
        ? [...(prev?.helpful ?? []), post.id]
        : (prev?.helpful ?? []).filter((id) => id !== post.id),
    }))
    setCount((c) => c + (next ? 1 : -1))
    void toggleHelpfulAction(post.id, threadId).then((res) => {
      if (!res.ok) {
        void qc.invalidateQueries({ queryKey: stateKey(threadId) })
        setCount(post.helpfulCount)
        toast.error('সম্পন্ন করা যায়নি', { description: res.error })
      } else setCount(res.data.count)
    })
  }
  function markBest() {
    start(async () => {
      const res = await markHelpfulAnswerAction(post.id, threadId)
      if (!res.ok) {
        toast.error('সম্পন্ন করা যায়নি', { description: res.error })
        return
      }
      toast.success(res.data.helpfulPost ? 'সহায়ক উত্তর চিহ্নিত হয়েছে' : 'চিহ্ন সরানো হয়েছে')
      router.refresh()
    })
  }
  function remove() {
    start(async () => {
      const res = await softDeleteAction('post', post.id, threadId)
      if (!res.ok) {
        toast.error('মুছে ফেলা যায়নি', { description: res.error })
        return
      }
      setConfirmOpen(false)
      toast.success('উত্তরটি মুছে ফেলা হয়েছে')
      router.refresh()
    })
  }

  return (
    <div className="post__foot">
      <Button
        variant="ghost"
        size="sm"
        className={cn(liked && 'is-active')}
        aria-pressed={liked}
        onClick={like}
        disabled={own}
        title={own ? 'নিজের উত্তর নিজে সহায়ক চিহ্নিত করা যায় না' : undefined}
      >
        <IconHelpful className="ic" aria-hidden="true" fill={liked ? 'currentColor' : 'none'} />
        সহায়ক · {bn(count)}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (!user) return needLogin()
          setReplyTo({ id: post.id, name: post.authorName })
          focusReply()
        }}
      >
        <IconReply className="ic" aria-hidden="true" />
        উত্তর
      </Button>
      {(isThreadOwner || isModerator) && !own ? (
        <Button variant="ghost" size="sm" onClick={markBest} pending={pending}>
          <IconSuccess className="ic" aria-hidden="true" />
          {helpfulPostId === post.id ? 'সহায়ক চিহ্ন সরান' : 'সবচেয়ে সহায়ক'}
        </Button>
      ) : null}
      <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
        {own ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            aria-label="উত্তর মুছুন"
          >
            <IconDelete className="ic" aria-hidden="true" />
            মুছুন
          </Button>
        ) : user ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReportOpen(true)}
            aria-label={`${post.authorName}-এর উত্তর রিপোর্ট করুন`}
          >
            <IconReport className="ic" aria-hidden="true" />
            রিপোর্ট
          </Button>
        ) : null}
        {isModerator ? <ModeratorMenu target={{ type: 'post', id: post.id }} /> : null}
      </span>
      <ReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        target={{ type: 'post', id: post.id }}
      />
      <ConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="উত্তরটি মুছে ফেলবেন?"
        confirmLabel="মুছে ফেলুন"
        onConfirm={remove}
        pending={pending}
      />
    </div>
  )
}

/** The member's own replies that are still waiting for a moderator. */
export function MyPendingPosts() {
  const { threadId } = use(ThreadContext)!
  const { user } = useViewer()
  const { data } = useThreadState(threadId)
  if (!user || !data?.pending.length) return null
  return (
    <>
      {data.pending.map((p) => (
        <article key={p.id} className="card post" style={{ opacity: 0.85, borderStyle: 'dashed' }}>
          <div className="post__head">
            <UserAvatar name={user.name} tone="gold" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ display: 'block', lineHeight: 1.4 }}>{user.name}</strong>
              <span className="t-caption t-muted">{formatRelative(p.createdAt)}</span>
            </div>
            <span className="badge badge-warning">মডারেশনে আছে</span>
          </div>
          <div className="post__body">
            <p style={{ whiteSpace: 'pre-line' }}>{p.body}</p>
          </div>
        </article>
      ))}
    </>
  )
}

export function ReplyBox({ locked }: { locked: boolean }) {
  const { threadId, replyTo, setReplyTo, registerReply } = use(ThreadContext)!
  const qc = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useViewer()
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  if (locked) {
    return (
      <div className="privacy-note">
        <IconInfo className="ic" aria-hidden="true" />
        <span>এই আলোচনায় নতুন উত্তর বন্ধ করা হয়েছে।</span>
      </div>
    )
  }
  if (!user) {
    return (
      <div
        className="card card-pad"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <span>আলোচনায় অংশ নিতে লগইন করুন।</span>
        <Button
          onClick={() => router.push(`/login?next=${encodeURIComponent(pathname ?? '/forum')}`)}
        >
          লগইন করুন
        </Button>
      </div>
    )
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const res = await createPostAction({ threadId, body, parentId: replyTo?.id })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setBody('')
      setReplyTo(null)
      if (res.data.status === 'published') {
        toast.success('উত্তর প্রকাশিত হয়েছে')
        router.refresh()
      } else {
        toast.info('উত্তরটি মডারেশনে আছে', { description: 'মডারেটর দেখার পর সবাই দেখতে পাবেন।' })
        void qc.invalidateQueries({ queryKey: stateKey(threadId) })
      }
    })
  }

  return (
    <form
      className="card card-pad"
      aria-labelledby="rb-h"
      onSubmit={submit}
      style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}
      noValidate
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="avatar avatar--gold" aria-hidden="true">
          {initials(user.name)}
        </span>
        <h2 id="rb-h" className="t-h4" style={{ fontSize: 18 }}>
          আপনার উত্তর
        </h2>
      </div>
      {replyTo ? (
        <div className="t-small" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {replyTo.name}-এর উত্তরের জবাব দিচ্ছেন
          <button
            type="button"
            className="link"
            style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0 }}
            onClick={() => setReplyTo(null)}
          >
            বাতিল
          </button>
        </div>
      ) : null}
      {error ? <FormAlert>{error}</FormAlert> : null}
      <label htmlFor="rb-text" className="sr-only">
        আপনার উত্তর
      </label>
      <Textarea
        id="rb-text"
        ref={registerReply}
        placeholder="নিজের অভিজ্ঞতা বা দলিলসহ পরামর্শ লিখুন"
        maxLength={6000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <span
          className="t-caption t-muted"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <IconInfo className="ic ic-sm" aria-hidden="true" />
          দলিল উল্লেখ করলে উৎস দিন। কারো ব্যক্তিগত সমালোচনা নয়।
        </span>
        <Button type="submit" disabled={body.trim().length < 2} pending={pending}>
          উত্তর প্রকাশ করুন
        </Button>
      </div>
    </form>
  )
}
