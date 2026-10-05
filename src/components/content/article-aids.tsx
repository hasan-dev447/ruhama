'use client'

import { List } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { Heading } from '@/lib/lexical'
import { cn } from '@/lib/utils'

/** Thin gold bar at the top of the viewport that tracks how far the article has been read. */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const bar = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = document.getElementById(targetId)
    if (!el || !bar.current) return
    let frame = 0
    const update = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight * 0.6
      const ratio = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1
      if (bar.current) bar.current.style.transform = `scaleX(${ratio})`
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [targetId])
  return (
    <div className="read-progress" aria-hidden="true">
      <span ref={bar} />
    </div>
  )
}

/** Table of contents that highlights the section currently in view. Collapses into a disclosure on small screens. */
export function TableOfContents({
  headings,
  title = 'সূচিপত্র',
}: {
  headings: Heading[]
  title?: string
}) {
  const [active, setActive] = useState(headings[0]?.id ?? '')
  const [open, setOpen] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setOpen(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter((e): e is HTMLElement => Boolean(e))
    if (!els.length) return
    const onScroll = () => {
      let current = els[0]!.id
      for (const el of els) if (el.getBoundingClientRect().top < 140) current = el.id
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [headings])

  if (headings.length < 2) return null
  return (
    <details
      className="toc-mobile"
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary>
        <List className="ic ic-sm" aria-hidden="true" />
        {title}
      </summary>
      <nav className="toc" aria-labelledby="toc-h">
        <h2 id="toc-h">
          <List className="ic ic-sm" aria-hidden="true" />
          {title}
        </h2>
        {headings.map((h) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            className={cn(h.id === active && 'is-active')}
            aria-current={h.id === active ? 'location' : undefined}
            style={h.level === 3 ? { paddingLeft: 28, fontSize: 14 } : undefined}
            onClick={() => {
              if (!window.matchMedia('(min-width: 1024px)').matches) setOpen(false)
            }}
          >
            {h.text}
          </a>
        ))}
      </nav>
    </details>
  )
}
