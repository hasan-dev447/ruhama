/** Result returned by every server action, so forms can show inline errors without throwing. */
export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string; code?: string; fieldErrors?: Record<string, string> }
