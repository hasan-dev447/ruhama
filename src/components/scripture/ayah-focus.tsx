'use client'

import { useEffect } from 'react'

import { surahPath } from '@/lib/quran-meta'

/**
 * Brings a shared ayah into view (`/quran/al-baqarah/255`), and keeps old `#ayah-255` links working:
 * when that ayah is not on the current page, the reader moves to the ayah's own page.
 */
export function AyahFocus({ surah, focus }: { surah: number; focus?: number }) {
  useEffect(() => {
    const hash = /^#ayah-(\d+)$/.exec(window.location.hash)
    if (hash) {
      if (!document.getElementById(`ayah-${hash[1]}`)) {
        window.location.replace(surahPath(surah, Number(hash[1])))
      }
      return
    }
    if (focus) {
      document.getElementById(`ayah-${focus}`)?.scrollIntoView({ block: 'start' })
    }
  }, [surah, focus])
  return null
}
