'use client'

import { useEffect, useRef } from 'react'

import { isRealtimeEnabled, subscribeBroadcast } from '@/lib/realtime/client'

/** Subscribe to a broadcast event on a channel for the lifetime of the component. */
export function useBroadcast(
  channel: string | null,
  event: string,
  onMessage: (payload: Record<string, unknown>) => void,
) {
  const handler = useRef(onMessage)
  useEffect(() => {
    handler.current = onMessage
  })
  useEffect(() => {
    if (!channel) return
    return subscribeBroadcast(channel, event, (p) => handler.current(p))
  }, [channel, event])
}

/** Refetch interval to use when realtime is unavailable (ms), or false. */
export function fallbackInterval(ms: number): number | false {
  return isRealtimeEnabled ? false : ms
}
