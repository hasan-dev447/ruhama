/**
 * Server-side Supabase Realtime Broadcast over the REST endpoint.
 * Silently no-ops when Supabase is not configured.
 */
export async function broadcast(
  channel: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return
  try {
    await fetch(`${url.replace(/\/$/, '')}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: [{ topic: channel, event, payload }] }),
      signal: AbortSignal.timeout(4000),
    })
  } catch {
    // realtime is best-effort; clients also refetch on focus
  }
}
