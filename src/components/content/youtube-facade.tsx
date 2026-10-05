'use client'

import { Play } from 'lucide-react'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

import { BrandMark } from '@/components/icons/brand-mark'
import { formatDuration } from '@/lib/format'
import { cn } from '@/lib/utils'

export type YouTubeHandle = { seekTo: (seconds: number) => void; play: () => void }

/**
 * Lightweight YouTube player: shows the design's patterned poster first and only
 * loads the youtube-nocookie iframe when the visitor presses play.
 */
export const YouTubeFacade = forwardRef<
  YouTubeHandle,
  {
    videoId: string
    title: string
    eyebrow?: string | null
    durationSeconds?: number | null
    start?: number | null
    className?: string
    onPlay?: () => void
  }
>(function YouTubeFacade(
  { videoId, title, eyebrow, durationSeconds, start, className, onPlay },
  ref,
) {
  const [active, setActive] = useState(false)
  const [startAt, setStartAt] = useState(start ?? 0)
  const frame = useRef<HTMLIFrameElement>(null)

  // a start position that arrives after mount (for example from ?t=) applies until playback begins
  useEffect(() => {
    if (!active && typeof start === 'number') setStartAt(start)
  }, [start, active])

  // the handle is created once and reads the latest state through refs, so a parent that keeps it in
  // state (or passes a new onPlay each render) never triggers a re-render loop
  const activeRef = useRef(active)
  const onPlayRef = useRef(onPlay)
  useEffect(() => {
    activeRef.current = active
    onPlayRef.current = onPlay
  })

  const command = useCallback((func: string, args: unknown[] = []) => {
    frame.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      'https://www.youtube-nocookie.com',
    )
  }, [])

  const activate = useCallback((seconds?: number) => {
    if (typeof seconds === 'number') setStartAt(seconds)
    activeRef.current = true
    setActive(true)
    onPlayRef.current?.()
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      seekTo: (seconds: number) => {
        if (!activeRef.current) return activate(seconds)
        command('seekTo', [seconds, true])
        command('playVideo')
      },
      play: () => (activeRef.current ? command('playVideo') : activate()),
    }),
    [activate, command],
  )

  const params = new URLSearchParams({
    autoplay: '1',
    rel: '0',
    modestbranding: '1',
    enablejsapi: '1',
    playsinline: '1',
  })
  if (startAt) params.set('start', String(Math.floor(startAt)))

  return (
    <div className={cn('player', className)}>
      <div className="rh-pattern" aria-hidden="true" />
      {active ? (
        <iframe
          ref={frame}
          className="yt-frame"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <>
          <BrandMark
            style={{
              position: 'absolute',
              right: -40,
              top: -40,
              width: 260,
              height: 260,
              color: '#D4A95C',
              opacity: 0.16,
              zIndex: -1,
            }}
          />
          <div style={{ position: 'absolute', left: 28, bottom: 28, maxWidth: '70%' }}>
            {eyebrow ? (
              <span style={{ fontSize: 14, color: '#D4A95C', fontWeight: 600 }}>{eyebrow}</span>
            ) : null}
            <p
              style={{
                fontFamily: 'var(--rh-font-heading)',
                fontWeight: 600,
                fontSize: 'clamp(20px, 2.4vw, 30px)',
                lineHeight: 1.45,
                color: '#F6F1E6',
                marginTop: 6,
              }}
            >
              {title}
            </p>
          </div>
          <button
            type="button"
            className="player__play"
            aria-label={`ভিডিও চালু করুন: ${title}`}
            onClick={() => activate()}
          >
            <Play className="ic ic-xl" aria-hidden="true" style={{ marginLeft: 4 }} />
          </button>
          {durationSeconds ? (
            <span className="vthumb__dur" style={{ right: 16, bottom: 16, fontSize: 14 }}>
              {formatDuration(durationSeconds)}
            </span>
          ) : null}
        </>
      )}
    </div>
  )
})

/** Extract the video id from a URL or bare id (client-safe copy of the server helper). */
export function youtubeIdFrom(input: string): string | null {
  const v = input.trim()
  if (/^[\w-]{11}$/.test(v)) return v
  try {
    const url = new URL(v)
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1, 12) || null
    const id = url.searchParams.get('v')
    if (id && /^[\w-]{11}$/.test(id)) return id
    return url.pathname.match(/\/(embed|shorts|live)\/([\w-]{11})/)?.[2] ?? null
  } catch {
    return null
  }
}
