/** Cloudflare's always-pass test site key, used when no real key is configured (development, tests). */
export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'
