/** Cloudflare's documented always-pass test secret, used only outside production. */
export const TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA'

/**
 * The secret matching the site key in lib/turnstile-site-key.ts: the real one in a production build
 * (null without it, so checks fail closed), Cloudflare's test secret under `npm run dev`.
 */
export function turnstileSecret(): string | null {
  if (process.env.NODE_ENV !== 'production') return TURNSTILE_TEST_SECRET
  return process.env.TURNSTILE_SECRET_KEY || null
}

/** Verify a Turnstile token server-side. */
export async function verifyTurnstile(
  token: string | null | undefined,
  ip?: string,
): Promise<boolean> {
  const secret = turnstileSecret()
  if (!secret) {
    console.error('[turnstile] TURNSTILE_SECRET_KEY is not configured')
    return false
  }
  if (!token) return false
  try {
    const body = new URLSearchParams({ secret, response: token })
    if (ip && ip !== 'unknown') body.set('remoteip', ip)
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(8000),
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    return false
  }
}
