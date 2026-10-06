import { r2Endpoint } from './r2'

/**
 * Response security headers, applied to every route from next.config.ts.
 *
 * The CSP is static rather than nonce-based: a per-request nonce would force every page to render
 * dynamically and give up ISR. Scripts are limited to this origin plus Cloudflare Turnstile; the inline
 * scripts Next.js emits for streaming need 'unsafe-inline'. Everything else (frames, connections, media)
 * is an explicit allowlist built from the configured services.
 */

type Env = Partial<
  Record<
    | 'NODE_ENV'
    | 'NEXT_PUBLIC_MEDIA_URL'
    | 'NEXT_PUBLIC_SUPABASE_URL'
    | 'NEXT_PUBLIC_SITE_URL'
    | 'R2_ENDPOINT'
    | 'R2_BUCKET',
    string
  >
>

/** HTTPS-only directives are skipped for a production build served over plain http (local `npm run start`). */
const servedOverHttps = (env: Env) =>
  env.NODE_ENV === 'production' && (env.NEXT_PUBLIC_SITE_URL ?? '').startsWith('https://')

const origin = (value?: string) => {
  if (!value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

export function contentSecurityPolicy(env: Env = process.env): string {
  const dev = env.NODE_ENV !== 'production'
  const media = origin(env.NEXT_PUBLIC_MEDIA_URL)
  const supabase = origin(env.NEXT_PUBLIC_SUPABASE_URL)
  // the admin uploads files straight to the bucket
  const r2 = origin(r2Endpoint(env.R2_ENDPOINT, env.R2_BUCKET))
  const turnstile = 'https://challenges.cloudflare.com'

  const directives: Record<string, (string | null | false)[]> = {
    'default-src': ["'self'"],
    // Vercel Analytics and Speed Insights load from /_vercel on Vercel, from their CDN in development
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      dev && "'unsafe-eval'",
      dev && 'https://va.vercel-scripts.com',
      turnstile,
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    // avatars from Google or Facebook sign-in and YouTube thumbnails arrive from many hosts
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      supabase,
      supabase && supabase.replace(/^https:/, 'wss:'),
      turnstile,
      r2,
      dev && 'ws:',
    ],
    'media-src': ["'self'", 'blob:', media],
    'frame-src': ['https://www.youtube-nocookie.com', turnstile, "'self'"],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    // the admin's live preview shows the site in an iframe on the same origin
    'frame-ancestors': ["'self'"],
  }
  const parts = Object.entries(directives).map(([name, values]) =>
    [name, ...values.filter(Boolean)].join(' '),
  )
  if (servedOverHttps(env)) parts.push('upgrade-insecure-requests')
  return parts.join('; ')
}

export function securityHeaders(env: Env = process.env): { key: string; value: string }[] {
  const headers = [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(env) },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
    },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
  ]
  if (servedOverHttps(env))
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    })
  return headers
}
