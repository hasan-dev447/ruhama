import type { SwMessage } from '@/sw/protocol'

/** Fired by the bookmark button after an article is saved or removed, so the offline copy follows. */
export const SAVED_CHANGED_EVENT = 'rh:saved-articles-changed'

export const offlineSupported = () =>
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  process.env.NODE_ENV === 'production'

/** Send a message to the active service worker and wait for its reply (null when there is no worker). */
export async function postToWorker<T = { ok: boolean }>(
  message: SwMessage,
  timeoutMs = 20_000,
): Promise<T | null> {
  if (!offlineSupported()) return null
  const reg = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((r) => setTimeout(() => r(null), Math.min(timeoutMs, 15_000))),
  ])
  const worker = reg?.active
  if (!worker) return null
  return new Promise<T | null>((resolve) => {
    const channel = new MessageChannel()
    const timer = setTimeout(() => resolve(null), timeoutMs)
    channel.port1.onmessage = (e) => {
      clearTimeout(timer)
      resolve(e.data as T)
    }
    worker.postMessage(message, [channel.port2])
  })
}

export const clearSavedOffline = () => postToWorker({ type: 'CLEAR_SAVED' })

export const notifySavedChanged = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SAVED_CHANGED_EVENT))
}
