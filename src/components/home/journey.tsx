'use client'

import { IconNext } from '@/components/icons'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { bn } from '@/lib/format'
import { cn } from '@/lib/utils'

const PATH =
  'M60 0L60 75C100 125 100 175 60 225C20 275 20 325 60 375C100 425 100 475 60 525C20 575 20 625 60 675C100 725 100 775 60 825C20 875 20 925 60 975C100 1025 100 1075 60 1125L60 1200'

/** y-progress (0..1 of the 1200-unit track) to path-length fraction, as in the design. */
function lengthFrac(p: number) {
  const y = p * 1200
  let L: number
  if (y < 75) L = y
  else if (y < 1125) {
    const k = Math.floor((y - 75) / 150)
    const f = (y - 75 - k * 150) / 150
    L = 75 + 165 * k + 165 * f
  } else L = 1230 + (y - 1125)
  return Math.max(0, Math.min(1, L / 1305))
}

export type JourneyStep = { title: string; text: string; href: string }

/** The signature eight-step thread: lights up as the reader scrolls. */
export function Journey({ steps }: { steps: JourneyStep[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(1)

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    let raf = 0
    const measure = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight || 800
      const p = Math.max(0, Math.min(1, (vh * 0.62 - r.top) / (r.height || 1)))
      setProgress((prev) => (Math.abs(prev - p) > 0.002 ? p : prev))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="journey" ref={ref}>
      <svg
        className="journey__svg"
        viewBox="0 0 120 1200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path className="journey__base" pathLength={1} d={PATH} />
        <path
          className="journey__line"
          pathLength={1}
          style={{ strokeDashoffset: (1 - lengthFrac(progress)).toFixed(4) }}
          d={PATH}
        />
      </svg>
      <ol className="journey__list">
        {steps.slice(0, 8).map((step, i) => {
          const lit = progress * 1200 >= 75 + 150 * i - 6
          return (
            <li
              key={step.title}
              className={cn('journey__step', i % 2 === 0 ? 'is-left' : 'is-right', lit && 'is-lit')}
            >
              <span className="journey__node" aria-hidden="true">
                {bn(i + 1)}
              </span>
              <div className="journey__body">
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                <Link href={step.href} className="link-arrow">
                  বিস্তারিত পড়ুন <IconNext className="ic" aria-hidden="true" />
                </Link>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
