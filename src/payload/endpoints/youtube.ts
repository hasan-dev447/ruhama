import type { Endpoint, PayloadRequest } from 'payload'

import { errors } from '@/server/services/errors'
import {
  authorizeUrl,
  canUseYouTube,
  channelVideos,
  createState,
  exchangeCode,
  loadConnection,
  ownConnection,
  readState,
  removeConnection,
  requestOrigin,
  requireYouTubeUser,
  saveConnections,
} from '@/server/youtube'
import { loadIntegrations } from '@/server/integrations'

import { numericId, param, query, v1 } from './helpers'
import { hasLevel } from '@/server/permissions'

const STATE_COOKIE = 'rh_yt_state'
const COOKIE_PATH = '/api/v1/integrations/youtube'

function stateCookie(req: PayloadRequest, value: string, maxAge: number) {
  const secure = requestOrigin(req).startsWith('https://') ? '; Secure' : ''
  return `${STATE_COOKIE}=${value}; Path=${COOKIE_PATH}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

const readCookie = (req: PayloadRequest, name: string) =>
  (req.headers.get('cookie') ?? '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1) ?? null

const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )

/**
 * The page Google sends the popup back to: it tells the admin window (BroadcastChannel, so it works
 * even when Google's page cut the popup off from its opener), then closes itself; opened as a normal
 * page it links back to where the user started.
 */
function finishPage(req: PayloadRequest, ok: boolean, message: string, returnTo: string) {
  // "<" escaped so no message can close the <script> it is written into
  const payload = JSON.stringify({ type: 'ruhama:youtube', ok, message }).replace(/</g, '\\u003c')
  const html = `<!doctype html><html lang="bn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>YouTube</title>
<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f4f8f6;color:#0f172a}main{max-width:420px;padding:28px;border-radius:16px;background:#fff;border:1px solid #d9e4de;text-align:center}p{line-height:1.6}a{color:#15803d;font-weight:600}</style></head>
<body><main><h1 style="font-size:20px">${ok ? 'চ্যানেল যুক্ত হয়েছে' : 'যুক্ত করা যায়নি'}</h1><p>${escapeHtml(message)}</p><p><a href="${escapeHtml(returnTo)}">ফিরে যান</a></p></main>
<script>(function(){var d=${payload};try{new BroadcastChannel('ruhama-youtube').postMessage(d)}catch(e){}try{if(window.opener)window.opener.postMessage(d,location.origin)}catch(e){}setTimeout(function(){window.close()},${ok ? 600 : 2500})})()</script></body></html>`
  return new Response(html, {
    status: ok ? 200 : 400,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'set-cookie': stateCookie(req, '', 0),
    },
  })
}

/** /api/v1/integrations/youtube/*: connect a channel, list its videos, disconnect. */
export const youtubeEndpoints: Endpoint[] = [
  // what the picker needs first: is it on, may I use it, which channels have I connected
  v1('get', '/integrations/youtube/status', async (req, ctx) => {
    if (!ctx.user) throw errors.unauthorized()
    const { youtube } = await loadIntegrations()
    const allowed = await canUseYouTube(ctx.user)
    const connections = allowed
      ? (
          await req.payload.find({
            collection: 'youtube-connections',
            where: { user: { equals: ctx.user.id } },
            select: { channelTitle: true, channelHandle: true, channelThumb: true, status: true },
            depth: 0,
            limit: 20,
            sort: '-connectedAt',
            overrideAccess: true,
          })
        ).docs
      : []
    return { enabled: youtube.enabled, allowed, connections }
  }),

  // start: off to Google's consent screen
  v1('get', '/integrations/youtube/connect', async (req, ctx) => {
    const user = await requireYouTubeUser(ctx.user)
    const back = query(req).get('return') ?? '/admin'
    const state = createState(user.id, /^\/(?!\/)/.test(back) ? back : '/admin')
    return new Response(null, {
      status: 302,
      headers: {
        location: await authorizeUrl(req, state),
        'set-cookie': stateCookie(req, state, 600),
        'cache-control': 'no-store',
      },
    })
  }),

  // Google's answer
  v1('get', '/integrations/youtube/callback', async (req, ctx) => {
    const q = query(req)
    const state = readState(q.get('state'))
    const returnTo = state?.returnTo ?? '/admin'
    if (!state || q.get('state') !== readCookie(req, STATE_COOKIE))
      return finishPage(
        req,
        false,
        'অনুরোধের মেয়াদ শেষ বা যাচাই হয়নি। আবার চেষ্টা করুন।',
        returnTo,
      )
    if (!ctx.user || String(ctx.user.id) !== state.userId)
      return finishPage(
        req,
        false,
        'যে অ্যাকাউন্ট থেকে শুরু করেছিলেন, সেটিতে লগইন অবস্থায় আবার চেষ্টা করুন।',
        returnTo,
      )
    if (q.get('error'))
      return finishPage(
        req,
        false,
        q.get('error') === 'access_denied'
          ? 'Google-এ অনুমতি দেওয়া হয়নি।'
          : `Google: ${q.get('error')}`,
        returnTo,
      )
    try {
      await requireYouTubeUser(ctx.user)
      const token = await exchangeCode(req, q.get('code') ?? '')
      const ids = await saveConnections(req.payload, ctx.user.id, token)
      return finishPage(
        req,
        true,
        ids.length > 1
          ? `${ids.length}টি চ্যানেল যুক্ত হয়েছে।`
          : 'এখন এই চ্যানেলের ভিডিও বেছে নিতে পারবেন।',
        returnTo,
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'অজানা সমস্যা'
      req.payload.logger.warn({ err, msg: 'youtube connect failed' })
      return finishPage(req, false, message, returnTo)
    }
  }),

  // one page of a connected channel's videos
  v1('get', '/integrations/youtube/videos', async (req, ctx) => {
    const user = await requireYouTubeUser(ctx.user)
    const q = query(req)
    const id = Number(q.get('connection'))
    if (!Number.isFinite(id)) throw errors.invalid('চ্যানেল বেছে নিন।')
    const c = await ownConnection(req.payload, user, id)
    return channelVideos(req.payload, c as never, q.get('pageToken'))
  }),

  // disconnect: the owner, or an admin from Integrations > YouTube
  v1('delete', '/integrations/youtube/connections/:id', async (req, ctx) => {
    if (!ctx.user) throw errors.unauthorized()
    const c = await loadConnection(req.payload, Number(numericId(param(req, 'id'))))
    if (!c) throw errors.notFound()
    const owner = typeof c.user === 'object' ? c.user.id : c.user
    if (
      String(owner) !== String(ctx.user.id) &&
      !(await hasLevel(ctx.user, 'integrations', 'edit'))
    )
      throw errors.forbidden()
    await removeConnection(req.payload, c)
    return { ok: true }
  }),

  // admins: every connected channel, for Integrations > YouTube
  v1('get', '/integrations/youtube/all', async (req, ctx) => {
    if (!(await hasLevel(ctx.user, 'integrations', 'edit'))) throw errors.forbidden()
    const res = await req.payload.find({
      collection: 'youtube-connections',
      select: {
        channelTitle: true,
        channelHandle: true,
        channelThumb: true,
        status: true,
        user: true,
        connectedAt: true,
        lastUsedAt: true,
      },
      populate: { users: { name: true, email: true } },
      depth: 1,
      limit: 200,
      sort: '-connectedAt',
      overrideAccess: true,
    })
    return { docs: res.docs }
  }),
]
