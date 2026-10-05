'use client'

import type { RealtimeChannel, RealtimeClient } from '@supabase/realtime-js'

/**
 * Supabase Realtime Broadcast client. Only the public anon key is used here; messages are sent from
 * the server with the service role key. The realtime library is loaded on first subscription, so pages
 * that never listen (or a site without Supabase) never download it. When Supabase is not configured,
 * `isRealtimeEnabled` is false and callers fall back to periodic refetching.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isRealtimeEnabled = Boolean(url && anonKey)

let client: Promise<RealtimeClient> | null = null

function getClient(): Promise<RealtimeClient> | null {
  if (!isRealtimeEnabled) return null
  client ??= import('@supabase/realtime-js').then(
    ({ RealtimeClient }) =>
      new RealtimeClient(`${url!.replace(/\/$/, '')}/realtime/v1`, {
        params: { apikey: anonKey!, eventsPerSecond: 5 },
      }),
  )
  return client
}

export function subscribeBroadcast(
  channelName: string,
  event: string,
  onMessage: (payload: Record<string, unknown>) => void,
): () => void {
  const pending = getClient()
  if (!pending) return () => {}
  let closed = false
  let channel: RealtimeChannel | null = null
  void pending.then((realtime) => {
    if (closed) return
    channel = realtime
      .channel(channelName, { config: { broadcast: { self: false } } })
      .on('broadcast', { event }, (msg) =>
        onMessage((msg.payload ?? {}) as Record<string, unknown>),
      )
      .subscribe()
  })
  return () => {
    closed = true
    if (channel) void pending.then((realtime) => realtime.removeChannel(channel!))
  }
}
