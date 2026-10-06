import { expo } from '@better-auth/expo'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { nextCookies } from 'better-auth/next-js'
import { admin, bearer, captcha, magicLink, phoneNumber } from 'better-auth/plugins'
import { adminAc, userAc } from 'better-auth/plugins/admin/access'
import type { BetterAuthPlugin } from 'better-auth'
import type { BetterAuthOptions, PayloadAuthOptions } from 'payload-auth/better-auth'

import { normalizeBdPhone, phonePlaceholderEmail } from '@/lib/phone'
import { ROLES } from '@/lib/roles'

import { emailTemplates } from '../email/templates'
import { sendEmail } from '../email'
import { cachedIntegrations, loadIntegrations } from '../integrations'
import { sendSms } from '../sms'
import { trustedIpHeaders } from '@/lib/client-ip'

import { clientIp, consumeRateLimit } from '../services/rate-limit'
import { turnstileSecret } from '../services/turnstile'

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
const appScheme = process.env.MOBILE_APP_SCHEME || 'ruhama'

/**
 * Google and Facebook credentials come from admin > Integrations (falling back to .env). Better Auth keeps
 * these objects and reads clientId/clientSecret when a sign-in starts, so the getters pick up saved changes
 * without a redeploy; `warmIntegrations` below loads the latest values before every OAuth request.
 */
const oauthCredentials = <T extends object>(provider: 'google' | 'facebook', extra: T) =>
  Object.defineProperties(extra, {
    clientId: { enumerable: true, get: () => cachedIntegrations()[provider].clientId },
    clientSecret: { enumerable: true, get: () => cachedIntegrations()[provider].clientSecret },
  }) as T & { clientId: string; clientSecret: string }
const google = oauthCredentials('google', { prompt: 'select_account' as const })
const facebook = oauthCredentials('facebook', {})

const OAUTH_PROVIDERS = new Set(['google', 'facebook'])

/** Loads current integration settings and refuses providers that are switched off or not configured. */
const warmIntegrations = createAuthMiddleware(async (ctx) => {
  const settings = await loadIntegrations()
  const body = (ctx.body ?? {}) as { provider?: string }
  const provider = ctx.path.startsWith('/callback/')
    ? ctx.path.slice('/callback/'.length)
    : body.provider
  if (
    provider &&
    OAUTH_PROVIDERS.has(provider) &&
    !settings[provider as 'google' | 'facebook'].enabled
  ) {
    throw new APIError('BAD_REQUEST', {
      message: 'এই পদ্ধতিতে লগইন এখন বন্ধ আছে।',
      code: 'PROVIDER_DISABLED',
    })
  }
})

const isOAuthPath = (path = '') =>
  path === '/sign-in/social' || path === '/link-social' || path.startsWith('/callback/')

const captchaSecret = turnstileSecret()

function randomSuffix(len = 5) {
  return Math.random()
    .toString(36)
    .slice(2, 2 + len)
}

/** Readable, unique-enough public handle for member profile URLs. */
export function makeUsername(
  email: string | null | undefined,
  name: string | null | undefined,
): string {
  const fromEmail =
    (email ?? '')
      .split('@')[0]
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') ?? ''
  const fromName = (name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const base = (/^\d+$/.test(fromEmail) ? '' : fromEmail) || fromName || 'member'
  return `${base.slice(0, 24)}-${randomSuffix()}`
}

async function payloadInstance() {
  const [{ getPayload }, { default: config }] = await Promise.all([
    import('payload'),
    import('@payload-config'),
  ])
  return getPayload({ config })
}

/** Per-identifier limits on top of Better Auth's per-IP limits. */
const limitIdentifiers = createAuthMiddleware(async (ctx) => {
  const path = ctx.path
  const headers = ctx.headers ?? new Headers()
  const ip = clientIp(headers)
  const body = (ctx.body ?? {}) as Record<string, unknown>
  const rules: { key: string; limit: number; window: number }[] = []

  // fail closed: without a Turnstile secret (production with the key missing) the captcha plugin is not
  // installed, so these endpoints would accept bots. Refuse them instead of silently skipping the check.
  if (!captchaSecret && (path === '/sign-up/email' || path === '/phone-number/send-otp')) {
    console.error(
      '[auth] TURNSTILE_SECRET_KEY is not configured; sign-up and OTP requests are refused',
    )
    throw new APIError('SERVICE_UNAVAILABLE', {
      message: 'নিরাপত্তা যাচাই এখন চালু নেই। কিছুক্ষণ পর আবার চেষ্টা করুন।',
      code: 'CAPTCHA_NOT_CONFIGURED',
    })
  }

  let normalizedPhone: string | null = null
  if (path === '/phone-number/send-otp' || path === '/phone-number/verify') {
    normalizedPhone =
      typeof body.phoneNumber === 'string' ? normalizeBdPhone(body.phoneNumber) : null
    if (!normalizedPhone)
      throw new APIError('BAD_REQUEST', {
        message: 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন।',
        code: 'INVALID_PHONE',
      })
  }

  if (path === '/phone-number/send-otp') {
    rules.push(
      { key: `otp-send:phone:${normalizedPhone}`, limit: 3, window: 15 * 60 },
      { key: `otp-send:ip:${ip}`, limit: 10, window: 60 * 60 },
    )
  } else if (path === '/phone-number/verify') {
    rules.push(
      { key: `otp-verify:phone:${normalizedPhone}`, limit: 6, window: 15 * 60 },
      { key: `otp-verify:ip:${ip}`, limit: 20, window: 60 * 60 },
    )
  } else if (path === '/sign-in/email') {
    const email = typeof body.email === 'string' ? body.email.toLowerCase() : ''
    rules.push(
      { key: `login:email:${email}`, limit: 8, window: 15 * 60 },
      { key: `login:ip:${ip}`, limit: 30, window: 15 * 60 },
    )
  } else if (path === '/sign-in/magic-link') {
    const email = typeof body.email === 'string' ? body.email.toLowerCase() : ''
    rules.push(
      { key: `magic:email:${email}`, limit: 3, window: 15 * 60 },
      { key: `magic:ip:${ip}`, limit: 10, window: 60 * 60 },
    )
  } else if (path === '/sign-up/email') {
    rules.push({ key: `signup:ip:${ip}`, limit: 5, window: 60 * 60 })
  } else if (path === '/request-password-reset') {
    rules.push({ key: `reset:ip:${ip}`, limit: 5, window: 60 * 60 })
  }

  const result = normalizedPhone
    ? { context: { body: { ...body, phoneNumber: normalizedPhone } } }
    : undefined
  if (rules.length === 0) return result
  const payload = await payloadInstance()
  for (const rule of rules) {
    const res = await consumeRateLimit(payload, rule.key, rule.limit, rule.window)
    if (!res.allowed) {
      const minutes = Math.max(1, Math.ceil((res.resetAt.getTime() - Date.now()) / 60000))
      throw new APIError('TOO_MANY_REQUESTS', {
        message: `অনেকবার চেষ্টা করা হয়েছে। ${minutes} মিনিট পর আবার চেষ্টা করুন।`,
        code: 'RATE_LIMITED',
      })
    }
  }
  return result
})

/** Better Auth admin-plugin permissions: only shura and super admins manage users. */
const adminPluginRoles = Object.fromEntries(
  ROLES.map((role) => [role, role === 'super_admin' || role === 'shura' ? adminAc : userAc]),
) as Record<(typeof ROLES)[number], typeof adminAc | typeof userAc>

const GUARDED_PATHS = new Set([
  '/phone-number/send-otp',
  '/phone-number/verify',
  '/sign-in/email',
  '/sign-in/magic-link',
  '/sign-up/email',
  '/request-password-reset',
])

/**
 * Registered as a plugin (not options.hooks) so Better Auth runs it through its
 * hook pipeline; payload-auth wraps options.hooks and would short-circuit responses.
 */
/** Site settings > Registration and login: must a password sign-in come from a verified address? */
export async function emailVerificationRequired(): Promise<boolean> {
  try {
    const payload = await payloadInstance()
    const settings = (await payload.findGlobal({
      slug: 'site-settings',
      depth: 0,
      overrideAccess: true,
    })) as {
      auth?: { requireEmailVerification?: boolean | null } | null
    }
    return settings.auth?.requireEmailVerification ?? true
  } catch {
    return true // when in doubt, the safer behaviour
  }
}

/**
 * Runs after the password was checked (so it never reveals whether an address has an account):
 * an unverified address is refused while verification is switched on, and the new session is dropped.
 */
const enforceVerification = createAuthMiddleware(async (ctx) => {
  const created = ctx.context.newSession
  if (!created || created.user.emailVerified) return
  if (!(await emailVerificationRequired())) return
  await ctx.context.internalAdapter.deleteSession(created.session.token)
  throw new APIError('FORBIDDEN', {
    message: 'ইমেইল ঠিকানাটি এখনো যাচাই করা হয়নি। ইনবক্সে পাঠানো লিংকে ক্লিক করুন।',
    code: 'EMAIL_NOT_VERIFIED',
  })
})

const ruhamaGuards = {
  id: 'ruhama-guards',
  hooks: {
    before: [
      {
        matcher: (ctx: { path?: string }) => isOAuthPath(ctx.path),
        handler: warmIntegrations,
      },
      {
        matcher: (ctx: { path?: string }) => GUARDED_PATHS.has(ctx.path ?? ''),
        handler: limitIdentifiers,
      },
    ],
    after: [
      {
        matcher: (ctx: { path?: string }) => ctx.path === '/sign-in/email',
        handler: enforceVerification,
      },
    ],
  },
} satisfies BetterAuthPlugin

export const betterAuthOptions = {
  appName: 'Ruhama',
  baseURL: siteUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  // extra origins (preview deployments, a local production run on another port), comma separated
  trustedOrigins: [
    siteUrl,
    `${appScheme}://`,
    ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    ...(process.env.NODE_ENV === 'production' ? [] : ['exp://']),
  ],
  emailAndPassword: {
    enabled: true,
    // enforced by `enforceVerification` below instead, so admins can switch it in Site settings
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: false,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    async sendResetPassword({ user, url }) {
      const { html, text } = emailTemplates.resetPassword(user.name, url)
      await sendEmail({ to: user.email, subject: 'পাসওয়ার্ড রিসেট · Ruhama', html, text })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    async sendVerificationEmail({ user, url }, request) {
      if (user.email.endsWith('.phone.ruhama.local')) return
      // with verification switched off, sign-up sends nothing (a member asking to verify later still can)
      if (
        request &&
        new URL(request.url).pathname.endsWith('/sign-up/email') &&
        !(await emailVerificationRequired())
      )
        return
      const { html, text } = emailTemplates.verifyEmail(user.name, url)
      await sendEmail({ to: user.email, subject: 'ইমেইল যাচাই করুন · Ruhama', html, text })
    },
  },
  socialProviders: { google, facebook },
  account: {
    // one person, one account: providers with a verified matching email link to the same user
    accountLinking: {
      enabled: true,
      trustedProviders: ['google', 'facebook', 'email-password'],
      allowDifferentEmails: false,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    // no cookie cache: a revoked session ("log out of all devices", a stolen phone) must stop working at
    // once, not after the cache expires. Public pages are static, so the per-request lookup stays cheap.
    cookieCache: { enabled: false },
  },
  user: {
    // changing the address is confirmed from the current inbox first
    changeEmail: {
      enabled: true,
      async sendChangeEmailConfirmation({ user, newEmail, url }) {
        const { html, text } = emailTemplates.changeEmail(user.name, newEmail, url)
        await sendEmail({
          to: user.email,
          subject: 'ইমেইল পরিবর্তন নিশ্চিত করুন · Ruhama',
          html,
          text,
        })
      },
    },
    additionalFields: {
      username: { type: 'string', required: false, input: false },
      journeyStage: { type: 'string', required: false, input: false, defaultValue: 'kalema' },
      avatarColor: { type: 'string', required: false, input: false, defaultValue: 'gold' },
      deletionRequestedAt: { type: 'date', required: false, input: false, returned: false },
    },
  },
  rateLimit: {
    enabled: true,
    storage: 'database',
    window: 60,
    max: 120,
    customRules: {
      '/sign-in/email': { window: 60, max: 10 },
      '/sign-up/email': { window: 60, max: 5 },
      '/phone-number/send-otp': { window: 60, max: 3 },
      '/phone-number/verify': { window: 60, max: 10 },
      '/sign-in/magic-link': { window: 60, max: 5 },
      '/request-password-reset': { window: 60, max: 5 },
    },
  },
  advanced: {
    cookiePrefix: 'ruhama',
    useSecureCookies: siteUrl.startsWith('https://'),
    ipAddress: { ipAddressHeaders: trustedIpHeaders() },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: {
            ...user,
            username: makeUsername(user.email, user.name),
          },
        }),
      },
    },
    session: {
      create: {
        after: async (session, ctx) => {
          // logging in within the 30-day grace period cancels a deletion request
          const adapter = ctx?.context?.internalAdapter
          if (!adapter) return
          const user = await adapter.findUserById(session.userId)
          if (user && (user as { deletionRequestedAt?: unknown }).deletionRequestedAt) {
            await adapter.updateUser(session.userId, { deletionRequestedAt: null })
          }
        },
      },
    },
  },
  plugins: [
    admin({
      roles: adminPluginRoles,
      defaultRole: 'member',
      adminRoles: ['super_admin', 'shura'],
    }),
    magicLink({
      expiresIn: 15 * 60,
      async sendMagicLink({ email, url }) {
        const { html, text } = emailTemplates.magicLink(url)
        await sendEmail({ to: email, subject: 'আপনার লগইন লিংক · Ruhama', html, text })
      },
    }),
    phoneNumber({
      otpLength: 6,
      expiresIn: 5 * 60,
      allowedAttempts: 5,
      phoneNumberValidator: (phone) => normalizeBdPhone(phone) === phone,
      async sendOTP({ phoneNumber: phone, code }) {
        const res = await sendSms(
          phone,
          `Ruhama লগইন কোড: ${code}। ৫ মিনিট কার্যকর। কাউকে জানাবেন না।`,
        )
        if (!res.ok)
          throw new APIError('INTERNAL_SERVER_ERROR', {
            message: 'এসএমএস পাঠানো যায়নি। কিছুক্ষণ পর চেষ্টা করুন।',
          })
      },
      signUpOnVerification: {
        getTempEmail: (phone) => phonePlaceholderEmail(phone),
        getTempName: (phone) => phone.replace(/^\+88/, ''),
      },
    }),
    ...(captchaSecret
      ? [
          captcha({
            provider: 'cloudflare-turnstile',
            secretKey: captchaSecret,
            endpoints: ['/sign-up/email', '/phone-number/send-otp'],
          }),
        ]
      : []),
    ruhamaGuards,
    bearer(),
    expo(),
    nextCookies(),
  ],
} satisfies BetterAuthOptions

export const STAFF_ADMIN_ROLES = ['super_admin', 'shura'] as const

export const payloadAuthOptions = {
  hidePluginCollections: true,
  collectionAdminGroup: 'অ্যাকাউন্ট',
  users: {
    slug: 'users',
    roles: [...ROLES],
    adminRoles: [...STAFF_ADMIN_ROLES],
    defaultRole: 'member',
    defaultAdminRole: 'super_admin',
    allowedFields: ['name'],
  },
  sessions: { hidden: true },
  verifications: { hidden: true },
  accounts: { hidden: true },
  adminInvitations: {
    // the plugin's invite flow relies on its own sign-up pages, which this site does not use: staff
    // register normally and an admin assigns the role under Users
    hidden: true,
    // payload-auth creates the first-admin invitation without an expiry; default it to 7 days
    collectionOverrides: ({ collection }) => ({
      ...collection,
      hooks: {
        ...collection.hooks,
        beforeValidate: [
          ...(collection.hooks?.beforeValidate ?? []),
          ({ data }) => {
            if (data && !data.expiresAt)
              data.expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
            return data
          },
        ],
      },
    }),
    async sendInviteEmail({ email, url }) {
      const { html, text } = emailTemplates.notification(
        'Ruhama অ্যাডমিন প্যানেলে আমন্ত্রণ',
        'আপনাকে Ruhama-র স্টাফ প্যানেলে আমন্ত্রণ জানানো হয়েছে। নিচের লিংক থেকে অ্যাকাউন্ট খুলুন।',
        url,
      )
      const res = await sendEmail({ to: email, subject: 'আমন্ত্রণ · Ruhama', html, text })
      return res.ok ? { success: true } : { success: false, message: res.error }
    },
  },
  admin: {
    loginMethods: [
      'emailPassword',
      'magicLink',
      // the staff login page is built once at startup, so its social buttons follow .env only
      ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? (['google'] as const)
        : []),
      ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
        ? (['facebook'] as const)
        : []),
    ],
  },
  betterAuthOptions,
} satisfies PayloadAuthOptions

export type PayloadAuthConfig = typeof payloadAuthOptions
