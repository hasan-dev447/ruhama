'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { IconShow } from '@/components/icons'
import { usePathname, useRouter } from 'next/navigation'

/** Shown to staff while draft mode is on. Refreshes the page whenever the document is saved in the admin. */
export function PreviewBar() {
  const router = useRouter()
  const pathname = usePathname()
  return (
    <>
      <RefreshRouteOnSave
        refresh={() => router.refresh()}
        serverURL={typeof window === 'undefined' ? '' : window.location.origin}
      />
      <div className="preview-bar" role="status">
        <IconShow className="ic ic-sm" aria-hidden="true" />
        <span>খসড়া প্রিভিউ চলছে। এই পাতা শুধু আপনি দেখছেন।</span>
        <a href={`/api/preview/exit?path=${encodeURIComponent(pathname ?? '/')}`}>
          প্রিভিউ বন্ধ করুন
        </a>
      </div>
    </>
  )
}
