'use client'

import { useEffect, useRef } from 'react'

import { Button } from './button'

/**
 * Loads the next page when scrolled into view. The button stays as a keyboard and
 * no-IntersectionObserver fallback, and announces progress to screen readers.
 */
export function InfiniteSentinel({
  hasMore,
  loading,
  onLoadMore,
  label = 'আরও দেখুন',
  doneLabel,
}: {
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void
  label?: string
  doneLabel?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !hasMore || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !loading) onLoadMore()
      },
      { rootMargin: '400px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, loading, onLoadMore])

  if (!hasMore)
    return doneLabel ? (
      <p className="t-small t-muted" style={{ textAlign: 'center', marginTop: 32 }}>
        {doneLabel}
      </p>
    ) : null
  return (
    <div ref={ref} style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
      <Button variant="secondary" onClick={onLoadMore} disabled={loading} aria-live="polite">
        {loading ? 'লোড হচ্ছে…' : label}
      </Button>
    </div>
  )
}
