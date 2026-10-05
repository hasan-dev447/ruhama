/**
 * Which request header carries the real client address depends on what sits in front of the app, and
 * trusting the wrong one lets anyone pick their own IP (and dodge every rate limit). By default only the
 * headers Vercel overwrites itself are read. Behind another proxy, set TRUSTED_IP_HEADER to the one header
 * it controls (for example cf-connecting-ip when Cloudflare proxies the domain).
 */
type IpEnv = { TRUSTED_IP_HEADER?: string | undefined } & Record<string, string | undefined>

export function trustedIpHeaders(env: IpEnv = process.env): string[] {
  const configured = env.TRUSTED_IP_HEADER?.trim().toLowerCase()
  return configured ? [configured] : ['x-real-ip', 'x-forwarded-for']
}

export function clientIpFrom(headers: Headers, env?: IpEnv): string {
  for (const name of trustedIpHeaders(env)) {
    const value = headers.get(name)?.split(',')[0]?.trim()
    if (value) return value
  }
  return 'unknown'
}
