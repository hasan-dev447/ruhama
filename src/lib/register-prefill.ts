/**
 * Hands what someone already typed (on the join form, for example) to the registration form, so they
 * need not type it again. Kept in this tab's sessionStorage, never in the URL (it would land in
 * history and server logs), read once and then removed.
 */

const KEY = 'rh-register-prefill'

export type RegisterPrefill = { name?: string; email?: string; phone?: string }

export function saveRegisterPrefill(values: RegisterPrefill) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(values))
  } catch {
    // storage blocked: the form simply starts empty
  }
}

export function takeRegisterPrefill(): RegisterPrefill | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    sessionStorage.removeItem(KEY)
    const v = JSON.parse(raw) as RegisterPrefill
    const str = (x: unknown) => (typeof x === 'string' ? x.slice(0, 200) : undefined)
    return { name: str(v.name), email: str(v.email), phone: str(v.phone) }
  } catch {
    return null
  }
}
