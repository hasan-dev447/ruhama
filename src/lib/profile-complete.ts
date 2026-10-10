import { isPlaceholderEmail } from './phone'

/**
 * What a member still has to give before using the site.
 *
 * - ভাই / বোন: always, right away (Google, Facebook and older accounts choose it on /onboarding).
 * - A confirmed email: an account that arrived without one (Facebook without an email, older
 *   phone-only accounts) may use the site for EMAIL_GRACE_DAYS from sign-up, with a reminder on every
 *   page; after that it is held at /onboarding until an email is confirmed with a code. The email only
 *   joins the account once confirmed, so typing someone else's address takes it from no one.
 */

export const EMAIL_GRACE_DAYS = 7
const DAY_MS = 86_400_000

type ProfileUser = {
  gender?: string | null
  email?: string | null
  createdAt?: string | Date | null
}

/** The email reminder: whether one is needed, until when, and whether that time is up. */
export function emailGrace(user: ProfileUser, now = Date.now()) {
  const needed = isPlaceholderEmail(user.email)
  const created = user.createdAt ? new Date(user.createdAt).getTime() : NaN
  // an account without a known start date gets no grace (safer than unlimited)
  const deadline = Number.isFinite(created) ? created + EMAIL_GRACE_DAYS * DAY_MS : now
  return {
    needed,
    deadline: new Date(deadline),
    daysLeft: Math.max(0, Math.ceil((deadline - now) / DAY_MS)),
    expired: needed && deadline <= now,
  }
}

/** What blocks the account now: ভাই / বোন missing, or the email time is up. */
export function missingProfile(user: ProfileUser, now = Date.now()) {
  return { gender: !user.gender, email: emailGrace(user, now).expired }
}

export const isProfileIncomplete = (user: ProfileUser, now = Date.now()) => {
  const m = missingProfile(user, now)
  return m.gender || m.email
}
