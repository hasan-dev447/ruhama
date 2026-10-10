'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type Mirror = { id: string; label: string; disabled: boolean; primary: boolean }
type Bar = { form: HTMLFormElement; buttons: Mirror[] }

const FORMS = 'main.collection-edit form, main.global-edit form'
// the document's own actions, in the order Payload shows them
const ACTIONS = ['action-save-draft', 'action-save', 'action-publish']

function read(form: HTMLFormElement): Mirror[] {
  return ACTIONS.flatMap((id) => {
    const el = form.querySelector<HTMLButtonElement>(`.doc-controls button#${id}`)
    if (!el) return []
    return [
      {
        id,
        label: el.textContent?.trim() ?? '',
        disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
        primary: id !== 'action-save-draft',
      },
    ]
  })
}

/**
 * A second set of the document's save buttons at the bottom of every edit form (full page and
 * slide-in drawer), so a long form can be saved without scrolling back up. The buttons mirror
 * Payload's own (label, disabled state) and simply press them, so there is one source of truth.
 */
export function SaveBars() {
  const [bars, setBars] = useState<Bar[]>([])

  useEffect(() => {
    let frame = 0
    const scan = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = [...document.querySelectorAll<HTMLFormElement>(FORMS)]
          .map((form) => ({ form, buttons: read(form) }))
          .filter((b) => b.buttons.length)
        setBars((prev) =>
          JSON.stringify(prev.map((b) => b.buttons)) ===
            JSON.stringify(next.map((b) => b.buttons)) &&
          prev.every((b, i) => b.form === next[i]?.form)
            ? prev
            : next,
        )
      })
    }
    const observer = new MutationObserver(scan)
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['disabled', 'aria-disabled'],
    })
    scan()
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <>
      {bars.map((bar, i) =>
        createPortal(
          <div className="rh-save-bar" role="group" aria-label="সংরক্ষণ">
            {bar.buttons.map((b) => (
              <button
                key={b.id}
                type="button"
                className={
                  b.primary ? 'rh-save-bar__btn rh-save-bar__btn--primary' : 'rh-save-bar__btn'
                }
                disabled={b.disabled}
                onClick={() =>
                  bar.form.querySelector<HTMLButtonElement>(`.doc-controls button#${b.id}`)?.click()
                }
              >
                {b.label}
              </button>
            ))}
          </div>,
          bar.form,
          `save-bar-${i}`,
        ),
      )}
    </>
  )
}
