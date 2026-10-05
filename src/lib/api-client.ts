/**
 * Small fetch wrapper for the versioned REST API (/api/v1).
 * Every error response has the shape { error: { code, message, details? } }.
 */

export type ApiErrorBody = { error: { code: string; message: string; details?: unknown } }

export class ApiError extends Error {
  code: string
  status: number
  details?: unknown
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, headers, ...rest } = init ?? {}
  const res = await fetch(path.startsWith('/api/') ? path : `/api/v1${path}`, {
    credentials: 'same-origin',
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })
  if (res.status === 204) return undefined as T
  const text = await res.text()
  const data = text ? (JSON.parse(text) as unknown) : undefined
  if (!res.ok) {
    const err = (data as ApiErrorBody | undefined)?.error
    throw new ApiError(
      res.status,
      err?.code ?? 'UNKNOWN',
      err?.message ?? 'কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।',
      err?.details,
    )
  }
  return data as T
}
