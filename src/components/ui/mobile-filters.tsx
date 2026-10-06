'use client'

import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useId, useState } from 'react'

import { bn } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Sidebar filters that stay open on desktop but fold behind one button on phones, so the list itself
 * is the first thing a mobile visitor sees.
 */
export function MobileFilters({
  label = 'ফিল্টার',
  activeCount = 0,
  children,
}: {
  label?: string
  activeCount?: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <>
      <button
        type="button"
        className="m-filters__toggle"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        <SlidersHorizontal className="ic" aria-hidden="true" />
        <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
        {activeCount ? <span className="m-filters__count">{bn(activeCount)}টি চালু</span> : null}
        <ChevronDown className={cn('ic', open && 'm-filters__chev--open')} aria-hidden="true" />
      </button>
      <div id={id} className={cn('m-filters__body', open && 'is-open')}>
        {children}
      </div>
    </>
  )
}
