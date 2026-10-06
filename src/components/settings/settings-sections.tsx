'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { IconKey, IconLaptop, IconMail, IconMobile } from '@/components/icons'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import {
  requestAccountDeletionAction,
  updateNotificationPrefsAction,
  updateProfileAction,
} from '@/actions/settings'
import { OtpInput } from '@/components/auth/otp-input'
import { FacebookLogo, GoogleLogo } from '@/components/icons/social'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCard,
  Field,
  FormAlert,
  Input,
  PasswordInput,
  Select,
  Switch,
  Textarea,
} from '@/components/ui/form'
import { Modal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/primitives'
import { Turnstile, type TurnstileHandle } from '@/components/ui/turnstile'

import { GenderNote, PhotoField } from './profile-settings'
import { authClient } from '@/lib/auth/client'
import { authErrorMessage } from '@/lib/auth/errors'
import { DIVISIONS } from '@/lib/districts'
import { bn, formatRelative } from '@/lib/format'
import { JOURNEY_STAGES } from '@/lib/journey'
import { INTEREST_OPTIONS } from '@/lib/options'
import { isPlaceholderEmail, normalizeBdPhone } from '@/lib/phone'

export type SettingsUser = {
  name: string
  email: string
  emailVerified: boolean
  phoneNumber: string | null
  phoneNumberVerified: boolean
  district: string | null
  bio: string | null
  avatarColor: 'teal' | 'gold' | 'sage' | 'deep'
  interests: string[]
  journeyStage: string
  gender: 'male' | 'female' | null
  photo: string | null
  notificationPrefs: Record<
    'answer' | 'event' | 'forum' | 'weekly' | 'course',
    { email: boolean; site: boolean }
  >
}

const SWATCHES = [
  { value: 'teal', label: 'টিল', bg: 'var(--rh-primary-soft)', ink: 'var(--rh-primary)' },
  { value: 'gold', label: 'গোল্ড', bg: 'var(--rh-accent-soft)', ink: 'var(--rh-accent-ink)' },
  { value: 'sage', label: 'সেজ', bg: 'var(--rh-sage)', ink: 'var(--rh-ink)' },
  { value: 'deep', label: 'গাঢ় টিল', bg: 'var(--rh-primary)', ink: 'var(--rh-on-primary)' },
] as const

function Card({
  id,
  title,
  children,
  action,
}: {
  id: string
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section id={id} className="card card-pad settings-section" aria-labelledby={`s-${id}`}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <h2 id={`s-${id}`} className="t-h3">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/* ---------------- personal info ---------------- */

export function ProfileSection({ user }: { user: SettingsUser }) {
  const router = useRouter()
  const [name, setName] = useState(user.name)
  const [district, setDistrict] = useState(user.district ?? '')
  const [bio, setBio] = useState(user.bio ?? '')
  const [color, setColor] = useState(user.avatarColor)
  const [interests, setInterests] = useState<string[]>(user.interests)
  const [stage, setStage] = useState(user.journeyStage)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const sw = SWATCHES.find((s) => s.value === color) ?? SWATCHES[1]

  function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const res = await updateProfileAction({
        name,
        district: district as never,
        bio,
        avatarColor: color,
        interests: interests as never,
        journeyStage: stage as never,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      toast.success('পরিবর্তন সংরক্ষিত হয়েছে')
      router.refresh()
    })
  }

  function reset() {
    setName(user.name)
    setDistrict(user.district ?? '')
    setBio(user.bio ?? '')
    setColor(user.avatarColor)
    setInterests(user.interests)
    setStage(user.journeyStage)
  }

  return (
    <Card id="profile" title="ব্যক্তিগত তথ্য">
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 20,
          margin: '20px 0 24px',
          paddingBottom: 24,
          borderBottom: '1px solid var(--rh-border)',
        }}
      >
        <div style={{ flex: '1 1 100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <GenderNote gender={user.gender} />
          <PhotoField name={name} gender={user.gender} photo={user.photo} swatch={sw} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <strong id="avatar-color">অ্যাভাটারের রং</strong>
          <div role="radiogroup" aria-labelledby="avatar-color" style={{ display: 'flex', gap: 8 }}>
            {SWATCHES.map((s) => (
              <button
                key={s.value}
                type="button"
                role="radio"
                aria-checked={color === s.value}
                aria-label={s.label}
                onClick={() => setColor(s.value)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: `2px solid ${color === s.value ? 'var(--rh-accent)' : 'var(--rh-border)'}`,
                  background: s.bg,
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
          <span className="t-caption t-muted">ছবি না থাকলে নামের আদ্যক্ষর এই রঙে দেখাবে।</span>
        </div>
      </div>
      <form
        onSubmit={save}
        onReset={reset}
        style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
        noValidate
      >
        {error ? <FormAlert>{error}</FormAlert> : null}
        <div className="form-grid">
          <Field label="পূর্ণ নাম" htmlFor="p-name">
            <Input
              id="p-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </Field>
          <Field label="জেলা" htmlFor="p-district">
            <Select id="p-district" value={district} onChange={(e) => setDistrict(e.target.value)}>
              <option value="">নির্বাচন করুন</option>
              {DIVISIONS.map((d) => (
                <optgroup key={d.value} label={d.label}>
                  {d.districts.map((x) => (
                    <option key={x.value} value={x.value}>
                      {x.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
        </div>
        <Field
          label="সংক্ষিপ্ত পরিচিতি"
          htmlFor="p-bio"
          hint={`সর্বোচ্চ ১৬০ অক্ষর (${bn(bio.length)}/১৬০)। পাবলিক প্রোফাইলে দেখাবে।`}
        >
          <Textarea
            id="p-bio"
            style={{ minHeight: 96 }}
            maxLength={160}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </Field>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label" style={{ marginBottom: 8 }}>
            কোন কাজে আগ্রহী?
          </legend>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))',
              gap: 8,
            }}
          >
            {INTEREST_OPTIONS.map((o) => (
              <CheckCard
                key={o.value}
                type="checkbox"
                label={o.label}
                checked={interests.includes(o.value)}
                onChange={(e) =>
                  setInterests((prev) =>
                    e.target.checked ? [...prev, o.value] : prev.filter((v) => v !== o.value),
                  )
                }
              />
            ))}
          </div>
        </fieldset>
        <Field
          label="আমার যাত্রার ধাপ"
          htmlFor="p-stage"
          hint="নিজের মূল্যায়ন অনুযায়ী বেছে নিন; ড্যাশবোর্ডের প্রস্তাবনা এই ধাপ অনুযায়ী আসবে।"
        >
          <Select id="p-stage" value={stage} onChange={(e) => setStage(e.target.value)}>
            {JOURNEY_STAGES.map((s, i) => (
              <option key={s.value} value={s.value}>
                {bn(i + 1)}. {s.label}
              </option>
            ))}
          </Select>
        </Field>
        <div
          id="journey"
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
            scrollMarginTop: 96,
          }}
        >
          <Button type="reset" variant="ghost">
            বাতিল
          </Button>
          <Button type="submit" pending={pending}>
            পরিবর্তন সংরক্ষণ
          </Button>
        </div>
      </form>
    </Card>
  )
}

/* ---------------- login methods ---------------- */

type Account = { providerId: string; accountId: string }

function PhoneLinkModal({
  open,
  onOpenChange,
  onLinked,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onLinked: () => void
}) {
  const [phone, setPhone] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const turnstile = useRef<TurnstileHandle>(null)
  const [pending, start] = useTransition()

  function send(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const e164 = normalizeBdPhone(phone)
    if (!e164) return setError('সঠিক বাংলাদেশি মোবাইল নম্বর দিন।')
    if (!token) return setError('নিরাপত্তা যাচাই সম্পন্ন করুন।')
    start(async () => {
      const { error } = await authClient.phoneNumber.sendOtp(
        { phoneNumber: e164 },
        { headers: { 'x-captcha-response': token } },
      )
      turnstile.current?.reset()
      setToken(null)
      if (error) setError(authErrorMessage(error))
      else setSentTo(e164)
    })
  }
  function verify(e: React.FormEvent) {
    e.preventDefault()
    if (!sentTo) return
    setError(null)
    start(async () => {
      const { error } = await authClient.phoneNumber.verify({
        phoneNumber: sentTo,
        code,
        updatePhoneNumber: true,
      })
      if (error) return setError(authErrorMessage(error))
      toast.success('মোবাইল নম্বর সংযুক্ত হয়েছে')
      onLinked()
      onOpenChange(false)
    })
  }
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="মোবাইল নম্বর সংযুক্ত করুন"
      description="যাচাইয়ের পর এই নম্বরে কোড নিয়েও লগইন করতে পারবেন।"
      width={440}
      onSubmit={sentTo ? verify : send}
    >
      {error ? <FormAlert>{error}</FormAlert> : null}
      {sentTo ? (
        <>
          <p className="t-small t-muted">
            {bn(sentTo.replace(/^\+88/, ''))} নম্বরে পাঠানো ৬ অঙ্কের কোড লিখুন।
          </p>
          <OtpInput value={code} onChange={setCode} autoFocus />
          <Button type="submit" block pending={pending} disabled={code.length !== 6}>
            যাচাই করুন
          </Button>
        </>
      ) : (
        <>
          <Field label="মোবাইল নম্বর" htmlFor="link-phone">
            <Input
              id="link-phone"
              type="tel"
              inputMode="tel"
              placeholder="০১XXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <Turnstile ref={turnstile} onToken={setToken} action="otp" />
          <Button type="submit" block pending={pending} disabled={!phone}>
            কোড পাঠান
          </Button>
        </>
      )}
    </Modal>
  )
}

function PasswordModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [revoke, setRevoke] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (next.length < 8) return setError('নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।')
    start(async () => {
      const { error } = await authClient.changePassword({
        currentPassword: current,
        newPassword: next,
        revokeOtherSessions: revoke,
      })
      if (error) return setError(authErrorMessage(error))
      toast.success('পাসওয়ার্ড বদলানো হয়েছে')
      onOpenChange(false)
    })
  }
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="পাসওয়ার্ড বদলান"
      width={440}
      onSubmit={submit}
    >
      {error ? <FormAlert>{error}</FormAlert> : null}
      <Field label="বর্তমান পাসওয়ার্ড" htmlFor="cp-current">
        <PasswordInput
          id="cp-current"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </Field>
      <Field label="নতুন পাসওয়ার্ড" htmlFor="cp-next" hint="কমপক্ষে ৮ অক্ষর।">
        <PasswordInput
          id="cp-next"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
      </Field>
      <label className="check">
        <input type="checkbox" checked={revoke} onChange={(e) => setRevoke(e.target.checked)} />
        <span className="t-small">অন্য সব ডিভাইস থেকে লগআউট করুন</span>
      </label>
      <Button type="submit" block pending={pending} disabled={!current || !next}>
        পাসওয়ার্ড বদলান
      </Button>
    </Modal>
  )
}

function EmailModal({
  open,
  onOpenChange,
  current,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  current: string
}) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const { error } = await authClient.changeEmail({
        newEmail: email.trim(),
        callbackURL: '/settings#logins',
      })
      if (error) setError(authErrorMessage(error))
      else setSent(true)
    })
  }
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="ইমেইল পরিবর্তন"
      width={440}
      onSubmit={submit}
    >
      {error ? <FormAlert>{error}</FormAlert> : null}
      {sent ? (
        <p className="t-small">
          নিশ্চিত করতে {isPlaceholderEmail(current) ? 'নতুন' : 'বর্তমান'} ইমেইলে একটি লিংক পাঠানো
          হয়েছে। লিংকে ক্লিক করলেই পরিবর্তন সম্পন্ন হবে।
        </p>
      ) : (
        <>
          <Field label="নতুন ইমেইল" htmlFor="ce-email">
            <Input
              id="ce-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Button type="submit" block pending={pending} disabled={!email}>
            নিশ্চিতকরণ লিংক পাঠান
          </Button>
        </>
      )}
    </Modal>
  )
}

export function LoginsSection({
  user,
  google,
  facebook,
}: {
  user: SettingsUser
  google: boolean
  facebook: boolean
}) {
  const router = useRouter()
  const qc = useQueryClient()
  const accounts = useQuery({
    queryKey: ['me', 'accounts'],
    queryFn: async () => {
      const { data, error } = await authClient.listAccounts()
      if (error) throw error
      return (data ?? []) as Account[]
    },
  })
  const [modal, setModal] = useState<'phone' | 'password' | 'email' | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const has = (p: string) => Boolean(accounts.data?.some((a) => a.providerId === p))
  const methodCount = (accounts.data?.length ?? 0) + (user.phoneNumberVerified ? 1 : 0)
  const realEmail = !isPlaceholderEmail(user.email)

  async function unlink(providerId: string, label: string) {
    if (methodCount <= 1) return toast.error('অন্তত একটি লগইন পদ্ধতি সংযুক্ত থাকতে হবে।')
    const account = accounts.data?.find((a) => a.providerId === providerId)
    if (!account) return
    setBusy(providerId)
    const { error } = await authClient.unlinkAccount({ accountId: account.accountId })
    setBusy(null)
    if (error) return toast.error('বিচ্ছিন্ন করা যায়নি', { description: authErrorMessage(error) })
    toast.success(`${label} বিচ্ছিন্ন করা হয়েছে`)
    void qc.invalidateQueries({ queryKey: ['me', 'accounts'] })
  }
  async function link(provider: 'google' | 'facebook') {
    setBusy(provider)
    const { error } = await authClient.linkSocial({ provider, callbackURL: '/settings#logins' })
    if (error) {
      setBusy(null)
      toast.error('সংযুক্ত করা যায়নি', { description: authErrorMessage(error) })
    }
  }
  async function setPassword() {
    if (!realEmail) return toast.error('আগে একটি ইমেইল যুক্ত করুন।')
    const { error } = await authClient.requestPasswordReset({
      email: user.email,
      redirectTo: '/reset-password',
    })
    if (error) toast.error('লিংক পাঠানো যায়নি', { description: authErrorMessage(error) })
    else toast.success('পাসওয়ার্ড সেট করার লিংক ইমেইলে পাঠানো হয়েছে')
  }

  const rows = [
    google
      ? {
          key: 'google',
          logo: <GoogleLogo className="ic" />,
          name: 'Google',
          detail: has('google') ? (realEmail ? user.email : 'সংযুক্ত') : 'সংযুক্ত নয়',
          on: has('google'),
          connect: () => link('google'),
          disconnect: () => unlink('google', 'Google'),
        }
      : null,
    facebook
      ? {
          key: 'facebook',
          logo: <FacebookLogo className="ic" />,
          name: 'Facebook',
          detail: has('facebook') ? 'সংযুক্ত' : 'সংযুক্ত নয়',
          on: has('facebook'),
          connect: () => link('facebook'),
          disconnect: () => unlink('facebook', 'Facebook'),
        }
      : null,
  ].filter((r) => r !== null)

  return (
    <Card id="logins" title="লগইন পদ্ধতি">
      <p className="t-small t-muted" style={{ marginTop: 6 }}>
        অন্তত একটি পদ্ধতি সংযুক্ত থাকতে হবে।
      </p>
      {accounts.isPending ? (
        <Skeleton style={{ height: 200, marginTop: 12 }} />
      ) : (
        <div style={{ marginTop: 8 }}>
          {rows.map((r) => (
            <div key={r.key} className="setting-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                <span className="provider-logo" aria-hidden="true">
                  {r.logo}
                </span>
                <div style={{ minWidth: 0 }}>
                  <strong>{r.name}</strong>
                  <p>{r.detail}</p>
                </div>
              </div>
              {r.on ? (
                <Button
                  variant="dangerGhost"
                  size="sm"
                  onClick={r.disconnect}
                  disabled={methodCount <= 1}
                  pending={busy === r.key}
                  aria-label={`${r.name} বিচ্ছিন্ন করুন`}
                >
                  বিচ্ছিন্ন করুন
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={r.connect}
                  pending={busy === r.key}
                  aria-label={`${r.name} সংযুক্ত করুন`}
                >
                  সংযুক্ত করুন
                </Button>
              )}
            </div>
          ))}
          <div className="setting-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <span className="provider-logo" aria-hidden="true">
                <IconMail className="ic" />
              </span>
              <div style={{ minWidth: 0 }}>
                <strong>ইমেইল ও পাসওয়ার্ড</strong>
                <p>
                  {realEmail ? user.email : 'ইমেইল যুক্ত নেই'}
                  {realEmail ? (user.emailVerified ? ' · যাচাইকৃত' : ' · যাচাই বাকি') : ''}
                  {has('credential') ? '' : ' · পাসওয়ার্ড সেট করা নেই'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm" onClick={() => setModal('email')}>
                {realEmail ? 'ইমেইল বদলান' : 'ইমেইল যুক্ত করুন'}
              </Button>
              {has('credential') ? (
                <Button variant="secondary" size="sm" onClick={() => setModal('password')}>
                  <IconKey className="ic" aria-hidden="true" /> পাসওয়ার্ড বদলান
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={setPassword}>
                  পাসওয়ার্ড সেট করুন
                </Button>
              )}
            </div>
          </div>
          <div className="setting-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <span className="provider-logo" aria-hidden="true">
                <IconMobile className="ic" />
              </span>
              <div style={{ minWidth: 0 }}>
                <strong>ফোন (ওটিপি)</strong>
                <p>
                  {user.phoneNumber && user.phoneNumberVerified
                    ? `${bn(user.phoneNumber.replace(/^\+88/, ''))} · শুধু মজলিসের রিমাইন্ডার ও লগইনে ব্যবহৃত, কখনো পাবলিক নয়`
                    : 'সংযুক্ত নয়'}
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setModal('phone')}>
              {user.phoneNumberVerified ? 'নম্বর বদলান' : 'সংযুক্ত করুন'}
            </Button>
          </div>
        </div>
      )}
      <PhoneLinkModal
        open={modal === 'phone'}
        onOpenChange={(o) => setModal(o ? 'phone' : null)}
        onLinked={() => router.refresh()}
      />
      <PasswordModal
        open={modal === 'password'}
        onOpenChange={(o) => setModal(o ? 'password' : null)}
      />
      <EmailModal
        open={modal === 'email'}
        onOpenChange={(o) => setModal(o ? 'email' : null)}
        current={user.email}
      />
    </Card>
  )
}

/* ---------------- sessions ---------------- */

type SessionRow = {
  id: string
  token: string
  userAgent?: string | null
  ipAddress?: string | null
  updatedAt?: string | Date | null
  createdAt?: string | Date | null
  expiresAt?: string | Date | null
}

const SESSION_DAYS = 30
/** Last activity: updatedAt when present, otherwise derived from the rolling 30-day expiry. */
function lastActive(s: SessionRow): number | null {
  const direct = new Date(s.updatedAt ?? s.createdAt ?? NaN).getTime()
  if (Number.isFinite(direct)) return direct
  const exp = new Date(s.expiresAt ?? NaN).getTime()
  return Number.isFinite(exp) ? exp - SESSION_DAYS * 24 * 3600 * 1000 : null
}

/** "Chrome · Windows" from a user agent string. */
export function describeDevice(ua: string | null | undefined): string {
  if (!ua) return 'অজানা ডিভাইস'
  if (/ruhama|expo/i.test(ua)) return 'Ruhama অ্যাপ'
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Safari\//.test(ua)
            ? 'Safari'
            : 'ব্রাউজার'
  const os = /Android/.test(ua)
    ? 'Android ফোন'
    : /iPhone|iPad/.test(ua)
      ? 'iPhone'
      : /Windows/.test(ua)
        ? 'Windows'
        : /Mac OS X/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : ''
  return [browser, os].filter(Boolean).join(' · ')
}

export function SessionsSection() {
  const router = useRouter()
  const qc = useQueryClient()
  const { data: session } = authClient.useSession()
  const sessions = useQuery({
    queryKey: ['me', 'sessions'],
    queryFn: async () => {
      const { data, error } = await authClient.listSessions()
      if (error) throw error
      return (data ?? []) as SessionRow[]
    },
  })
  const currentToken = session?.session?.token
  const list = [...(sessions.data ?? [])].sort((a, b) =>
    a.token === currentToken
      ? -1
      : b.token === currentToken
        ? 1
        : (lastActive(b) ?? 0) - (lastActive(a) ?? 0),
  )
  const others = list.filter((s) => s.token !== currentToken)
  const [pending, start] = useTransition()

  function revoke(token: string, device: string) {
    start(async () => {
      const { error } = await authClient.revokeSession({ token })
      if (error) {
        toast.error('লগআউট করা যায়নি', { description: authErrorMessage(error) })
        return
      }
      toast.success(`${device} থেকে লগআউট করা হয়েছে`)
      void qc.invalidateQueries({ queryKey: ['me', 'sessions'] })
    })
  }
  function revokeOthers() {
    start(async () => {
      const { error } = await authClient.revokeOtherSessions()
      if (error) {
        toast.error('লগআউট করা যায়নি', { description: authErrorMessage(error) })
        return
      }
      toast.success('অন্য সব ডিভাইস থেকে লগআউট করা হয়েছে')
      void qc.invalidateQueries({ queryKey: ['me', 'sessions'] })
      router.refresh()
    })
  }

  return (
    <Card
      id="sessions"
      title="সক্রিয় সেশন"
      action={
        <Button
          variant="dangerGhost"
          size="sm"
          onClick={revokeOthers}
          disabled={!others.length || pending}
        >
          অন্য সব ডিভাইস থেকে লগআউট
        </Button>
      }
    >
      {sessions.isPending ? (
        <Skeleton style={{ height: 140, marginTop: 12 }} />
      ) : (
        <div style={{ marginTop: 8 }}>
          {list.map((s) => {
            const device = describeDevice(s.userAgent)
            const current = s.token === currentToken
            return (
              <div key={s.id} className="setting-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                  <span className="provider-logo" aria-hidden="true">
                    {/Android|iPhone/.test(s.userAgent ?? '') ? (
                      <IconMobile className="ic" />
                    ) : (
                      <IconLaptop className="ic" />
                    )}
                  </span>
                  <div>
                    <strong>{device}</strong>
                    <p>
                      {current
                        ? 'এখন সক্রিয়'
                        : lastActive(s)
                          ? `সর্বশেষ সক্রিয় ${formatRelative(lastActive(s)!)}`
                          : 'সক্রিয়'}
                    </p>
                  </div>
                </div>
                {current ? (
                  <Badge variant="reviewed">এই ডিভাইস</Badge>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revoke(s.token, device)}
                    disabled={pending}
                  >
                    লগআউট
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

/* ---------------- notifications ---------------- */

const NOTIFY_ROWS = [
  ['answer', 'প্রশ্নের উত্তর প্রকাশিত হলে'],
  ['event', 'মজলিসের রিমাইন্ডার'],
  ['forum', 'ফোরামে আমার আলোচনায় উত্তর'],
  ['weekly', 'সাপ্তাহিক চিঠি'],
  ['course', 'নতুন পাঠ ও কোর্স'],
] as const

export function NotificationsSection({ initial }: { initial: SettingsUser['notificationPrefs'] }) {
  const [prefs, setPrefs] = useState(initial)
  function toggle(key: keyof SettingsUser['notificationPrefs'], channel: 'email' | 'site') {
    const before = prefs
    const next = { ...prefs, [key]: { ...prefs[key], [channel]: !prefs[key][channel] } }
    setPrefs(next)
    void updateNotificationPrefsAction(next).then((res) => {
      if (!res.ok) {
        setPrefs(before)
        toast.error('সংরক্ষণ করা যায়নি', { description: res.error })
      }
    })
  }
  return (
    <Card id="notify" title="নোটিফিকেশন">
      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <table style={{ width: '100%', minWidth: 460, borderCollapse: 'collapse', fontSize: 15 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--rh-muted)', fontSize: 14 }}>
              <th style={{ padding: '10px 0', fontWeight: 600 }}>বিষয়</th>
              <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center', width: 96 }}>
                ইমেইল
              </th>
              <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center', width: 96 }}>
                সাইটে
              </th>
            </tr>
          </thead>
          <tbody>
            {NOTIFY_ROWS.map(([key, label]) => (
              <tr key={key} style={{ borderTop: '1px solid var(--rh-border)' }}>
                <td style={{ padding: '14px 0' }}>{label}</td>
                <td style={{ textAlign: 'center' }}>
                  <Switch
                    checked={prefs[key].email}
                    onCheckedChange={() => toggle(key, 'email')}
                    label={`${label}: ইমেইল`}
                  />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <Switch
                    checked={prefs[key].site}
                    onCheckedChange={() => toggle(key, 'site')}
                    label={`${label}: সাইটে`}
                    disabled={key === 'weekly'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/* ---------------- delete account ---------------- */

export function DeleteSection() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const res = await requestAccountDeletionAction(confirm)
      if (!res.ok) return setError(res.error)
      // sessions are gone server-side; leave the signed-in area
      toast.success('অনুরোধ গৃহীত হয়েছে', {
        description: '৩০ দিনের মধ্যে লগইন করলে সিদ্ধান্ত বাতিল হবে।',
      })
      router.replace('/')
      router.refresh()
    })
  }
  return (
    <section id="delete" className="danger-zone settings-section" aria-labelledby="s-delete">
      <h2 id="s-delete" className="t-h4" style={{ color: 'var(--rh-error)' }}>
        অ্যাকাউন্ট মুছুন
      </h2>
      <p className="t-small" style={{ marginTop: 8, maxWidth: '60ch' }}>
        অ্যাকাউন্ট মুছলে কোর্সের অগ্রগতি, সংরক্ষিত লেখা ও যাত্রার রেকর্ড স্থায়ীভাবে মুছে যাবে।
        ফোরামের পোস্টগুলো “অজ্ঞাত সদস্য” নামে থেকে যাবে। ৩০ দিনের মধ্যে লগইন করলে সিদ্ধান্ত বাতিল
        করা যাবে।
      </p>
      <Button variant="danger" size="sm" style={{ marginTop: 16 }} onClick={() => setOpen(true)}>
        অ্যাকাউন্ট মুছে ফেলুন
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="সত্যিই অ্যাকাউন্ট মুছবেন?"
        width={460}
        onSubmit={submit}
      >
        <p className="t-small t-muted">
          নিশ্চিত করতে নিচের ঘরে <strong style={{ color: 'var(--rh-ink)' }}>মুছে ফেলুন</strong>{' '}
          লিখুন।
        </p>
        {error ? <FormAlert>{error}</FormAlert> : null}
        <label htmlFor="del-confirm" className="sr-only">
          নিশ্চিতকরণ
        </label>
        <Input
          id="del-confirm"
          autoComplete="off"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10 }}>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            থাক, রেখে দিন
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={confirm.trim() !== 'মুছে ফেলুন'}
            pending={pending}
          >
            স্থায়ীভাবে মুছুন
          </Button>
        </div>
      </Modal>
    </section>
  )
}
