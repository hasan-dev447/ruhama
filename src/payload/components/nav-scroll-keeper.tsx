'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const KEY = 'rh-admin-nav-scroll'

const read = () => {
  try {
    return Number(sessionStorage.getItem(KEY)) || 0
  } catch {
    return 0
  }
}

const write = (top: number) => {
  try {
    sessionStorage.setItem(KEY, String(Math.round(top)))
  } catch {
    // private mode or blocked storage: the menu simply starts at the top
  }
}

/** Keeps the current item in sight: restore the saved position, then nudge only if it is hidden. */
function restore(scroller: HTMLElement) {
  scroller.scrollTop = read()
  const active = scroller.querySelector<HTMLElement>(
    '.nav__link:not(a), .nav__link:has(.nav__link-indicator)',
  )
  if (!active) return
  const box = scroller.getBoundingClientRect()
  const item = active.getBoundingClientRect()
  if (item.top < box.top + 48 || item.bottom > box.bottom - 24)
    active.scrollIntoView({ block: 'center' })
}

/**
 * Payload renders the sidebar as part of each page, so moving to another section builds a new one
 * that starts scrolled to the top. This remembers where the menu was (per tab) and puts it back, so
 * the item just clicked stays where it was.
 */
export function NavScrollKeeper() {
  const pathname = usePathname()

  useEffect(() => {
    function onScroll(e: Event) {
      const el = e.target
      if (el instanceof HTMLElement && el.classList.contains('nav__scroll')) write(el.scrollTop)
    }
    // scroll does not bubble, so listen in the capture phase
    document.addEventListener('scroll', onScroll, true)

    // a freshly built sidebar is put back where the old one was
    const seen = new WeakSet<Element>()
    const check = () => {
      const scroller = document.querySelector<HTMLElement>('.nav__scroll')
      if (scroller && !seen.has(scroller)) {
        seen.add(scroller)
        restore(scroller)
      }
    }
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      document.removeEventListener('scroll', onScroll, true)
      observer.disconnect()
    }
  }, [])

  // the same sidebar can stay mounted between pages; keep the new current item in sight then too
  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>('.nav__scroll')
    if (scroller) requestAnimationFrame(() => restore(scroller))
  }, [pathname])

  return null
}
