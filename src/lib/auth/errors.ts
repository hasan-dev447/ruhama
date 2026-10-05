import { safeRedirectPath } from '@/lib/safe-path'

/** Bangla messages for Better Auth error codes shown on the auth pages. */
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'ইমেইল বা পাসওয়ার্ড মেলেনি। আবার দেখে নিন।',
  INVALID_EMAIL: 'সঠিক ইমেইল ঠিকানা দিন।',
  INVALID_PASSWORD: 'পাসওয়ার্ড মেলেনি।',
  EMAIL_NOT_VERIFIED: 'ইমেইল এখনো যাচাই করা হয়নি। ইনবক্সে পাঠানো লিংকে ক্লিক করুন।',
  USER_ALREADY_EXISTS: 'এই ইমেইলে আগেই অ্যাকাউন্ট আছে। লগইন করুন অথবা পাসওয়ার্ড রিসেট করুন।',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    'এই ইমেইলে আগেই অ্যাকাউন্ট আছে। লগইন করুন অথবা পাসওয়ার্ড রিসেট করুন।',
  PASSWORD_TOO_SHORT: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।',
  PASSWORD_TOO_LONG: 'পাসওয়ার্ড অনেক বড় হয়ে গেছে।',
  INVALID_TOKEN: 'লিংকটির মেয়াদ শেষ বা লিংকটি সঠিক নয়। নতুন লিংক নিন।',
  TOKEN_EXPIRED: 'লিংকটির মেয়াদ শেষ হয়ে গেছে। নতুন লিংক নিন।',
  INVALID_OTP: 'কোডটি সঠিক নয়। আবার দেখে লিখুন।',
  OTP_EXPIRED: 'কোডের মেয়াদ শেষ। নতুন কোড নিন।',
  TOO_MANY_ATTEMPTS: 'অনেকবার ভুল কোড দেওয়া হয়েছে। নতুন কোড নিন।',
  INVALID_PHONE: 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন।',
  INVALID_PHONE_NUMBER: 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন।',
  MISSING_RESPONSE: 'নিরাপত্তা যাচাই সম্পন্ন করুন।',
  VERIFICATION_FAILED: 'নিরাপত্তা যাচাই ব্যর্থ হয়েছে। আবার চেষ্টা করুন।',
  BANNED_USER: 'এই অ্যাকাউন্টটি সাময়িকভাবে স্থগিত আছে। প্রয়োজনে যোগাযোগ করুন।',
  RATE_LIMITED: 'অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।',
}

export function authErrorMessage(
  error: { code?: string; message?: string; status?: number } | null | undefined,
): string {
  if (!error) return 'কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।'
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code]!
  if (error.status === 429) return MESSAGES.RATE_LIMITED!
  // our own guards already return Bangla messages
  if (error.message && /[ঀ-৿]/.test(error.message)) return error.message
  return 'কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।'
}

/** Only allow redirects back into this site. */
export const safeNext = (next: string | null | undefined, fallback = '/dashboard') =>
  safeRedirectPath(next, fallback)
