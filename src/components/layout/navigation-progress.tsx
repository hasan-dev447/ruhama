'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function Progress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const routeKey = `${pathname}?${searchParams?.toString() ?? ''}`
  // the bar shows while we are still on the route the click started from
  const [startedOn, setStartedOn] = useState<string | null>(null)
  const active = startedOn === routeKey

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return
      const anchor = (e.target as HTMLElement | null)?.closest('a')
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:'))
        return
      const url = new URL(anchor.href, window.location.href)
      if (
        url.origin !== window.location.origin ||
        url.pathname.startsWith('/admin') ||
        url.pathname.startsWith('/api')
      )
        return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return
      setStartedOn(`${window.location.pathname}?${window.location.search.replace(/^\?/, '')}`)
      // safety net for navigations that never complete (offline, cancelled)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setStartedOn(null), 10_000)
    }
    // back/forward never shows the bar, and must not revive an old one
    const onPop = () => setStartedOn(null)
    let timer = 0
    document.addEventListener('click', onClick, true)
    window.addEventListener('popstate', onPop)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', onPop)
      window.clearTimeout(timer)
    }
  }, [])

  if (!active) return null
  return (
    <div className="nav-progress" aria-hidden="true">
      <span />
    </div>
  )
}

/** Thin gold bar while a client-side navigation is in flight. */
export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <Progress />
    </Suspense>
  )
}
