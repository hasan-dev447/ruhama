import { existsSync, readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test'

/** Seeded accounts (scripts/seed.ts); the password follows SEED_PASSWORD like the seed script does. */
export const SEED_PASSWORD = process.env.SEED_PASSWORD || 'Ruhama@2026'
export const ACCOUNTS = {
  member: 'abdullah@ruhama.local',
  member2: 'fatima@ruhama.local',
  member3: 'nusrat@ruhama.local',
  newMember: 'karim@ruhama.local',
  moderator: 'moderator@ruhama.local',
  admin: 'admin@ruhama.local',
  editor: 'tanvir@ruhama.local',
  author: 'abdurrahman@ruhama.local',
  reviewer1: 'mahmudul@ruhama.local',
  reviewer2: 'imran@ruhama.local',
  publisher: 'hakim@ruhama.local',
} as const

export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'
const ORIGIN = new URL(BASE_URL).origin

/**
 * A fresh address from the benchmarking range (198.18.0.0/15), so the per-IP limits (10 sign-ins or
 * 3 OTP requests a minute) don't trip across a whole suite run from one machine. This only has an
 * effect where the app trusts x-forwarded-for from the client, i.e. a local server; on Vercel the
 * platform overwrites the header.
 */
export const testIp = () =>
  `198.18.${Math.floor(Math.random() * 256)}.${1 + Math.floor(Math.random() * 254)}`

/** Same-origin requests from this page carry their own test address (cross-origin ones, like Turnstile, are untouched). */
export async function routeWithTestIp(page: Page, ip = testIp()) {
  await page.route(
    (url) => url.origin === ORIGIN,
    (route) => route.continue({ headers: { ...route.request().headers(), 'x-forwarded-for': ip } }),
  )
}

// Better Auth and Payload reject cookie-bearing POSTs without a trusted Origin (CSRF protection)
const apiHeaders = () => ({ origin: ORIGIN, 'x-forwarded-for': testIp() })

/** Where global setup keeps each seeded account's session. */
export const stateFile = (email: string) =>
  path.join('tests/e2e/.auth', `${email.replace(/[^a-z0-9]+/gi, '_')}.json`)

/**
 * Act as a seeded account: reuses the session from global setup (no new sign-in, so the per-account
 * login limit is never hit) and falls back to a real sign-in for other accounts.
 */
export async function signIn(page: Page, email: string, password = SEED_PASSWORD) {
  const file = stateFile(email)
  if (existsSync(file)) {
    const state = JSON.parse(readFileSync(file, 'utf8')) as {
      cookies: Parameters<BrowserContext['addCookies']>[0]
    }
    await page.context().addCookies(state.cookies)
    return
  }
  await signInFresh(page, email, password)
}

/** A brand-new session through the auth API, for tests that sign out or revoke sessions on purpose. */
export async function signInFresh(page: Page, email: string, password = SEED_PASSWORD) {
  const res = await page.request.post('/api/auth/sign-in/email', {
    data: { email, password },
    headers: apiHeaders(),
  })
  expect(res.ok(), `sign-in failed for ${email}: ${res.status()}`).toBeTruthy()
}

export async function signOut(page: Page) {
  const res = await page.request.post('/api/auth/sign-out', { data: {}, headers: apiHeaders() })
  expect(res.ok(), `sign-out failed: ${res.status()}`).toBeTruthy()
}

/** A separate, signed-in browser for one role, so several people can act in one test. */
export async function asUser(
  browser: Browser,
  email: string,
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    locale: 'bn-BD',
    timezoneId: 'Asia/Dhaka',
  })
  const page = await context.newPage()
  await routeWithTestIp(page)
  await signIn(page, email)
  return { context, page }
}

/** JSON call to the app's own API as the page's signed-in user; fails the test on an error status unless `allow` lists it. */
export async function api<T = unknown>(
  page: Page,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  url: string,
  data?: unknown,
  allow: number[] = [],
): Promise<{ status: number; body: T }> {
  const res = await page.request.fetch(url, { method, data, headers: apiHeaders() })
  const text = await res.text()
  const body = (text ? JSON.parse(text) : null) as T
  if (!res.ok() && !allow.includes(res.status()))
    throw new Error(`${method} ${url} → ${res.status()}: ${text.slice(0, 400)}`)
  return { status: res.status(), body }
}

/**
 * The signed-in user's email as the auth API sees it. Sent with its own test address: these checks run
 * in polling loops and would otherwise share one IP and hit the general limit of 120 requests a minute.
 */
export async function currentUser(
  page: Page,
): Promise<{ email?: string; phoneNumber?: string | null } | null> {
  const res = await page.request.get('/api/auth/get-session', {
    headers: { 'x-forwarded-for': testIp() },
  })
  const body = (await res.json().catch(() => null)) as {
    user?: { email?: string; phoneNumber?: string | null }
  } | null
  return body?.user ?? null
}

/** Unique suffix so repeated runs never collide on unique fields. */
export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/* ---------------- local outbox (OUTBOX_DIR) for emails and SMS ---------------- */

const OUTBOX_DIR = path.resolve(process.env.OUTBOX_DIR ?? '.outbox')
type OutboxRecord = { to: string; subject?: string; text?: string; message?: string; at: string }

/**
 * Wait for the newest email or SMS to `to` written after `since`. The app writes these instead of
 * sending them when OUTBOX_DIR is set on the server (see .env.example).
 */
export async function waitForOutbox(
  kind: 'email' | 'sms',
  to: string,
  since: number,
  opts: { subject?: RegExp; timeout?: number } = {},
): Promise<OutboxRecord> {
  const timeout = opts.timeout ?? 20_000
  const file = path.join(OUTBOX_DIR, `${kind}.jsonl`)
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const lines = await readFile(file, 'utf8').catch(() => '')
    const hit = lines
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l) as OutboxRecord)
      .filter(
        (r) =>
          r.to === to &&
          Date.parse(r.at) >= since - 1000 &&
          (!opts.subject || opts.subject.test(r.subject ?? '')),
      )
      .at(-1)
    if (hit) return hit
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`no ${kind} to ${to} in ${file} (is OUTBOX_DIR set for the server?)`)
}

/** First app link in a message, moved onto the origin under test (emails are built with the site URL). */
export function linkIn(text: string | undefined, pathPart: string): string {
  const raw = (text ?? '').match(/https?:\/\/[^\s"'<>]+/g)?.find((u) => u.includes(pathPart))
  if (!raw) throw new Error(`no link containing ${pathPart} in: ${text}`)
  const url = new URL(raw)
  return `${url.pathname}${url.search}`
}

/** A Bangladeshi mobile number nobody uses yet, in local format (০১... typed as ASCII digits). */
export const freshPhone = () => `017${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`

/** Lexical rich text with plain paragraphs, for content created through the API. */
export const lexical = (...paragraphs: string[]) => ({
  root: {
    type: 'root',
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      version: 1,
      direction: 'ltr',
      format: '',
      indent: 0,
      textFormat: 0,
      textStyle: '',
      children: [
        { type: 'text', version: 1, text, format: 0, detail: 0, mode: 'normal', style: '' },
      ],
    })),
  },
})

/** Wait until Turnstile (test keys locally) has issued its token, so forms that need it can submit. */
export async function turnstileReady(page: Page) {
  await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveValue(/.+/, {
    timeout: 20_000,
  })
}
