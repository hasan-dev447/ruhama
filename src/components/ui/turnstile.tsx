'use client'

import { useTheme } from 'next-themes'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

import { TURNSTILE_SITE_KEY } from '@/lib/turnstile-site-key'

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string
  reset: (id?: string) => void
  remove: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
    __rhTurnstileLoading?: Promise<void>
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (window.__rhTurnstileLoading) return window.__rhTurnstileLoading
  window.__rhTurnstileLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => {
      window.__rhTurnstileLoading = undefined
      reject(new Error('turnstile failed to load'))
    }
    document.head.appendChild(s)
  })
  return window.__rhTurnstileLoading
}

export type TurnstileHandle = { reset: () => void }

/** Cloudflare Turnstile challenge (managed mode). Emits a token, or null when it expires. */
export const Turnstile = forwardRef<
  TurnstileHandle,
  { onToken: (token: string | null) => void; action?: string }
>(function Turnstile({ onToken, action }, ref) {
  const box = useRef<HTMLDivElement>(null)
  const widget = useRef<string | null>(null)
  const cb = useRef(onToken)
  cb.current = onToken
  const { resolvedTheme } = useTheme()

  useImperativeHandle(
    ref,
    () => ({ reset: () => window.turnstile?.reset(widget.current ?? undefined) }),
    [],
  )

  useEffect(() => {
    let cancelled = false
    loadScript()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile) return
        widget.current = window.turnstile.render(box.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action,
          language: 'bn',
          theme: resolvedTheme === 'dark' ? 'dark' : 'light',
          callback: (token: string) => cb.current(token),
          'expired-callback': () => cb.current(null),
          'error-callback': () => cb.current(null),
        })
      })
      .catch(() => cb.current(null))
    return () => {
      cancelled = true
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current)
      widget.current = null
    }
  }, [action, resolvedTheme])

  return <div ref={box} role="group" aria-label="নিরাপত্তা যাচাই" style={{ minHeight: 65 }} />
})
