import { normalizeBdPhone } from '@/lib/phone'
import { SECRET_CLEAR, type IntegrationTarget } from '@/payload/globals/integrations-shared'

import { sendEmail } from './email'
import { loadIntegrations, type IntegrationSettings } from './integrations'
import { smsProviderFor } from './sms'

/**
 * "Test connection" buttons on admin > Integrations. Values typed in the form are tested before they are
 * saved; empty fields fall back to the saved settings. Nothing here is stored, and secrets never come back
 * in the response.
 */

export type TestResult = { ok: boolean; message: string }

type Body = { target?: unknown; values?: unknown; to?: unknown }

const TARGETS = new Set<IntegrationTarget>(['google', 'facebook', 'sms', 'email', 'youtube'])
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/** Typed values over saved ones; a typed SECRET_CLEAR means "test as if empty". */
function merge<T extends Record<string, unknown>>(saved: T, typed: Record<string, unknown>): T {
  const out = { ...saved } as Record<string, unknown>
  for (const [key, current] of Object.entries(saved)) {
    if (typeof current !== 'string') continue
    const value = str(typed[key])
    if (value === SECRET_CLEAR) out[key] = ''
    else if (value) out[key] = value
  }
  return out as T
}

async function testGoogle(
  { clientId, clientSecret }: IntegrationSettings['google'],
  redirectPath = '/api/auth/callback/google',
): Promise<TestResult> {
  if (!clientId || !clientSecret)
    return { ok: false, message: 'Client ID ও Client secret দুটোই লাগবে।' }
  // a made-up authorization code: Google checks the client first, so "invalid_grant" means the pair is right
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: 'ruhama-connection-test',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${siteUrl()}${redirectPath}`,
      grant_type: 'authorization_code',
    }),
    signal: AbortSignal.timeout(10_000),
  })
  const json = (await res.json().catch(() => ({}))) as { error?: string }
  if (json.error === 'invalid_grant')
    return { ok: true, message: 'Google এই Client ID ও secret গ্রহণ করেছে।' }
  if (json.error === 'invalid_client' || json.error === 'unauthorized_client') {
    return { ok: false, message: 'Google বলছে Client ID বা Client secret ভুল।' }
  }
  return { ok: false, message: `Google থেকে অপ্রত্যাশিত উত্তর: ${json.error ?? res.status}` }
}

async function testFacebook({
  clientId,
  clientSecret,
}: IntegrationSettings['facebook']): Promise<TestResult> {
  if (!clientId || !clientSecret) return { ok: false, message: 'App ID ও App secret দুটোই লাগবে।' }
  const url = new URL('https://graph.facebook.com/oauth/access_token')
  url.search = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  }).toString()
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string
    error?: { message?: string }
  }
  if (res.ok && json.access_token)
    return { ok: true, message: 'Facebook এই App ID ও secret গ্রহণ করেছে।' }
  return { ok: false, message: `Facebook বলছে: ${json.error?.message ?? `HTTP ${res.status}`}` }
}

async function testSms(settings: IntegrationSettings['sms'], to: string): Promise<TestResult> {
  if (settings.provider !== 'bd_gateway') {
    return {
      ok: true,
      message: 'টেস্ট মোড চালু: SMS আসলে পাঠানো হয় না, কোড সার্ভার লগে দেখা যায়।',
    }
  }
  if (!settings.apiUrl || !settings.apiKey || !settings.senderId) {
    return { ok: false, message: 'API URL, API key ও Sender ID সবগুলো লাগবে।' }
  }
  const phone = normalizeBdPhone(to)
  if (!phone)
    return { ok: false, message: 'টেস্ট SMS পাঠাতে একটি সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন।' }
  const result = await smsProviderFor(settings).send(phone, 'Ruhama: SMS সংযোগ ঠিকঠাক কাজ করছে।')
  return result.ok
    ? { ok: true, message: `${phone} নম্বরে টেস্ট SMS পাঠানো হয়েছে।` }
    : { ok: false, message: `গেটওয়ে বলছে: ${result.error}` }
}

async function testEmail(settings: IntegrationSettings['email'], to: string): Promise<TestResult> {
  if (!settings.resendApiKey) return { ok: false, message: 'Resend API key দেওয়া নেই।' }
  if (!to) return { ok: false, message: 'আপনার অ্যাকাউন্টে ইমেইল ঠিকানা নেই।' }
  const result = await sendEmail(
    {
      to,
      subject: 'টেস্ট ইমেইল · Ruhama',
      text: 'Ruhama-র ইমেইল সংযোগ ঠিকঠাক কাজ করছে। এই ইমেইলের উত্তর দেওয়ার দরকার নেই।',
      html: '<p>Ruhama-র ইমেইল সংযোগ ঠিকঠাক কাজ করছে।</p><p>এই ইমেইলের উত্তর দেওয়ার দরকার নেই।</p>',
    },
    settings,
  )
  return result.ok
    ? { ok: true, message: `${to} ঠিকানায় টেস্ট ইমেইল পাঠানো হয়েছে। ইনবক্স দেখুন।` }
    : { ok: false, message: `Resend বলছে: ${result.error}` }
}

const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

export async function testIntegration(body: Body, admin: { email: string }): Promise<TestResult> {
  const target = str(body.target) as IntegrationTarget
  if (!TARGETS.has(target)) return { ok: false, message: 'অজানা সংযোগ।' }
  const typed =
    body.values && typeof body.values === 'object' ? (body.values as Record<string, unknown>) : {}
  const saved = await loadIntegrations(true)
  try {
    switch (target) {
      case 'google':
        return await testGoogle(merge(saved.google, typed))
      case 'facebook':
        return await testFacebook(merge(saved.facebook, typed))
      case 'sms': {
        const provider = str(typed.provider)
        const sms = merge(saved.sms, typed)
        if (provider === 'console' || provider === 'bd_gateway') sms.provider = provider
        return await testSms(sms, str(body.to))
      }
      case 'email':
        return await testEmail(merge(saved.email, typed), admin.email)
      case 'youtube':
        return await testGoogle(
          merge(saved.youtube, typed),
          '/api/v1/integrations/youtube/callback',
        )
    }
  } catch (err) {
    const reason =
      err instanceof Error && err.name === 'TimeoutError'
        ? 'সময়মতো উত্তর আসেনি'
        : 'সংযোগ করা যায়নি'
    return { ok: false, message: `${reason}। একটু পরে আবার চেষ্টা করুন।` }
  }
}
