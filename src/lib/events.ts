/**
 * When a মজলিস counts as over: at its end time, or three hours after it starts when no end time is
 * set. The home page, the /events tabs, the event page and the admin all use this one rule.
 */
export const EVENT_GRACE_MS = 3 * 3600 * 1000

export function eventEndTime(e: { startsAt: string; endsAt?: string | null }): number {
  return e.endsAt ? new Date(e.endsAt).getTime() : new Date(e.startsAt).getTime() + EVENT_GRACE_MS
}

export function eventEnded(
  e: { startsAt: string; endsAt?: string | null },
  now: number = Date.now(),
): boolean {
  return eventEndTime(e) < now
}

/** Registration closes this many hours before the start (the মজলিস menu's rule); 0 keeps it open. */
export function registrationClosedEarly(
  startsAt: string,
  hoursBefore: number,
  now: number = Date.now(),
): boolean {
  return hoursBefore > 0 && now > new Date(startsAt).getTime() - hoursBefore * 3_600_000
}
