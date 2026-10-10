/** Cloudflare's always-pass test key: it shows a red "For testing only" note, so never in production. */
const TEST_SITE_KEY = '1x00000000000000000000AA'

/**
 * The Turnstile site key.
 * - Production build (the live site): the real key, or null without one. The server refuses
 *   registration and OTP requests without a real secret anyway (see services/turnstile.ts), so the
 *   form then explains that the check is not set up instead of showing the test widget.
 * - `npm run dev`: always Cloudflare's test key, even when the real one is in .env, because a real
 *   key only works on the hostnames it was made for (the live domain), not on localhost.
 */
export const TURNSTILE_SITE_KEY: string | null =
  process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null
    : TEST_SITE_KEY
