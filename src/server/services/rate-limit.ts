import { createHash } from 'node:crypto'

import type { Payload } from 'payload'

import { clientIpFrom } from '@/lib/client-ip'

export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: Date; count: number }

/**
 * Fixed-window rate limiter backed by Postgres (works across serverless instances).
 * One atomic upsert per check.
 */
export async function consumeRateLimit(
  payload: Payload,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const hashed = createHash('sha256').update(key).digest('hex').slice(0, 40)
  const pool = (
    payload.db as unknown as {
      pool: {
        query: (q: string, v: unknown[]) => Promise<{ rows: { count: number; reset_at: Date }[] }>
      }
    }
  ).pool
  const { rows } = await pool.query(
    `INSERT INTO rate_limits (key, count, reset_at, updated_at, created_at)
     VALUES ($1, 1, now() + make_interval(secs => $2), now(), now())
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN rate_limits.reset_at < now() THEN 1 ELSE rate_limits.count + 1 END,
       reset_at = CASE WHEN rate_limits.reset_at < now() THEN now() + make_interval(secs => $2) ELSE rate_limits.reset_at END,
       updated_at = now()
     RETURNING count, reset_at`,
    [hashed, windowSeconds],
  )
  const row = rows[0]!
  const count = Number(row.count)
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt: new Date(row.reset_at),
    count,
  }
}

/** Remove expired windows; called by the daily maintenance cron. */
export async function purgeExpiredRateLimits(payload: Payload) {
  const pool = (payload.db as unknown as { pool: { query: (q: string) => Promise<unknown> } }).pool
  await pool.query(`DELETE FROM rate_limits WHERE reset_at < now() - interval '1 day'`)
}

/** The caller's address, read only from headers the deployment's proxy controls (see lib/client-ip). */
export const clientIp = (headers: Headers): string => clientIpFrom(headers)
