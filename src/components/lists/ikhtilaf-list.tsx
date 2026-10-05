'use client'

import { IkhtilafPreviewCard } from '@/components/content/ikhtilaf'
import { InfiniteSentinel } from '@/components/ui/infinite-sentinel'
import { useInfinitePublicList } from '@/hooks/use-infinite-public-list'
import type { IkhtilafCardView } from '@/server/queries/types'

type Page = { docs: IkhtilafCardView[]; page: number; totalPages: number; totalDocs: number }

export function IkhtilafList({ initial }: { initial: Page }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfinitePublicList<IkhtilafCardView>('/ikhtilaf', {}, initial)
  const topics = data?.pages.flatMap((p) => p.docs) ?? initial.docs
  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(460px, 100%), 1fr))',
          gap: 24,
        }}
      >
        {topics.map((t) => (
          <IkhtilafPreviewCard key={t.id} topic={t} raised={false} />
        ))}
      </div>
      <InfiniteSentinel
        hasMore={Boolean(hasNextPage)}
        loading={isFetchingNextPage}
        onLoadMore={() => void fetchNextPage()}
      />
    </>
  )
}
