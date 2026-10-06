'use client'

import { Bell, CheckCheck } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { formatRelative } from '@/lib/format'

type Item = {
  id: string
  kind: string
  text: string
  link?: string | null
  read: boolean
  createdAt: string
}
type Feed = { docs: Item[]; unreadCount: number }

const REFRESH_MS = 60_000

async function call<T>(path: string, method: 'GET' | 'POST' = 'GET'): Promise<T | null> {
  try {
    const res = await fetch(`/api/v1${path}`, { method, credentials: 'include' })
    return res.ok ? ((await res.json()) as T) : null
  } catch {
    return null
  }
}

/** Bell in the admin header: review requests, reports and other notices for the signed-in staff member. */
export function AdminNotifications() {
  const [feed, setFeed] = useState<Feed | null>(null)
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const data = await call<Feed>('/me/notifications?limit=8')
    if (data) setFeed(data)
  }, [])

  useEffect(() => {
    // first load through a promise callback (not a synchronous setState in the effect)
    call<Feed>('/me/notifications?limit=8').then((data) => data && setFeed(data))
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, REFRESH_MS)
    const onFocus = () => void load()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [load])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function openItem(item: Item) {
    if (!item.read) {
      setFeed((f) =>
        f
          ? {
              unreadCount: Math.max(0, f.unreadCount - 1),
              docs: f.docs.map((d) => (d.id === item.id ? { ...d, read: true } : d)),
            }
          : f,
      )
      void call(`/me/notifications/${item.id}/read`, 'POST')
    }
    setOpen(false)
    if (item.link) window.location.assign(item.link)
  }

  async function readAll() {
    setFeed((f) => (f ? { unreadCount: 0, docs: f.docs.map((d) => ({ ...d, read: true })) } : f))
    await call('/me/notifications/read-all', 'POST')
  }

  const unread = feed?.unreadCount ?? 0

  return (
    <div className="rh-bell" ref={wrap}>
      <button
        type="button"
        className="rh-bell__btn"
        aria-label={unread ? `নোটিফিকেশন, ${unread}টি নতুন` : 'নোটিফিকেশন'}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => {
          setOpen((o) => !o)
          if (!open) void load()
        }}
      >
        <Bell size={18} aria-hidden="true" />
        {unread ? (
          <span className="rh-bell__count">
            {unread > 9 ? '৯+' : unread.toLocaleString('bn-BD')}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="rh-bell__panel" role="dialog" aria-label="নোটিফিকেশন">
          <div className="rh-bell__head">
            <strong>নোটিফিকেশন</strong>
            {unread ? (
              <button type="button" className="rh-bell__readall" onClick={readAll}>
                <CheckCheck size={14} aria-hidden="true" /> সব পড়া হয়েছে
              </button>
            ) : null}
          </div>
          {!feed ? (
            <p className="rh-bell__empty">লোড হচ্ছে…</p>
          ) : feed.docs.length === 0 ? (
            <p className="rh-bell__empty">এখনো কোনো নোটিফিকেশন নেই।</p>
          ) : (
            <ul className="rh-bell__list">
              {feed.docs.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`rh-bell__item${item.read ? '' : ' is-unread'}`}
                    onClick={() => openItem(item)}
                  >
                    <span className="rh-bell__dot" aria-hidden="true" />
                    <span className="rh-bell__text">
                      <span>{item.text}</span>
                      <time dateTime={item.createdAt}>{formatRelative(item.createdAt)}</time>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <a className="rh-bell__all" href="/notifications" target="_blank" rel="noopener">
            সব নোটিফিকেশন দেখুন
          </a>
        </div>
      ) : null}
    </div>
  )
}
