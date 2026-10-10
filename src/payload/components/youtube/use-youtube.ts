'use client'

import { useCallback, useEffect, useState } from 'react'

export type Connection = {
  id: number
  channelTitle?: string | null
  channelHandle?: string | null
  channelThumb?: string | null
  status?: 'active' | 'revoked' | null
}

export type YouTubeStatus = { enabled: boolean; allowed: boolean; connections: Connection[] }

export type ChannelVideo = {
  id: string
  title: string
  thumb: string
  publishedAt: string | null
  privacy: 'public' | 'unlisted' | 'private' | 'unknown'
  embeddable: boolean
  durationSeconds: number | null
  live: boolean
}

const BASE = '/api/v1/integrations/youtube'

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include', ...init })
  const json = (await res.json().catch(() => null)) as (T & { error?: { message?: string } }) | null
  if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`)
  return json as T
}

// one status request shared by every video field on the page (a recap can have several)
let shared: { at: number; promise: Promise<YouTubeStatus> } | null = null
function loadStatus(force: boolean) {
  const age = shared ? Date.now() - shared.at : Infinity
  if (!shared || age > 30_000 || (force && age > 2_000)) {
    const promise = api<YouTubeStatus>('/status')
    promise.catch(() => (shared = null))
    shared = { at: Date.now(), promise }
  }
  return shared.promise
}

/**
 * The current user's YouTube setup, and a connect() that opens Google's consent screen in a popup.
 * The popup reports back over BroadcastChannel (Google's page may cut it off from window.opener),
 * and the status is also re-read when this window regains focus.
 */
export function useYouTube(active = true) {
  const [status, setStatus] = useState<YouTubeStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!active) return
    let alive = true
    loadStatus(reload > 0)
      .then((s) => alive && (setStatus(s), setError(null)))
      .catch((e: Error) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [active, reload])

  const refresh = useCallback(() => setReload((n) => n + 1), [])

  useEffect(() => {
    if (!active) return
    let channel: BroadcastChannel | null = null
    const onResult = (data: unknown) => {
      if ((data as { type?: string })?.type === 'ruhama:youtube') refresh()
    }
    try {
      channel = new BroadcastChannel('ruhama-youtube')
      channel.onmessage = (e) => onResult(e.data)
    } catch {
      // very old browser: the focus check below still catches it
    }
    const onMessage = (e: MessageEvent) => {
      if (e.origin === window.location.origin) onResult(e.data)
    }
    window.addEventListener('message', onMessage)
    window.addEventListener('focus', refresh)
    return () => {
      channel?.close()
      window.removeEventListener('message', onMessage)
      window.removeEventListener('focus', refresh)
    }
  }, [active, refresh])

  const connect = useCallback(() => {
    const back = window.location.pathname + window.location.search
    const url = `${BASE}/connect?return=${encodeURIComponent(back)}`
    const w = 520
    const h = 680
    const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2)
    const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2)
    const popup = window.open(
      url,
      'ruhama-youtube',
      `width=${w},height=${h},left=${left},top=${top}`,
    )
    // popups blocked: go in this tab, Google brings the user back to this page. It is an API route
    // that redirects to Google, not a Next.js page, so the router cannot be used here.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (!popup) window.location.assign(url)
  }, [])

  const disconnect = useCallback(
    async (id: number) => {
      await api(`/connections/${id}`, { method: 'DELETE' })
      refresh()
    },
    [refresh],
  )

  return { status, error, refresh, connect, disconnect }
}

export const formatSeconds = (s: number | null) => {
  if (s === null) return ''
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = h ? String(m).padStart(2, '0') : String(m)
  return `${h ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`
}
