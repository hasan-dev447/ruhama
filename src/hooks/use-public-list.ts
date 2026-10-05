'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { apiFetch } from '@/lib/api-client'

type ParamValue = string | number | null | undefined | string[]

export function toQueryString(params: Record<string, ParamValue>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined || v === '' || v === 'all') continue
    if (Array.isArray(v)) {
      if (v.length) sp.set(k, v.join(','))
    } else sp.set(k, String(v))
  }
  sp.sort()
  return sp.toString()
}

/**
 * Client list backed by a public v1 endpoint. The statically rendered first page is used
 * as initial data when the URL has no filters, so the page never flashes empty.
 */
export function usePublicList<T>(
  path: string,
  params: Record<string, ParamValue>,
  initial?: T,
  defaultQs = '',
  opts: { enabled?: boolean } = {},
) {
  const qs = toQueryString(params)
  return useQuery({
    queryKey: ['public', path, qs],
    queryFn: () => apiFetch<T>(`${path}${qs ? `?${qs}` : ''}`),
    initialData: qs === defaultQs ? initial : undefined,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    enabled: opts.enabled ?? true,
  })
}
