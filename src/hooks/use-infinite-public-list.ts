'use client'

import { useInfiniteQuery } from '@tanstack/react-query'

import { apiFetch } from '@/lib/api-client'

import { toQueryString } from './use-public-list'

type Page<T> = { docs: T[]; page: number; totalPages: number; totalDocs: number }
type ParamValue = string | number | null | undefined | string[]

/**
 * Infinite list over a paginated public v1 endpoint. The server-rendered first page seeds
 * the cache when the filters match the defaults, so nothing refetches on first paint.
 */
export function useInfinitePublicList<T>(
  path: string,
  params: Record<string, ParamValue>,
  initial?: Page<T>,
  defaultQs = '',
) {
  const qs = toQueryString(params)
  return useInfiniteQuery({
    queryKey: ['public-infinite', path, qs],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const sp = new URLSearchParams(qs)
      if (pageParam > 1) sp.set('page', String(pageParam))
      const s = sp.toString()
      return apiFetch<Page<T>>(`${path}${s ? `?${s}` : ''}`)
    },
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    initialData: initial && qs === defaultQs ? { pages: [initial], pageParams: [1] } : undefined,
    staleTime: 60_000,
  })
}
