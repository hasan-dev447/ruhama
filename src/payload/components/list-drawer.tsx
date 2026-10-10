'use client'

import { useDocumentDrawer } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

export type Target = { slug: string; id?: number; key: number }

/**
 * One document in Payload's drawer: opens on mount, reports when it has closed. `onChange` runs after
 * a save or delete (the page is refreshed either way); `initialData` prefills a new document.
 */
export function OpenDocument({
  target,
  onClosed,
  onChange,
  initialData,
}: {
  target: Target
  onClosed: () => void
  onChange?: () => void
  initialData?: Record<string, unknown>
}) {
  const router = useRouter()
  const [DocumentDrawer, , { openDrawer, closeDrawer, isDrawerOpen }] = useDocumentDrawer({
    collectionSlug: target.slug,
    id: target.id,
  })
  const wasOpen = useRef(false)

  useEffect(() => {
    openDrawer()
  }, [openDrawer])

  useEffect(() => {
    if (isDrawerOpen) wasOpen.current = true
    else if (wasOpen.current) {
      // wait for the closing slide before unmounting
      const t = setTimeout(onClosed, 350)
      return () => clearTimeout(t)
    }
  }, [isDrawerOpen, onClosed])

  return (
    <DocumentDrawer
      initialData={initialData}
      onSave={() => {
        onChange?.()
        router.refresh()
      }}
      onDuplicate={() => {
        onChange?.()
        router.refresh()
      }}
      onDelete={() => {
        closeDrawer()
        onChange?.()
        router.refresh()
      }}
    />
  )
}

const DOC_PATH = /\/collections\/([^/]+)\/([^/?#]+)\/?$/

// clicks on these act on the row itself (select, toggle, choose), never open the document
const ROW_CONTROLS = 'input, select, button, label, textarea, [role="switch"], .checkbox-input'

/**
 * Payload removes a drawer the moment it closes, so it would vanish at once. The removed panel is put
 * back for a moment and slid out to the right, then dropped: closing feels as smooth as opening.
 */
function animateClosingDrawers() {
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.removedNodes) {
        if (!(node instanceof HTMLElement) || !node.matches('.drawer') || node.dataset.ghost)
          continue
        const ghost = node
        ghost.dataset.ghost = '1'
        ghost.setAttribute('aria-hidden', 'true')
        ghost.style.pointerEvents = 'none'
        if (ghost instanceof HTMLDialogElement) ghost.setAttribute('open', '')
        ghost.classList.add('drawer--is-open')
        document.body.appendChild(ghost)
        requestAnimationFrame(() =>
          requestAnimationFrame(() => ghost.classList.remove('drawer--is-open')),
        )
        setTimeout(() => ghost.remove(), 450)
      }
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
  return () => observer.disconnect()
}

/**
 * Admin lists open documents in a panel that slides in from the right, instead of leaving the list:
 * every collection, every row and the "create new" button, with no per-collection code. Ctrl/Cmd or
 * middle click still opens the full page in a new tab.
 */
export function ListDrawerHost() {
  const [target, setTarget] = useState<Target | null>(null)
  const clear = useCallback(() => setTarget(null), [])

  useEffect(() => animateClosingDrawers(), [])

  // the Columns and Filters dropdowns close on a click outside them, or on Escape
  useEffect(() => {
    const openToggles = () =>
      [
        ...document.querySelectorAll<HTMLButtonElement>(
          '#toggle-list-columns, #toggle-list-filters',
        ),
      ].filter((b) => b.getAttribute('aria-expanded') === 'true')
    function onPointer(e: MouseEvent) {
      const target = e.target as Element | null
      if (!target || target.closest('.list-controls, .rs__menu, .popup__content, .drawer')) return
      openToggles().forEach((b) => b.click())
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') openToggles().forEach((b) => b.click())
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return
      const target = e.target as Element | null
      if (!target || target.closest('.drawer')) return
      let link = target.closest?.('a[href]') as HTMLAnchorElement | null
      // anywhere on a list row opens that row's document, except its own controls
      const row = target.closest('.collection-list .table tbody tr')
      if (!link && row && !target.closest(ROW_CONTROLS)) {
        link =
          [...row.querySelectorAll<HTMLAnchorElement>('a[href]')].find((a) =>
            DOC_PATH.test(new URL(a.href, window.location.href).pathname),
          ) ?? null
      }
      if (!link) return
      const fromList =
        link.closest('.collection-list .table') ||
        link.classList.contains('list-create-new-doc__create-new-button')
      if (!fromList) return
      const match = DOC_PATH.exec(new URL(link.href, window.location.href).pathname)
      // documents only (numeric ids) and "create"; other links keep their normal behaviour
      if (!match || (match[2] !== 'create' && !/^\d+$/.test(match[2]!))) return
      e.preventDefault()
      e.stopPropagation()
      setTarget({
        slug: match[1]!,
        id: match[2] === 'create' ? undefined : Number(decodeURIComponent(match[2]!)),
        key: Date.now(),
      })
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  if (!target) return null
  return <OpenDocument key={target.key} target={target} onClosed={clear} />
}
