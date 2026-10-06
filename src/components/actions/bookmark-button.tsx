'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { IconBookmark } from '@/components/icons'
import { usePathname, useRouter } from 'next/navigation'
import { startTransition, useOptimistic } from 'react'
import { toast } from 'sonner'

import { toggleBookmarkAction } from '@/actions/bookmarks'
import { apiFetch } from '@/lib/api-client'
import { useSession } from '@/lib/auth/client'
import { notifySavedChanged } from '@/lib/offline'
import { cn } from '@/lib/utils'

export type BookmarkTarget = {
  collection: 'articles' | 'ikhtilaf-topics' | 'videos' | 'questions' | 'ayahs' | 'hadiths'
  id: number | string
}

const keyOf = (t: BookmarkTarget) => `${t.collection}:${t.id}`
const statusKey = (t: BookmarkTarget) => ['bookmarks', 'status', keyOf(t)]

/**
 * Status requests made in the same tick are merged (up to 100 keys per request),
 * so a page with many bookmark buttons, such as a long surah, stays cheap.
 */
let pending: { key: string; resolve: (v: boolean) => void; reject: (e: unknown) => void }[] = []
let scheduled = false
function batchedStatus(key: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    pending.push({ key, resolve, reject })
    if (scheduled) return
    scheduled = true
    setTimeout(() => {
      const queue = pending
      pending = []
      scheduled = false
      for (let i = 0; i < queue.length; i += 100) {
        const chunk = queue.slice(i, i + 100)
        const keys = [...new Set(chunk.map((c) => c.key))]
        apiFetch<{ saved: Record<string, boolean> }>(
          `/me/bookmarks/status?keys=${encodeURIComponent(keys.join(','))}`,
        )
          .then((res) => chunk.forEach((c) => c.resolve(res.saved[c.key] ?? false)))
          .catch((err) => chunk.forEach((c) => c.reject(err)))
      }
    }, 0)
  })
}

/** Personal bookmark state, read on the client so the page itself stays cacheable. */
export function useBookmarkState(target: BookmarkTarget) {
  const { data: session } = useSession()
  return useQuery({
    queryKey: statusKey(target),
    queryFn: () => batchedStatus(keyOf(target)),
    enabled: Boolean(session?.user),
    staleTime: 5 * 60_000,
  })
}

export function BookmarkButton({
  target,
  variant = 'icon',
  labels = { save: 'সংরক্ষণ করুন', remove: 'সংরক্ষণ থেকে সরান' },
  className,
}: {
  target: BookmarkTarget
  variant?: 'icon' | 'outline' | 'ghost'
  labels?: { save: string; remove: string }
  className?: string
}) {
  const qc = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const { data: saved = false } = useBookmarkState(target)
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved)

  function onClick() {
    if (!session?.user) {
      toast.info('সংরক্ষণ করতে লগইন করুন')
      router.push(`/login?next=${encodeURIComponent(pathname ?? '/')}`)
      return
    }
    startTransition(async () => {
      setOptimisticSaved(!optimisticSaved)
      const res = await toggleBookmarkAction(target)
      if (!res.ok) {
        toast.error('সংরক্ষণ করা যায়নি', { description: res.error })
        return
      }
      qc.setQueryData(statusKey(target), res.data.saved)
      void qc.invalidateQueries({ queryKey: ['bookmarks', 'list'] })
      if (target.collection === 'articles') notifySavedChanged()
      toast.success(res.data.saved ? 'সংরক্ষিত হয়েছে' : 'সংরক্ষণ থেকে সরানো হয়েছে', {
        description: res.data.saved
          ? 'আপনার ড্যাশবোর্ডের “সংরক্ষিত” অংশে পাবেন।'
          : 'আবার চাইলে বুকমার্ক চাপুন।',
      })
    })
  }

  const label = optimisticSaved ? labels.remove : labels.save
  const icon = (
    <IconBookmark
      className="ic"
      aria-hidden="true"
      fill={optimisticSaved ? 'currentColor' : 'none'}
    />
  )
  if (variant === 'ghost') {
    return (
      <button
        type="button"
        className={cn('btn btn-ghost btn-sm', className)}
        aria-pressed={optimisticSaved}
        onClick={onClick}
      >
        {icon}
        {optimisticSaved ? 'সংরক্ষিত' : 'সংরক্ষণ'}
      </button>
    )
  }
  return (
    <button
      type="button"
      className={cn('btn-icon', variant === 'outline' && 'btn-icon--outline', className)}
      aria-label={label}
      aria-pressed={optimisticSaved}
      onClick={onClick}
    >
      {icon}
    </button>
  )
}
