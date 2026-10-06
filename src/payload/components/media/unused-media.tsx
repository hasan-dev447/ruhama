'use client'

import { Sparkles, X } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const MAX_IDS = 200

/**
 * Above the media list: how many files nothing uses (not even a draft), with a link that filters the
 * list to them so they can be reviewed and deleted in one go.
 */
export function UnusedMedia() {
  const pathname = usePathname()
  const search = useSearchParams()
  const [ids, setIds] = useState<number[] | null>(null)
  const filtered = search.get('unused') === '1'

  useEffect(() => {
    let alive = true
    fetch('/api/media/unused', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { ids: [] }))
      .then((json: { ids: number[] }) => alive && setIds(json.ids))
      .catch(() => alive && setIds([]))
    return () => {
      alive = false
    }
  }, [])

  if (filtered) {
    return (
      <div className="rh-unused">
        <Sparkles size={16} aria-hidden="true" />
        <span>শুধু অব্যবহৃত ফাইল দেখানো হচ্ছে। বেছে নিয়ে একসাথে মুছতে পারেন।</span>
        <a href={pathname} className="rh-int-btn rh-int-btn--ghost">
          <X size={15} aria-hidden="true" /> সব দেখুন
        </a>
      </div>
    )
  }
  if (!ids?.length) return null

  const shown = ids.slice(0, MAX_IDS)
  const query = new URLSearchParams({ unused: '1', limit: String(shown.length) })
  shown.forEach((id, i) => query.append(`where[id][in][${i}]`, String(id)))

  return (
    <div className="rh-unused">
      <Sparkles size={16} aria-hidden="true" />
      <span>
        {ids.length.toLocaleString('bn-BD')}টি ফাইল কোথাও ব্যবহৃত হচ্ছে না (ড্রাফটেও নয়)।
      </span>
      <a href={`${pathname}?${query}`} className="rh-int-btn rh-int-btn--ghost">
        দেখুন
      </a>
    </div>
  )
}
