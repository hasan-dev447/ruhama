import 'server-only'

import { headers } from 'next/headers'

import type { User } from '@/payload-types'

import { getPayloadClient } from './payload'
import type { ServiceContext } from './services/context'
import { isServiceError } from './services/errors'
import { clientIp } from './services/rate-limit'

/** Build a service context for a Server Action from the current request. */
export async function actionContext(): Promise<ServiceContext> {
  const [payload, h] = await Promise.all([getPayloadClient(), headers()])
  const { user } = await payload.auth({ headers: h })
  return { payload, user: (user as User | null) ?? null, ip: clientIp(h) }
}

/** Turn any thrown error into an ActionResult failure with a Bangla message. */
export function actionError(err: unknown): {
  ok: false
  error: string
  code?: string
  fieldErrors?: Record<string, string>
} {
  if (isServiceError(err)) {
    const details = err.details as { path: string; message: string }[] | undefined
    const fieldErrors = Array.isArray(details)
      ? Object.fromEntries(details.map((d) => [d.path, d.message]))
      : undefined
    return { ok: false, error: err.message, code: err.code, fieldErrors }
  }
  if (err && typeof err === 'object' && 'issues' in err) {
    const issues = (err as { issues: { path: (string | number)[]; message: string }[] }).issues
    return {
      ok: false,
      error: issues[0]?.message ?? 'তথ্যগুলো ঠিকমতো পূরণ করুন।',
      code: 'VALIDATION_ERROR',
      fieldErrors: Object.fromEntries(issues.map((i) => [i.path.join('.'), i.message])),
    }
  }
  console.error('[action] unexpected error', err)
  return {
    ok: false,
    error: 'কিছু একটা সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।',
    code: 'INTERNAL_ERROR',
  }
}
