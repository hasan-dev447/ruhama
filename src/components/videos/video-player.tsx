'use client'

import { createContext, use, useState, useSyncExternalStore } from 'react'

import { YouTubeFacade, type YouTubeHandle } from '@/components/content/youtube-facade'
import { formatDuration } from '@/lib/format'
import { cn } from '@/lib/utils'

type Chapter = { start: number; title: string }
type Ctx = {
  handle: YouTubeHandle | null
  setHandle: (h: YouTubeHandle | null) => void
  chapters: Chapter[]
  current: number
  setCurrent: React.Dispatch<React.SetStateAction<number>>
  start: number | null
}

const VideoContext = createContext<Ctx | null>(null)

const noopSubscribe = () => () => {}
/** `?t=` from the address bar, read on the client so the page itself stays static. */
function useStartParam(): number | null {
  const raw = useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).get('t'),
    () => null,
  )
  const t = Number(raw)
  return raw && Number.isFinite(t) && t > 0 ? t : null
}

/** Shares the player between the video and its chapter list, which sit apart in the layout. */
export function VideoProvider({
  chapters,
  children,
}: {
  chapters: Chapter[]
  children: React.ReactNode
}) {
  const [handle, setHandle] = useState<YouTubeHandle | null>(null)
  const [picked, setCurrent] = useState(-1)
  const start = useStartParam()
  const fromUrl =
    start === null ? -1 : chapters.reduce((found, c, i) => (c.start <= start ? i : found), -1)
  const current = picked >= 0 ? picked : fromUrl
  return (
    <VideoContext value={{ handle, setHandle, chapters, current, setCurrent, start }}>
      {children}
    </VideoContext>
  )
}

export function VideoPlayer({
  videoId,
  title,
  eyebrow,
  durationSeconds,
}: {
  videoId: string
  title: string
  eyebrow?: string | null
  durationSeconds: number
}) {
  const { setHandle, start, current, chapters, setCurrent } = use(VideoContext)!
  return (
    <YouTubeFacade
      ref={setHandle}
      videoId={videoId}
      title={title}
      eyebrow={eyebrow}
      durationSeconds={durationSeconds}
      start={start}
      onPlay={() => {
        // functional update: a chapter picked in the same click is already queued and must win
        if (current < 0 && chapters.length) setCurrent((picked) => (picked >= 0 ? picked : 0))
      }}
    />
  )
}

/** "অধ্যায়": seeks the player; `?t=` keeps the position shareable. */
export function ChapterList() {
  const { handle, chapters, current, setCurrent } = use(VideoContext)!
  if (!chapters.length) return null
  function pick(i: number) {
    const c = chapters[i]
    if (!c) return
    setCurrent(i)
    handle?.seekTo(c.start)
    const url = new URL(window.location.href)
    url.searchParams.set('t', String(c.start))
    window.history.replaceState(window.history.state, '', url)
  }
  return (
    <section className="card card-pad" aria-labelledby="vd-ch">
      <h2 id="vd-ch" className="t-h4" style={{ marginBottom: 10 }}>
        অধ্যায়
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {chapters.map((c, i) => (
          <button
            key={`${c.start}-${i}`}
            type="button"
            className={cn('chapter', i === current && 'is-active')}
            aria-current={i === current ? 'true' : undefined}
            onClick={() => pick(i)}
          >
            <time dateTime={`PT${c.start}S`}>{formatDuration(c.start)}</time>
            <span>{c.title}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
