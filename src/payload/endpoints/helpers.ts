import {
  addDataAndFileToRequest,
  type Endpoint,
  type PayloadHandler,
  type PayloadRequest,
} from 'payload'
import { ZodError, type ZodType } from 'zod'

import type { User } from '@/payload-types'
import type { ServiceContext } from '@/server/services/context'
import { isServiceError } from '@/server/services/errors'
import { clientIp } from '@/server/services/rate-limit'

/** Consistent JSON error body for every v1 endpoint. */
export function errorResponse(status: number, code: string, message: string, details?: unknown) {
  return Response.json(
    { error: { code, message, ...(details !== undefined ? { details } : {}) } },
    { status },
  )
}

export function toErrorResponse(err: unknown, req?: PayloadRequest): Response {
  if (isServiceError(err)) return errorResponse(err.status, err.code, err.message, err.details)
  if (err instanceof ZodError) {
    return errorResponse(
      422,
      'VALIDATION_ERROR',
      'তথ্যগুলো ঠিকমতো পূরণ করুন।',
      err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    )
  }
  const apiErr = err as { status?: number; message?: string; isPublic?: boolean }
  if (apiErr?.status && apiErr.status < 500 && apiErr.isPublic)
    return errorResponse(
      apiErr.status,
      'REQUEST_ERROR',
      apiErr.message ?? 'অনুরোধটি সম্পন্ন করা যায়নি।',
    )
  req?.payload.logger.error({ err, msg: 'v1 endpoint failed' })
  return errorResponse(
    500,
    'INTERNAL_ERROR',
    'কিছু একটা সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।',
  )
}

export function serviceContext(req: PayloadRequest): ServiceContext {
  return {
    payload: req.payload,
    user: (req.user as User | null) ?? null,
    req,
    ip: clientIp(req.headers),
  }
}

export async function readBody<T>(req: PayloadRequest, schema: ZodType<T>): Promise<T> {
  await addDataAndFileToRequest(req)
  return schema.parse(req.data ?? {})
}

export function query(req: PayloadRequest): URLSearchParams {
  return new URL(req.url ?? 'http://localhost').searchParams
}

type V1Handler = (req: PayloadRequest, ctx: ServiceContext) => Promise<unknown>

/** Define a v1 endpoint: wraps errors, builds the service context and serialises JSON. */
export function v1(
  method: Endpoint['method'],
  path: string,
  fn: V1Handler,
  opts: { cache?: string } = {},
): Endpoint {
  const handler: PayloadHandler = async (req) => {
    try {
      const result = await fn(req, serviceContext(req))
      if (result instanceof Response) return result
      if (result === undefined) return new Response(null, { status: 204 })
      return Response.json(result, {
        headers: { 'Cache-Control': opts.cache ?? 'private, no-store' },
      })
    } catch (err) {
      return toErrorResponse(err, req)
    }
  }
  return { method, path: `/v1${path}`, handler }
}

export const param = (req: PayloadRequest, name: string) =>
  String((req.routeParams as Record<string, unknown> | undefined)?.[name] ?? '')

export const numericId = (value: string) => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : value
}
