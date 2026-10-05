'use client'

import { CircleCheck, Eye, EyeOff, KeyRound, Mail, Smartphone } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox, Field, FormAlert, Input } from '@/components/ui/form'
import { Turnstile, type TurnstileHandle } from '@/components/ui/turnstile'
import { authClient } from '@/lib/auth/client'
import { authErrorMessage } from '@/lib/auth/errors'
import { bn } from '@/lib/format'
import { normalizeBdPhone } from '@/lib/phone'

import { OtpInput } from './otp-input'
import { SocialButtons } from './social-buttons'

type Mode = 'password' | 'link' | 'phone'

/** The admin panel lives in a separate root layout, so it needs a full page load. */
function go(router: ReturnType<typeof useRouter>, next: string) {
  if (next.startsWith('/admin')) {
    window.location.assign(next)
    return
  }
  router.replace(next)
  router.refresh()
}

function SuccessNote({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" className="adab-strip" style={{ background: 'var(--rh-success-soft)' }}>
      <CircleCheck
        className="ic"
        aria-hidden="true"
        style={{ color: 'var(--rh-success)', marginTop: 3 }}
      />
      <p className="t-small">{children}</p>
    </div>
  )
}

function PasswordLogin({ next }: { next: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unverified, setUnverified] = useState(false)
  const [resent, setResent] = useState(false)
  const [pending, start] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
        rememberMe: remember,
      })
      if (error) {
        setUnverified(error.code === 'EMAIL_NOT_VERIFIED')
        setError(authErrorMessage(error))
        return
      }
      go(router, next)
    })
  }

  function resend() {
    start(async () => {
      const { error } = await authClient.sendVerificationEmail({
        email: email.trim(),
        callbackURL: '/verify-email',
      })
      if (error) setError(authErrorMessage(error))
      else setResent(true)
    })
  }

  return (
    <form
      onSubmit={submit}
      style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 28 }}
      noValidate
    >
      {error ? <FormAlert>{error}</FormAlert> : null}
      {unverified ? (
        resent ? (
          <SuccessNote>নতুন যাচাই লিংক পাঠানো হয়েছে। ইনবক্স দেখুন।</SuccessNote>
        ) : (
          <Button type="button" variant="secondary" size="sm" onClick={resend} pending={pending}>
            যাচাই লিংক আবার পাঠান
          </Button>
        )
      ) : null}
      <Field label="ইমেইল" htmlFor="l-email">
        <Input
          id="l-email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <div className="field">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <label className="label" htmlFor="l-pass">
            পাসওয়ার্ড
          </label>
          <Link href="/forgot-password" className="t-small link">
            ভুলে গেছেন?
          </Link>
        </div>
        <div style={{ position: 'relative' }}>
          <Input
            id="l-pass"
            type={show ? 'text' : 'password'}
            required
            autoComplete="current-password"
            style={{ paddingRight: 52 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="btn-icon"
            aria-label={show ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
            onClick={() => setShow(!show)}
            style={{ position: 'absolute', right: 3, top: 3 }}
          >
            {show ? (
              <EyeOff className="ic" aria-hidden="true" />
            ) : (
              <Eye className="ic" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      <Checkbox
        label="এই ডিভাইসে লগইন থাকুক"
        checked={remember}
        onChange={(e) => setRemember(e.target.checked)}
      />
      <Button type="submit" size="lg" block pending={pending} disabled={!email || !password}>
        লগইন
      </Button>
    </form>
  )
}

function MagicLinkLogin({ next }: { next: string }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const { error } = await authClient.signIn.magicLink({
        email: email.trim(),
        callbackURL: next,
        errorCallbackURL: '/login?error=link',
      })
      if (error) setError(authErrorMessage(error))
      else setSent(true)
    })
  }

  return (
    <form
      onSubmit={submit}
      style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 28 }}
      noValidate
    >
      {error ? <FormAlert>{error}</FormAlert> : null}
      {sent ? (
        <SuccessNote>
          <strong>ইনবক্স দেখুন।</strong> {email} ঠিকানায় লগইন লিংক পাঠানো হয়েছে। লিংকটি ১৫ মিনিট
          কার্যকর থাকবে।
        </SuccessNote>
      ) : (
        <>
          <Field
            label="ইমেইল"
            htmlFor="l-email2"
            hint="পাসওয়ার্ড ছাড়াই, এক ক্লিকে লগইনের লিংক পাঠানো হবে।"
          >
            <Input
              id="l-email2"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Button type="submit" size="lg" block pending={pending} disabled={!email}>
            লগইন লিংক পাঠান
          </Button>
        </>
      )}
    </form>
  )
}

function PhoneLogin({ next }: { next: string }) {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [normalized, setNormalized] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const turnstile = useRef<TurnstileHandle>(null)
  const [pending, start] = useTransition()

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  function send(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null)
    const e164 = normalizeBdPhone(phone)
    if (!e164) {
      setError('সঠিক বাংলাদেশি মোবাইল নম্বর দিন, যেমন: ০১৭১২৩৪৫৬৭৮')
      return
    }
    if (!token) {
      setError('নিচের নিরাপত্তা যাচাইটি সম্পন্ন করুন।')
      return
    }
    start(async () => {
      const { error } = await authClient.phoneNumber.sendOtp(
        { phoneNumber: e164 },
        { headers: { 'x-captcha-response': token } },
      )
      turnstile.current?.reset()
      setToken(null)
      if (error) {
        setError(authErrorMessage(error))
        return
      }
      setNormalized(e164)
      setCode('')
      setCooldown(60)
    })
  }

  function verify(e: React.FormEvent) {
    e.preventDefault()
    if (!normalized || code.length !== 6) return
    setError(null)
    start(async () => {
      const { error } = await authClient.phoneNumber.verify({ phoneNumber: normalized, code })
      if (error) {
        setError(authErrorMessage(error))
        return
      }
      go(router, next)
    })
  }

  if (normalized) {
    return (
      <form
        onSubmit={verify}
        style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 28 }}
        noValidate
      >
        {error ? <FormAlert>{error}</FormAlert> : null}
        <p className="t-small t-muted" style={{ textAlign: 'center' }}>
          {bn(normalized.replace(/^\+88/, ''))} নম্বরে ৬ অঙ্কের কোড পাঠানো হয়েছে। কোডটি ৫ মিনিট
          কার্যকর।
        </p>
        <OtpInput value={code} onChange={setCode} invalid={Boolean(error)} autoFocus />
        <Button type="submit" size="lg" block pending={pending} disabled={code.length !== 6}>
          যাচাই করে লগইন করুন
        </Button>
        <div
          style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
        >
          <button
            type="button"
            className="t-small link"
            style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0 }}
            onClick={() => setNormalized(null)}
          >
            নম্বর বদলান
          </button>
          {cooldown > 0 ? (
            <span className="t-small t-muted">{bn(cooldown)} সেকেন্ড পর আবার কোড চাইতে পারবেন</span>
          ) : (
            <button
              type="button"
              className="t-small link"
              style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0 }}
              onClick={() => setNormalized(null)}
            >
              নতুন কোড চান
            </button>
          )}
        </div>
      </form>
    )
  }

  return (
    <form
      onSubmit={send}
      style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 28 }}
      noValidate
    >
      {error ? <FormAlert>{error}</FormAlert> : null}
      <Field
        label="মোবাইল নম্বর"
        htmlFor="l-phone"
        hint="নম্বরটি নতুন হলে যাচাইয়ের পর অ্যাকাউন্ট খুলে যাবে।"
      >
        <Input
          id="l-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="০১XXXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </Field>
      <Turnstile ref={turnstile} onToken={setToken} action="otp" />
      <Button type="submit" size="lg" block pending={pending} disabled={!phone}>
        কোড পাঠান
      </Button>
    </form>
  )
}

const OTHER_MODES: Record<Mode, { mode: Mode; label: string; icon: React.ReactNode }[]> = {
  password: [
    {
      mode: 'link',
      label: 'ইমেইলে লগইন লিংক নিন',
      icon: <Mail className="ic" aria-hidden="true" />,
    },
    {
      mode: 'phone',
      label: 'মোবাইল নম্বরে কোড নিন',
      icon: <Smartphone className="ic" aria-hidden="true" />,
    },
  ],
  link: [
    {
      mode: 'password',
      label: 'পাসওয়ার্ড দিয়ে লগইন',
      icon: <KeyRound className="ic" aria-hidden="true" />,
    },
    {
      mode: 'phone',
      label: 'মোবাইল নম্বরে কোড নিন',
      icon: <Smartphone className="ic" aria-hidden="true" />,
    },
  ],
  phone: [
    {
      mode: 'password',
      label: 'পাসওয়ার্ড দিয়ে লগইন',
      icon: <KeyRound className="ic" aria-hidden="true" />,
    },
    {
      mode: 'link',
      label: 'ইমেইলে লগইন লিংক নিন',
      icon: <Mail className="ic" aria-hidden="true" />,
    },
  ],
}

/** All sign-in methods on one card: password, magic link, phone OTP and social providers. */
export function LoginForm({
  next,
  initialMode,
  google,
  facebook,
  notice,
}: {
  next: string
  initialMode: Mode
  google: boolean
  facebook: boolean
  notice: string | null
}) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(initialMode)
  const { data: session } = authClient.useSession()

  // already signed in (for example in another tab): continue to the destination
  useEffect(() => {
    if (session?.user) go(router, next)
  }, [session?.user, router, next])

  return (
    <>
      {notice ? (
        <div style={{ marginTop: 20 }}>
          <FormAlert>{notice}</FormAlert>
        </div>
      ) : null}
      {mode === 'password' ? (
        <PasswordLogin next={next} />
      ) : mode === 'link' ? (
        <MagicLinkLogin next={next} />
      ) : (
        <PhoneLogin next={next} />
      )}
      <div className="auth-sep" style={{ margin: '22px 0' }}>
        অথবা
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SocialButtons google={google} facebook={facebook} next={next} />
        {OTHER_MODES[mode].map((m) => (
          <button
            key={m.mode}
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => setMode(m.mode)}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>
    </>
  )
}
