'use client'

import { useEffect } from 'react'

import { apiFetch } from '@/lib/api-client'
import { useSession } from '@/lib/auth/client'
import {
  clearSavedOffline,
  offlineSupported,
  postToWorker,
  SAVED_CHANGED_EVENT,
} from '@/lib/offline'
import type { SavedArticle } from '@/sw/protocol'

/**
 * Registers the service worker (production only) and keeps the signed-in member's saved articles
 * available offline. Signing out clears them, whichever screen the sign-out happened on.
 */
export function OfflineSync() {
  const { data: session, isPending, error } = useSession()
  const userId = session?.user?.id ?? null

  useEffect(() => {
    if (!offlineSupported()) return
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {
      // unsupported or blocked (private mode): the site works the same, just without offline reading
    })
  }, [])

  useEffect(() => {
    if (isPending || !offlineSupported()) return
    if (!userId) {
      // signed out here, in another tab or by expiry: drop the copies. Never while offline or when the
      // session check itself failed, since that is exactly when the saved copies are needed.
      if (!error && navigator.onLine) void clearSavedOffline()
      return
    }

    let timer: ReturnType<typeof setTimeout> | undefined
    const sync = async () => {
      if (!navigator.onLine) return
      try {
        const { articles } = await apiFetch<{ articles: SavedArticle[] }>('/me/bookmarks/offline')
        await postToWorker({ type: 'SYNC_SAVED', articles }, 120_000)
      } catch {
        // next load or bookmark change will try again
      }
    }
    const schedule = () => {
      clearTimeout(timer)
      timer = setTimeout(sync, 1500)
    }
    schedule()
    window.addEventListener(SAVED_CHANGED_EVENT, schedule)
    window.addEventListener('online', schedule)
    return () => {
      clearTimeout(timer)
      window.removeEventListener(SAVED_CHANGED_EVENT, schedule)
      window.removeEventListener('online', schedule)
    }
  }, [userId, isPending, error])

  return null
}
