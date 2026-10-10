'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { IconChevronBack, IconChevronNext, IconClose } from '@/components/icons'
import { bn } from '@/lib/format'
import { imageSrcSet, imageUrl } from '@/lib/image-url'

export type RecapPhoto = {
  url: string
  /** a lighter version for the grid (else resized at the edge, or the original) */
  thumb?: string
  alt: string
  width?: number | null
  height?: number | null
}

/**
 * A মজলিস's photos: a grid of thumbnails that open in a full-screen viewer (native <dialog>, so focus,
 * Escape and the backdrop behave as expected), with previous / next by button, arrow key or swipe.
 */
export function RecapGallery({
  photos,
  title,
  columns,
  aspect,
}: {
  photos: RecapPhoto[]
  title: string
  /** a fixed number per row (2 on phones); otherwise as many as fit */
  columns?: number
  /** e.g. "4/3": every tile cut to the same shape */
  aspect?: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState<number | null>(null)
  const touchX = useRef<number | null>(null)

  const open = (i: number) => {
    setIndex(i)
    dialog.current?.showModal()
  }
  const close = useCallback(() => dialog.current?.close(), [])
  const step = useCallback(
    (by: number) => setIndex((i) => (i === null ? i : (i + by + photos.length) % photos.length)),
    [photos.length],
  )

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    const onClose = () => setIndex(null)
    el.addEventListener('keydown', onKey)
    el.addEventListener('close', onClose)
    return () => {
      el.removeEventListener('keydown', onKey)
      el.removeEventListener('close', onClose)
    }
  }, [step])

  const current = index === null ? null : photos[index]

  return (
    <>
      <ul
        className={columns ? 'recap-gallery recap-gallery--cols' : 'recap-gallery'}
        aria-label={`${title}: ছবি`}
        style={
          {
            ...(columns ? { '--gallery-cols': columns } : {}),
            ...(aspect ? { '--gallery-aspect': aspect } : {}),
          } as React.CSSProperties
        }
      >
        {photos.map((p, i) => (
          <li key={p.url}>
            <button
              type="button"
              className="recap-gallery__thumb"
              onClick={() => open(i)}
              aria-label={`ছবি ${bn(i + 1)} বড় করে দেখুন${p.alt ? `: ${p.alt}` : ''}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.thumb ?? imageUrl(p.url, { width: 480 })}
                alt={p.alt}
                loading="lazy"
                decoding="async"
                width={p.width ?? undefined}
                height={p.height ?? undefined}
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        className="recap-viewer"
        aria-label={`${title}: ছবি`}
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
        onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          const start = touchX.current
          const end = e.changedTouches[0]?.clientX
          if (start !== null && end !== undefined && Math.abs(end - start) > 50)
            step(end < start ? 1 : -1)
          touchX.current = null
        }}
      >
        {current ? (
          <figure className="recap-viewer__figure">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl(current.url, { width: 1440 })}
              srcSet={imageSrcSet(current.url)}
              sizes="100vw"
              alt={current.alt}
            />
            <figcaption>
              {current.alt ? <span>{current.alt}</span> : null}
              <span className="t-muted">
                {bn(index! + 1)} / {bn(photos.length)}
              </span>
            </figcaption>
          </figure>
        ) : null}
        <button
          type="button"
          className="recap-viewer__close"
          onClick={close}
          aria-label="বন্ধ করুন"
        >
          <IconClose className="ic" aria-hidden="true" />
        </button>
        {photos.length > 1 ? (
          <>
            <button
              type="button"
              className="recap-viewer__nav recap-viewer__nav--prev"
              onClick={() => step(-1)}
              aria-label="আগের ছবি"
            >
              <IconChevronBack className="ic" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="recap-viewer__nav recap-viewer__nav--next"
              onClick={() => step(1)}
              aria-label="পরের ছবি"
            >
              <IconChevronNext className="ic" aria-hidden="true" />
            </button>
          </>
        ) : null}
      </dialog>
    </>
  )
}
