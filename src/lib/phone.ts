/**
 * Bangladeshi mobile numbers. Accepts local (01XXXXXXXXX), 8801… and +8801… forms,
 * Bangla digits included, and normalises to E.164 (+8801XXXXXXXXX).
 */
const BN_TO_ASCII: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
}

export function normalizeBdPhone(input: string): string | null {
  const ascii = input.replace(/[০-৯]/g, (d) => BN_TO_ASCII[d] ?? d).replace(/[\s\-()]/g, '')
  let digits = ascii.replace(/^\+/, '')
  if (/^01[3-9]\d{8}$/.test(digits)) digits = `88${digits}`
  if (/^8801[3-9]\d{8}$/.test(digits)) return `+${digits}`
  return null
}

export const isValidBdPhone = (input: string) => normalizeBdPhone(input) !== null

/** Mask for display, e.g. ০১৭XXXXXX১২ style is applied by the caller; here +8801712•••••12 */
export function maskPhone(e164: string): string {
  const local = e164.replace(/^\+88/, '')
  return `${local.slice(0, 3)}XXXXXX${local.slice(-2)}`
}

/**
 * Temporary addresses for accounts that arrived without an email: older phone-only accounts, and
 * Facebook accounts that share no email. Such a member is asked for a real address on /onboarding
 * before anything else works.
 */
export const PHONE_EMAIL_DOMAIN = 'phone.ruhama.local'
export const FACEBOOK_EMAIL_DOMAIN = 'facebook.ruhama.local'
export const phonePlaceholderEmail = (e164: string) =>
  `${e164.replace(/\D/g, '')}@${PHONE_EMAIL_DOMAIN}`
export const facebookPlaceholderEmail = (facebookId: string) =>
  `fb-${facebookId.replace(/\W/g, '')}@${FACEBOOK_EMAIL_DOMAIN}`
export const isPlaceholderEmail = (email: string | null | undefined) =>
  Boolean(
    email &&
    (email.endsWith(`@${PHONE_EMAIL_DOMAIN}`) || email.endsWith(`@${FACEBOOK_EMAIL_DOMAIN}`)),
  )
