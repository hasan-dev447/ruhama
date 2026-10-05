'use client'

import { useState } from 'react'

import { cn } from '@/lib/utils'

/** "দুটি মত, পাশাপাশি" header with a side-by-side / stacked toggle. Stacked is forced on narrow screens by the grid itself. */
export function OpinionLayout({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  const [mode, setMode] = useState<'side' | 'stack'>('side')
  const min = count > 2 ? 300 : 380
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <h2 className="t-h3">{title}</h2>
        <div
          role="group"
          aria-label="দেখার ধরন"
          style={{
            display: 'flex',
            gap: 4,
            padding: 4,
            borderRadius: 12,
            background: 'var(--rh-sage)',
            border: '1px solid var(--rh-border)',
          }}
        >
          <button
            type="button"
            className={cn('chip', mode === 'side' && 'is-active')}
            aria-pressed={mode === 'side'}
            onClick={() => setMode('side')}
            style={{ border: 0 }}
          >
            পাশাপাশি
          </button>
          <button
            type="button"
            className={cn('chip', mode === 'stack' && 'is-active')}
            aria-pressed={mode === 'stack'}
            onClick={() => setMode('stack')}
            style={{ border: 0 }}
          >
            একটির পর একটি
          </button>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            mode === 'side' ? `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))` : '1fr',
          gap: 20,
          alignItems: 'stretch',
        }}
      >
        {children}
      </div>
    </>
  )
}
