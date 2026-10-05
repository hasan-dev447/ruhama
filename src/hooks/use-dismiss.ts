'use client'

import { useEffect, type RefObject } from 'react'

/**
 * Close a popover on Escape and return focus to its trigger.
 * Outside clicks are handled by the design's transparent `.dd-scrim` button.
 */
export function useDismiss(
  open: boolean,
  close: () => void,
  triggerRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close, triggerRef])
}

/** Arrow-key roving focus inside a role="menu" container. */
export function handleMenuKeys(e: React.KeyboardEvent<HTMLElement>) {
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return
  const items = Array.from(
    e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])'),
  )
  if (items.length === 0) return
  e.preventDefault()
  const idx = items.indexOf(document.activeElement as HTMLElement)
  let next = 0
  if (e.key === 'ArrowDown') next = idx < 0 ? 0 : (idx + 1) % items.length
  if (e.key === 'ArrowUp') next = idx <= 0 ? items.length - 1 : idx - 1
  if (e.key === 'End') next = items.length - 1
  items[next]?.focus()
}
