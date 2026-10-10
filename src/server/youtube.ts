import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

import type { Payload, PayloadRequest } from 'payload'

import { decryptSecret, encryptSecret } from './crypto/secrets'
import { loadIntegrations } from './integrations'
import { errors } from './services/errors'
import { canEnterAdmin } from '@/server/permissions'

/**
 * YouTube channels connected by our own users, through the site's Google OAuth app (client ID and
 * secret in the admin's Integrations, YouTube tab).
 *
 * - A user presses "Google দিয়ে YouTube যুক্ত করুন", agrees on Google's screen (read-only access to
 *   their channel), and the channel is saved with an encrypted refresh token; one user may connect
 *   several channels (Google asks which one), and only they can list its videos.
 * - Listing reads the channel's uploads playlist (1 quota unit per page) plus one videos.list call
 *   for privacy, embedding and duration, so unlisted videos are offered too and private ones are
 *   shown as unusable (YouTube does not play them for visitors).
 * - Who may connect is a setting: staff only today, any member later.
 */

export const YOUTUBE_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly'
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke'
const API = 'https://www.googleapis.com/youtube/v3'
export const CALLBACK_PATH = '/api/v1/integrations/youtube/callback'
const STATE_TTL_MS = 10 * 60 * 1000

type UserLike = { id: number | string; role?: unknown } | null | undefined

/** The site's YouTube app settings; throws a readable error when it is not set up. */
export async function youtubeApp() {
  const { youtube } = await loadIntegrations()
  if (!youtube.enabled)
    throw errors.forbidden('YouTube সংযোগ এখনো চালু করা হয়নি (ইন্টিগ্রেশন > YouTube)।')
  return youtube
}

/** Whether this user may connect a channel and pick videos from it. */
export async function canUseYouTube(user: UserLike): Promise<boolean> {
  if (!user) return false
  const { youtube } = await loadIntegrations()
  if (!youtube.enabled) return false
  return youtube.audience === 'members' || (await canEnterAdmin(user))
}

export async function requireYouTubeUser(user: UserLike) {
  if (!user) throw errors.unauthorized()
  await youtubeApp() // "not turned on yet" reads better than "not allowed
  if (!(await canUseYouTube(user))) throw errors.forbidden('YouTube সংযোগের অনুমতি আপনার নেই।')
  return user
}

/** The site's own origin for this request (the redirect URI must match one registered on Google). */
export function requestOrigin(req: PayloadRequest): string {
  const h = req.headers
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')
  if (host) return `${proto.split(',')[0]}://${host.split(',')[0]}`
  return new URL(req.url ?? 'http://localhost:3000').origin
}

/* ---------------- state: ties Google's answer to the user who started it ---------------- */

const sign = (data: string) =>
  createHmac('sha256', `ruhama:youtube-state:${process.env.PAYLOAD_SECRET ?? ''}`)
    .update(data)
    .digest('base64url')

/** userId.expiry.nonce.returnPath, signed; also kept in an httpOnly cookie and compared on return. */
export function createState(userId: number | string, returnTo: string, now = Date.now()): string {
  const body = Buffer.from(
    JSON.stringify({
      u: String(userId),
      e: now + STATE_TTL_MS,
      n: randomBytes(12).toString('base64url'),
      r: returnTo,
    }),
  ).toString('base64url')
  return `${body}.${sign(body)}`
}

export function readState(
  state: string | null | undefined,
  now = Date.now(),
): { userId: string; returnTo: string } | null {
  if (!state) return null
  const [body, mac] = state.split('.')
  if (!body || !mac) return null
  const expected = Buffer.from(sign(body))
  const given = Buffer.from(mac)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as {
      u: string
      e: number
      r: string
    }
    if (typeof data.e !== 'number' || data.e < now) return null
    // only paths on this site, never an outside address
    const returnTo = typeof data.r === 'string' && /^\/(?!\/)/.test(data.r) ? data.r : '/admin'
    return { userId: data.u, returnTo }
  } catch {
    return null
  }
}

export async function authorizeUrl(req: PayloadRequest, state: string) {
  const app = await youtubeApp()
  const url = new URL(AUTH_URL)
  url.search = new URLSearchParams({
    client_id: app.clientId,
    redirect_uri: requestOrigin(req) + CALLBACK_PATH,
    response_type: 'code',
    scope: YOUTUBE_SCOPE,
    // a refresh token every time, so a reconnect always repairs a broken connection
    access_type: 'offline',
    prompt: 'consent select_account',
    include_granted_scopes: 'true',
    state,
  }).toString()
  return url.toString()
}

/* ---------------- tokens ---------------- */

type TokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  error?: string
  error_description?: string
}

async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
    cache: 'no-store',
  })
  return (await res.json().catch(() => ({ error: `HTTP ${res.status}` }))) as TokenResponse
}

export async function exchangeCode(req: PayloadRequest, code: string) {
  const app = await youtubeApp()
  const t = await tokenRequest({
    code,
    client_id: app.clientId,
    client_secret: app.clientSecret,
    redirect_uri: requestOrigin(req) + CALLBACK_PATH,
    grant_type: 'authorization_code',
  })
  if (!t.access_token)
    throw errors.invalid(`Google সংযোগ ব্যর্থ: ${t.error_description || t.error || 'অজানা কারণ'}`)
  if (!(t.scope ?? '').includes(YOUTUBE_SCOPE))
    throw errors.invalid('YouTube দেখার অনুমতি দেওয়া হয়নি। আবার চেষ্টা করে অনুমতির ঘরে টিক দিন।')
  return t
}

// short-lived access tokens, per connection, in this server instance's memory
const accessCache = new Map<number, { token: string; until: number }>()

type ConnectionDoc = {
  id: number
  user: number | { id: number }
  channelId: string
  channelTitle?: string | null
  uploadsPlaylistId?: string | null
  refreshTokenEnc?: string | null
  status?: string | null
}

async function loadConnection(payload: Payload, id: number) {
  return (await payload.findByID({
    collection: 'youtube-connections',
    id,
    depth: 0,
    overrideAccess: true,
    showHiddenFields: true,
    disableErrors: true,
  })) as ConnectionDoc | null
}

/** A connection that belongs to this user (admins cannot read others' videos, only disconnect). */
export async function ownConnection(payload: Payload, user: UserLike, id: number) {
  const c = await loadConnection(payload, id)
  const owner = c && (typeof c.user === 'object' ? c.user.id : c.user)
  if (!c || String(owner) !== String(user?.id))
    throw errors.notFound('এই চ্যানেল সংযোগটি পাওয়া যায়নি।')
  return c
}

async function accessToken(payload: Payload, c: ConnectionDoc): Promise<string> {
  const hit = accessCache.get(c.id)
  if (hit && hit.until > Date.now() + 30_000) return hit.token
  const refresh = decryptSecret(c.refreshTokenEnc)
  if (!refresh)
    throw errors.conflict('চ্যানেলের সংযোগ নষ্ট হয়ে গেছে। আবার Google দিয়ে যুক্ত করুন।')
  const app = await youtubeApp()
  const t = await tokenRequest({
    refresh_token: refresh,
    client_id: app.clientId,
    client_secret: app.clientSecret,
    grant_type: 'refresh_token',
  })
  if (!t.access_token) {
    if (t.error === 'invalid_grant')
      await payload.update({
        collection: 'youtube-connections',
        id: c.id,
        data: { status: 'revoked' },
        overrideAccess: true,
      })
    throw errors.conflict(
      'চ্যানেলের অনুমতি বাতিল বা মেয়াদোত্তীর্ণ হয়েছে। আবার Google দিয়ে যুক্ত করুন।',
    )
  }
  accessCache.set(c.id, {
    token: t.access_token,
    until: Date.now() + (t.expires_in ?? 3600) * 1000,
  })
  return t.access_token
}

async function api<T>(path: string, token: string, params: Record<string, string>): Promise<T> {
  const url = `${API}/${path}?${new URLSearchParams(params)}`
  const res = await fetch(url, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' })
  const json = (await res.json().catch(() => ({}))) as T & {
    error?: { message?: string; errors?: { reason?: string }[] }
  }
  if (!res.ok) {
    const reason = json.error?.errors?.[0]?.reason
    if (reason === 'quotaExceeded')
      throw errors.rateLimited('আজকের YouTube কোটা শেষ। আগামীকাল আবার চেষ্টা করুন।')
    throw errors.invalid(`YouTube থেকে তথ্য আনা যায়নি: ${json.error?.message ?? res.status}`)
  }
  return json
}

/* ---------------- channels and videos ---------------- */

type ChannelItem = {
  id: string
  snippet?: { title?: string; customUrl?: string; thumbnails?: { default?: { url?: string } } }
  contentDetails?: { relatedPlaylists?: { uploads?: string } }
}

/** The channels this Google account manages (usually one), right after connecting. */
export async function myChannels(token: string) {
  const res = await api<{ items?: ChannelItem[] }>('channels', token, {
    part: 'snippet,contentDetails',
    mine: 'true',
    maxResults: '50',
  })
  return (res.items ?? []).map((c) => ({
    channelId: c.id,
    channelTitle: c.snippet?.title ?? c.id,
    channelHandle: c.snippet?.customUrl ?? null,
    channelThumb: c.snippet?.thumbnails?.default?.url ?? null,
    uploadsPlaylistId: c.contentDetails?.relatedPlaylists?.uploads ?? null,
  }))
}

/** Save (or refresh) the user's connections after Google said yes. */
export async function saveConnections(
  payload: Payload,
  userId: number | string,
  token: TokenResponse,
) {
  const channels = await myChannels(token.access_token!)
  if (!channels.length)
    throw errors.invalid(
      'এই Google অ্যাকাউন্টে কোনো YouTube চ্যানেল নেই। চ্যানেলটি যে অ্যাকাউন্টের, সেটি বেছে নিন।',
    )
  const saved: number[] = []
  for (const ch of channels) {
    const existing = await payload.find({
      collection: 'youtube-connections',
      where: { and: [{ user: { equals: userId } }, { channelId: { equals: ch.channelId } }] },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
    const data = {
      ...ch,
      user: Number(userId),
      status: 'active' as const,
      scope: token.scope ?? YOUTUBE_SCOPE,
      connectedAt: new Date().toISOString(),
      // Google sends a refresh token only with consent; keep the old one if this time it did not
      ...(token.refresh_token ? { refreshTokenEnc: encryptSecret(token.refresh_token) } : {}),
    }
    const doc = existing.docs[0]
      ? await payload.update({
          collection: 'youtube-connections',
          id: existing.docs[0].id,
          data,
          overrideAccess: true,
        })
      : await payload.create({ collection: 'youtube-connections', data, overrideAccess: true })
    accessCache.set(doc.id, {
      token: token.access_token!,
      until: Date.now() + (token.expires_in ?? 3600) * 1000,
    })
    saved.push(doc.id)
  }
  return saved
}

export type ChannelVideo = {
  id: string
  title: string
  thumb: string
  publishedAt: string | null
  privacy: 'public' | 'unlisted' | 'private' | 'unknown'
  embeddable: boolean
  durationSeconds: number | null
  live: boolean
}

/** ISO 8601 duration (PT1H2M3S) in seconds. */
export function parseDuration(iso: string | null | undefined): number | null {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso ?? '')
  if (!m) return null
  const [, d, h, min, s] = m.map((x) => Number(x ?? 0))
  return d! * 86400 + h! * 3600 + min! * 60 + s!
}

/** One page of a connected channel's uploads, newest first, with what the site needs to know. */
export async function channelVideos(payload: Payload, c: ConnectionDoc, pageToken?: string | null) {
  const token = await accessToken(payload, c)
  let uploads = c.uploadsPlaylistId
  if (!uploads) {
    const ch = (await myChannels(token)).find((x) => x.channelId === c.channelId)
    uploads = ch?.uploadsPlaylistId ?? null
    if (!uploads) throw errors.notFound('চ্যানেলের ভিডিও তালিকা পাওয়া যায়নি।')
    await payload.update({
      collection: 'youtube-connections',
      id: c.id,
      data: { uploadsPlaylistId: uploads },
      overrideAccess: true,
    })
  }
  const page = await api<{
    items?: { contentDetails?: { videoId?: string } }[]
    nextPageToken?: string
    pageInfo?: { totalResults?: number }
  }>('playlistItems', token, {
    part: 'contentDetails',
    playlistId: uploads,
    maxResults: '24',
    ...(pageToken ? { pageToken } : {}),
  })
  const ids = (page.items ?? []).map((i) => i.contentDetails?.videoId).filter(Boolean) as string[]
  let videos: ChannelVideo[] = []
  if (ids.length) {
    const details = await api<{
      items?: {
        id: string
        snippet?: {
          title?: string
          publishedAt?: string
          liveBroadcastContent?: string
          thumbnails?: Record<string, { url?: string }>
        }
        status?: { privacyStatus?: string; embeddable?: boolean }
        contentDetails?: { duration?: string }
      }[]
    }>('videos', token, {
      part: 'snippet,status,contentDetails',
      id: ids.join(','),
      maxResults: '50',
    })
    const byId = new Map((details.items ?? []).map((v) => [v.id, v]))
    videos = ids.map((id) => {
      const v = byId.get(id)
      const p = v?.status?.privacyStatus
      return {
        id,
        title: v?.snippet?.title ?? id,
        thumb:
          v?.snippet?.thumbnails?.medium?.url ??
          v?.snippet?.thumbnails?.default?.url ??
          `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
        publishedAt: v?.snippet?.publishedAt ?? null,
        privacy: p === 'public' || p === 'unlisted' || p === 'private' ? p : 'unknown',
        embeddable: v?.status?.embeddable !== false,
        durationSeconds: parseDuration(v?.contentDetails?.duration),
        live: (v?.snippet?.liveBroadcastContent ?? 'none') !== 'none',
      }
    })
  }
  await payload.update({
    collection: 'youtube-connections',
    id: c.id,
    data: { lastUsedAt: new Date().toISOString() },
    overrideAccess: true,
  })
  return {
    videos,
    nextPageToken: page.nextPageToken ?? null,
    total: page.pageInfo?.totalResults ?? null,
  }
}

/** Disconnect: tell Google to forget the permission, then remove the saved connection. */
export async function removeConnection(payload: Payload, c: ConnectionDoc) {
  const refresh = decryptSecret(c.refreshTokenEnc)
  if (refresh)
    await fetch(`${REVOKE_URL}?token=${encodeURIComponent(refresh)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    }).catch(() => null)
  accessCache.delete(c.id)
  await payload.delete({ collection: 'youtube-connections', id: c.id, overrideAccess: true })
}

export { loadConnection }
