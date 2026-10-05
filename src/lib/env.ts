import { z } from 'zod'

/**
 * Server environment, validated once on first access.
 * Optional groups (OAuth, SMS, R2, Resend, Supabase) switch features on only when complete.
 */
const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined))

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_URL_DIRECT: optional,
  PAYLOAD_SECRET: z.string().min(16, 'PAYLOAD_SECRET must be at least 16 characters'),
  BETTER_AUTH_SECRET: z.string().min(16, 'BETTER_AUTH_SECRET must be at least 16 characters'),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  BETTER_AUTH_TRUSTED_ORIGINS: optional,
  TRUSTED_IP_HEADER: optional,

  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,
  FACEBOOK_CLIENT_ID: optional,
  FACEBOOK_CLIENT_SECRET: optional,

  SMS_PROVIDER: z.enum(['console', 'bd_gateway']).default('console'),
  SMS_API_URL: optional,
  SMS_API_KEY: optional,
  SMS_SENDER_ID: optional,

  RESEND_API_KEY: optional,
  EMAIL_FROM: z.string().default('Ruhama <noreply@ruhama.org>'),
  EMAIL_REPLY_TO: optional,

  TURNSTILE_SECRET_KEY: optional,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: optional,

  R2_ENDPOINT: optional,
  R2_BUCKET: optional,
  R2_ACCESS_KEY_ID: optional,
  R2_SECRET_ACCESS_KEY: optional,
  NEXT_PUBLIC_MEDIA_URL: optional,

  NEXT_PUBLIC_SUPABASE_URL: optional,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optional,
  SUPABASE_SERVICE_ROLE_KEY: optional,

  CRON_SECRET: optional,
  MOBILE_APP_SCHEME: z.string().default('ruhama'),
})

export type ServerEnv = z.infer<typeof serverSchema>

let cached: ServerEnv | null = null

export function env(): ServerEnv {
  if (cached) return cached
  const parsed = serverSchema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')
    throw new Error(`Invalid environment variables:\n${issues}`)
  }
  cached = parsed.data
  return cached
}

export const features = {
  google: () => Boolean(env().GOOGLE_CLIENT_ID && env().GOOGLE_CLIENT_SECRET),
  facebook: () => Boolean(env().FACEBOOK_CLIENT_ID && env().FACEBOOK_CLIENT_SECRET),
  r2: () =>
    Boolean(
      env().R2_ENDPOINT && env().R2_BUCKET && env().R2_ACCESS_KEY_ID && env().R2_SECRET_ACCESS_KEY,
    ),
  resend: () => Boolean(env().RESEND_API_KEY),
  realtime: () =>
    Boolean(
      env().NEXT_PUBLIC_SUPABASE_URL &&
      env().NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      env().SUPABASE_SERVICE_ROLE_KEY,
    ),
  smsGateway: () =>
    env().SMS_PROVIDER === 'bd_gateway' &&
    Boolean(env().SMS_API_URL && env().SMS_API_KEY && env().SMS_SENDER_ID),
}
