import type { Metadata } from 'next'
import { Suspense } from 'react'

import { SearchView } from '@/components/search/search-view'
import { Skeleton } from '@/components/ui/primitives'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'খুঁজুন',
  description: 'প্রবন্ধ, কুরআনের আয়াত, হাদিস, প্রশ্নোত্তর, ভিডিও ও মজলিস একসাথে খুঁজুন।',
  path: '/search',
  noIndex: true,
})

/** Static shell; the query runs on the client so results update without a reload. */
export default function SearchPage() {
  return (
    <main id="main">
      <Suspense fallback={<Skeleton style={{ height: 320 }} />}>
        <SearchView />
      </Suspense>
    </main>
  )
}
