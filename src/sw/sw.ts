/// <reference lib="esnext" />
/// <reference lib="webworker" />
import type { PrecacheEntry, RouteHandlerCallbackOptions, SerwistGlobalConfig } from 'serwist'
import {
  CacheFirst,
  ExpirationPlugin,
  RangeRequestsPlugin,
  Serwist,
  StaleWhileRevalidate,
} from 'serwist'

import {
  OFFLINE_PATH,
  OFFLINE_SLOT_ID,
  SAVED_CACHE,
  SAVED_INDEX,
  savedListHtml,
  type SavedArticle,
  type SwMessage,
} from './protocol'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const DAY = 24 * 60 * 60

/**
 * Only static, non-personal assets are cached at runtime. Pages, RSC payloads and /api responses
 * always go to the network so nothing private lingers on a shared phone; the one exception is the
 * member's own saved articles, which live in SAVED_CACHE and are cleared on logout.
 */
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: true,
  runtimeCaching: [
    {
      matcher: ({ request, sameOrigin }) => sameOrigin && request.mode === 'navigate',
      handler: navigate,
    },
    {
      matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith('/_next/static/'),
      handler: new CacheFirst({
        cacheName: 'rh-next-static',
        plugins: [new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 30 * DAY })],
      }),
    },
    {
      matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname === '/_next/image',
      handler: new StaleWhileRevalidate({
        cacheName: 'rh-images',
        plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * DAY })],
      }),
    },
    {
      matcher: ({ request }) => request.destination === 'font',
      handler: new CacheFirst({
        cacheName: 'rh-fonts',
        plugins: [new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 365 * DAY })],
      }),
    },
    {
      // media library files and YouTube thumbnails: public and immutable by URL
      matcher: ({ request, url }) =>
        request.destination === 'image' &&
        (url.pathname.startsWith('/api/media/file/') ||
          url.hostname === 'i.ytimg.com' ||
          /\.(?:png|jpe?g|webp|avif|svg|ico)$/i.test(url.pathname)),
      handler: new StaleWhileRevalidate({
        cacheName: 'rh-media',
        plugins: [new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 30 * DAY })],
      }),
    },
    {
      matcher: ({ request }) => request.destination === 'audio',
      handler: new CacheFirst({
        cacheName: 'rh-audio',
        plugins: [
          new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 30 * DAY }),
          new RangeRequestsPlugin(),
        ],
      }),
    },
  ],
})

/** Network first for every page; offline, a saved article comes from SAVED_CACHE and anything else gets the offline page. */
async function navigate({ request, url, event }: RouteHandlerCallbackOptions): Promise<Response> {
  try {
    const preloaded = (await (event as FetchEvent).preloadResponse) as Response | undefined
    const response = preloaded ?? (await fetch(request))
    if (response.ok && !response.redirected) {
      // keep saved copies fresh whenever the member reads them online
      const cache = await caches.open(SAVED_CACHE)
      if (await cache.match(url.pathname)) await cache.put(url.pathname, response.clone())
    }
    return response
  } catch {
    const cache = await caches.open(SAVED_CACHE)
    const saved = await cache.match(url.pathname)
    if (saved) return saved
    return offlinePage(await readIndex(cache))
  }
}

/** The precached offline page with the saved-article list written into its slot. */
async function offlinePage(articles: SavedArticle[]): Promise<Response> {
  const page = await serwist.matchPrecache(OFFLINE_PATH)
  if (!page) return Response.error()
  const slot = `<div id="${OFFLINE_SLOT_ID}"></div>`
  const html = (await page.text()).replace(
    slot,
    `<div id="${OFFLINE_SLOT_ID}">${savedListHtml(articles)}</div>`,
  )
  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}

async function readIndex(cache: Cache): Promise<SavedArticle[]> {
  const res = await cache.match(SAVED_INDEX)
  return res ? ((await res.json()) as SavedArticle[]) : []
}

/** Mirror the member's saved articles: fetch new ones, drop removed ones, keep an index for the offline page. */
async function syncSaved(articles: SavedArticle[]) {
  const cache = await caches.open(SAVED_CACHE)
  const wanted = new Map(articles.filter((a) => a.url.startsWith('/ilm/')).map((a) => [a.url, a]))
  for (const key of await cache.keys()) {
    const path = new URL(key.url).pathname
    if (path !== SAVED_INDEX && !wanted.has(path)) await cache.delete(key)
  }
  const stored: SavedArticle[] = []
  for (const article of wanted.values()) {
    if (!(await cache.match(article.url))) {
      try {
        const res = await fetch(article.url, { credentials: 'omit' })
        if (!res.ok || res.redirected) continue
        await cache.put(article.url, res)
      } catch {
        continue
      }
    }
    stored.push(article)
  }
  await cache.put(
    SAVED_INDEX,
    new Response(JSON.stringify(stored), { headers: { 'content-type': 'application/json' } }),
  )
  return stored.length
}

self.addEventListener('message', (event) => {
  const data = event.data as SwMessage | undefined
  if (!data || typeof data !== 'object') return
  const reply = (msg: unknown) => event.ports[0]?.postMessage(msg)
  if (data.type === 'SYNC_SAVED' && Array.isArray(data.articles)) {
    event.waitUntil(
      syncSaved(data.articles).then(
        (count) => reply({ ok: true, count }),
        () => reply({ ok: false }),
      ),
    )
  } else if (data.type === 'CLEAR_SAVED') {
    event.waitUntil(caches.delete(SAVED_CACHE).then(() => reply({ ok: true })))
  }
})

// a new worker means a new deploy with new chunk hashes: refresh saved copies so they keep working offline
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SAVED_CACHE)
      for (const article of await readIndex(cache)) {
        try {
          const res = await fetch(article.url, { credentials: 'omit' })
          if (res.ok && !res.redirected) await cache.put(article.url, res)
        } catch {
          // offline right now: the older copy stays usable as plain HTML
        }
      }
    })(),
  )
})

serwist.addEventListeners()
