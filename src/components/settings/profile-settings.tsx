'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import {
  removeProfilePhotoAction,
  searchMembersAction,
  setProfilePhotoAction,
  updateCoverAction,
  updatePrivacyAction,
} from '@/actions/settings'
import {
  IconClose,
  IconDelete,
  IconInfo,
  IconLock,
  IconSearch,
  IconUpload,
} from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Field, FormAlert, Input, Select, Switch, Textarea } from '@/components/ui/form'
import { UserAvatar } from '@/components/ui/user-avatar'
import { apiFetch } from '@/lib/api-client'
import { bn, initials } from '@/lib/format'
import { genderLabel } from '@/lib/gender'
import {
  MAX_ALLOWED_VIEWERS,
  SECTIONS,
  VISIBILITY,
  type ProfilePrivacy,
  type SectionKey,
  type Visibility,
} from '@/lib/profile-privacy'
import { SURAHS } from '@/lib/quran-meta'
import { HADITH_BOOKS } from '@/lib/sources'
import type { MemberHit } from '@/server/services/profile'

/* ---------------- photo (brothers) ---------------- */

/** Square, centred, at most 1080px, as WebP (JPEG where WebP encoding is missing). */
async function squareImage(file: File, size = 1080): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const out = Math.min(size, side)
  const canvas = document.createElement('canvas')
  canvas.width = out
  canvas.height = out
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    out,
    out,
  )
  bitmap.close()
  const encode = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
  const webp = await encode('image/webp', 0.86)
  if (webp && webp.type === 'image/webp') return webp
  const jpeg = await encode('image/jpeg', 0.88)
  if (!jpeg) throw new Error('encode')
  return jpeg
}

export function PhotoField({
  name,
  gender,
  photo,
  swatch,
}: {
  name: string
  gender: 'male' | 'female' | null
  photo: string | null
  swatch: { bg: string; ink: string }
}) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [current, setCurrent] = useState(photo)
  const [pending, start] = useTransition()

  if (gender !== 'male') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span
          className="avatar avatar-xl avatar--ring"
          style={{ background: swatch.bg, color: swatch.ink }}
          aria-hidden="true"
        >
          {initials(name)}
        </span>
        <p className="t-small t-muted" style={{ maxWidth: 320 }}>
          বোনদের জন্য প্রোফাইল ছবি রাখার সুযোগ নেই। প্রোফাইলে নামের আদ্যক্ষর দেখাবে, রংটি নিচে বেছে
          নিতে পারেন।
        </p>
      </div>
    )
  }

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    start(async () => {
      let blob: Blob
      try {
        blob = await squareImage(file)
      } catch {
        toast.error('ছবিটি খোলা যায়নি', { description: 'JPG, PNG বা WebP ছবি দিন।' })
        return
      }
      const form = new FormData()
      form.set('photo', new File([blob], 'photo', { type: blob.type }))
      const res = await setProfilePhotoAction(form)
      if (!res.ok) {
        toast.error('ছবি রাখা যায়নি', { description: res.error })
        return
      }
      setCurrent(res.data.image)
      toast.success('প্রোফাইল ছবি হালনাগাদ হয়েছে')
      router.refresh()
    })
  }

  function remove() {
    start(async () => {
      const res = await removeProfilePhotoAction()
      if (!res.ok) {
        toast.error('ছবি সরানো যায়নি', { description: res.error })
        return
      }
      setCurrent(null)
      toast.success('প্রোফাইল ছবি সরানো হয়েছে')
      router.refresh()
    })
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
      {current ? (
        <span className="avatar avatar-xl avatar--ring">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current} alt="" />
        </span>
      ) : (
        <span
          className="avatar avatar-xl avatar--ring"
          style={{ background: swatch.bg, color: swatch.ink }}
          aria-hidden="true"
        >
          {initials(name)}
        </span>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <strong>প্রোফাইল ছবি</strong>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            pending={pending}
            onClick={() => input.current?.click()}
          >
            <IconUpload className="ic" />
            {current ? 'ছবি বদলান' : 'ছবি দিন'}
          </Button>
          {current ? (
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={remove}>
              <IconDelete className="ic" />
              সরান
            </Button>
          ) : null}
        </div>
        <span className="t-caption t-muted">
          ছবিটি বর্গাকারে কেটে ছোট করে পাঠানো হবে। প্রোফাইলে ক্লিক করলে বড় করে দেখা যাবে।
        </span>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={pick}
        />
      </div>
    </div>
  )
}

/** "আপনার পরিচয়: ভাই" with the reason it cannot change. */
export function GenderNote({ gender }: { gender: 'male' | 'female' | null }) {
  const label = genderLabel(gender)
  if (!label) return null
  return (
    <p className="privacy-note" style={{ margin: 0 }}>
      <IconLock className="ic" />
      <span>
        আপনার পরিচয়: <strong style={{ color: 'var(--rh-ink)' }}>{label}</strong>। নিবন্ধনের সময়
        বেছে নেওয়া, পরে বদলানো যায় না।
      </span>
    </p>
  )
}

/* ---------------- cover ---------------- */

export type CoverState = {
  kind: 'none' | 'ayah' | 'hadith' | 'text'
  surah: number
  ayah: number
  book: string
  number: number
  text: string
  source: string
}

const COVER_KINDS = [
  { value: 'none', label: 'কিছু না' },
  { value: 'ayah', label: 'কুরআনের আয়াত' },
  { value: 'hadith', label: 'হাদিস' },
  { value: 'text', label: 'নিজের লেখা' },
] as const

type Preview = { arabic: string | null; text: string; reference: string } | null

function useCoverPreview(cover: CoverState): { preview: Preview; missing: boolean } {
  const [state, setState] = useState<{ key: string; preview: Preview }>({ key: '', preview: null })
  const key =
    cover.kind === 'ayah'
      ? `a:${cover.surah}:${cover.ayah}`
      : cover.kind === 'hadith'
        ? `h:${cover.book}:${cover.number}`
        : ''

  useEffect(() => {
    if (!key) return
    let alive = true
    const timer = setTimeout(async () => {
      try {
        if (cover.kind === 'ayah') {
          const res = await apiFetch<{
            ayahs: { arabic: string; translation: string; ayah: number }[]
          }>(`/quran/surahs/${cover.surah}?from=${cover.ayah}&limit=1`)
          const a = res.ayahs[0]
          const surah = SURAHS.find((s) => s.number === cover.surah)
          if (alive)
            setState({
              key,
              preview: a
                ? {
                    arabic: a.arabic,
                    text: a.translation,
                    reference: `সূরা ${surah?.bangla} : ${bn(a.ayah)}`,
                  }
                : null,
            })
        } else {
          const res = await apiFetch<{
            hadith: {
              arabic: string | null
              text: string
              numberLabel: string
              book: { name: string }
            }
          }>(`/hadith/books/${cover.book}/${cover.number}`)
          if (alive)
            setState({
              key,
              preview: {
                arabic: res.hadith.arabic,
                text: res.hadith.text,
                reference: `${res.hadith.book.name} : ${bn(res.hadith.numberLabel)}`,
              },
            })
        }
      } catch {
        if (alive) setState({ key, preview: null })
      }
    }, 350)
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [key, cover.kind, cover.surah, cover.ayah, cover.book, cover.number])

  if (!key) return { preview: null, missing: false }
  return {
    preview: state.key === key ? state.preview : null,
    missing: state.key === key && !state.preview,
  }
}

export function CoverSection({ initial }: { initial: CoverState }) {
  const router = useRouter()
  const [cover, setCover] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const { preview, missing } = useCoverPreview(cover)
  const surah = SURAHS.find((s) => s.number === cover.surah)
  const set = (patch: Partial<CoverState>) => setCover((c) => ({ ...c, ...patch }))

  function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const input =
        cover.kind === 'ayah'
          ? { kind: 'ayah' as const, surah: cover.surah, ayah: cover.ayah }
          : cover.kind === 'hadith'
            ? { kind: 'hadith' as const, book: cover.book, number: cover.number }
            : cover.kind === 'text'
              ? { kind: 'text' as const, text: cover.text, source: cover.source }
              : { kind: 'none' as const }
      const res = await updateCoverAction(input)
      if (!res.ok) {
        setError(res.error)
        return
      }
      toast.success('কভার হালনাগাদ হয়েছে')
      router.refresh()
    })
  }

  const shown =
    cover.kind === 'text'
      ? cover.text.trim()
        ? { arabic: null, text: cover.text.trim(), reference: cover.source.trim() }
        : null
      : preview

  return (
    <section id="cover" className="card card-pad settings-section" aria-labelledby="s-cover">
      <h2 id="s-cover" className="t-h3">
        প্রোফাইলের কভার
      </h2>
      <p className="t-small t-muted" style={{ marginTop: 6 }}>
        প্রোফাইলের উপরের অংশে আপনার পছন্দের একটি আয়াত, হাদিস বা নিজের কথা দেখাতে পারেন।
      </p>
      <form
        onSubmit={save}
        style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 18 }}
        noValidate
      >
        {error ? <FormAlert>{error}</FormAlert> : null}
        <div className="chip-row" role="radiogroup" aria-label="কভারে কী থাকবে">
          {COVER_KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              role="radio"
              aria-checked={cover.kind === k.value}
              className={`chip${cover.kind === k.value ? ' is-active' : ''}`}
              onClick={() => set({ kind: k.value })}
            >
              {k.label}
            </button>
          ))}
        </div>

        {cover.kind === 'ayah' ? (
          <div className="form-grid">
            <Field label="সূরা" htmlFor="cv-surah">
              <Select
                id="cv-surah"
                value={cover.surah}
                onChange={(e) => set({ surah: Number(e.target.value), ayah: 1 })}
              >
                {SURAHS.map((s) => (
                  <option key={s.number} value={s.number}>
                    {bn(s.number)}. {s.bangla}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="আয়াত নম্বর"
              htmlFor="cv-ayah"
              hint={surah ? `১ থেকে ${bn(surah.ayahs)}` : undefined}
            >
              <Input
                id="cv-ayah"
                type="number"
                inputMode="numeric"
                min={1}
                max={surah?.ayahs}
                value={cover.ayah}
                onChange={(e) => set({ ayah: Math.max(1, Number(e.target.value) || 1) })}
              />
            </Field>
          </div>
        ) : null}

        {cover.kind === 'hadith' ? (
          <div className="form-grid">
            <Field label="গ্রন্থ" htmlFor="cv-book">
              <Select
                id="cv-book"
                value={cover.book}
                onChange={(e) => set({ book: e.target.value })}
              >
                {HADITH_BOOKS.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="হাদিস নম্বর" htmlFor="cv-number">
              <Input
                id="cv-number"
                type="number"
                inputMode="numeric"
                min={1}
                value={cover.number}
                onChange={(e) => set({ number: Math.max(1, Number(e.target.value) || 1) })}
              />
            </Field>
          </div>
        ) : null}

        {cover.kind === 'text' ? (
          <>
            <Field
              label="লেখা"
              htmlFor="cv-text"
              hint={`সর্বোচ্চ ২০০ অক্ষর (${bn(cover.text.length)}/২০০)`}
            >
              <Textarea
                id="cv-text"
                maxLength={200}
                style={{ minHeight: 90 }}
                value={cover.text}
                onChange={(e) => set({ text: e.target.value })}
              />
            </Field>
            <Field label="উৎস (ঐচ্ছিক)" htmlFor="cv-source">
              <Input
                id="cv-source"
                maxLength={80}
                value={cover.source}
                onChange={(e) => set({ source: e.target.value })}
              />
            </Field>
          </>
        ) : null}

        {cover.kind !== 'none' ? (
          <div className="cover-preview" aria-live="polite">
            {shown ? (
              <>
                {shown.arabic ? (
                  <p className="cover-quote__ar" lang="ar" dir="rtl">
                    {shown.arabic}
                  </p>
                ) : null}
                <p className="cover-quote__text">“{shown.text}”</p>
                {shown.reference ? <p className="cover-quote__ref">{shown.reference}</p> : null}
              </>
            ) : (
              <p className="cover-quote__ref">
                {missing ? 'এই নম্বরে কিছু পাওয়া যায়নি।' : 'প্রিভিউ লোড হচ্ছে…'}
              </p>
            )}
          </div>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" pending={pending} disabled={missing}>
            কভার সংরক্ষণ
          </Button>
        </div>
      </form>
    </section>
  )
}

/* ---------------- privacy ---------------- */

export type PrivacyState = ProfilePrivacy & { discoverable: boolean; viewers: MemberHit[] }

function ViewerPicker({
  viewers,
  onChange,
}: {
  viewers: MemberHit[]
  onChange: (next: MemberHit[]) => void
}) {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<MemberHit[]>([])
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const query = q.trim()
    if (query.length < 2) return
    let alive = true
    const timer = setTimeout(async () => {
      setSearching(true)
      const res = await searchMembersAction(query)
      if (!alive) return
      setSearching(false)
      if (res.ok) {
        setHits(res.data)
        setMessage(res.data.length ? null : 'কাউকে পাওয়া যায়নি।')
      } else setMessage(res.error)
    }, 350)
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [q])

  const chosen = new Set(viewers.map((v) => v.id))
  const full = viewers.length >= MAX_ALLOWED_VIEWERS
  const shownHits = q.trim().length >= 2 ? hits : []

  return (
    <div className="viewer-picker">
      <Field
        label="কারা দেখতে পারবেন"
        htmlFor="vp-search"
        hint="নাম লিখে খুঁজুন, অথবা পুরো ইমেইল বা মোবাইল নম্বর দিন।"
      >
        <div className="input-icon">
          <IconSearch className="ic" />
          <Input
            id="vp-search"
            value={q}
            placeholder="নাম, ইমেইল বা মোবাইল"
            autoComplete="off"
            onChange={(e) => setQ(e.target.value)}
            disabled={full}
          />
        </div>
      </Field>
      {searching ? <p className="t-caption t-muted">খোঁজা হচ্ছে…</p> : null}
      {!searching && message && q.trim().length >= 2 ? (
        <p className="t-caption t-muted">{message}</p>
      ) : null}
      {shownHits.length ? (
        <ul className="list-reset viewer-picker__hits" aria-label="খোঁজের ফলাফল">
          {shownHits.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                className="viewer-picker__hit"
                disabled={chosen.has(h.id) || full}
                onClick={() => {
                  onChange([...viewers, h])
                  setQ('')
                  setHits([])
                }}
              >
                <UserAvatar name={h.name} image={h.image} size="sm" />
                <span>{h.name}</span>
                <span className="t-caption t-muted">
                  {chosen.has(h.id) ? 'যোগ করা হয়েছে' : 'যোগ করুন'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {viewers.length ? (
        <ul className="list-reset viewer-picker__chosen" aria-label="যারা দেখতে পারবেন">
          {viewers.map((v) => (
            <li key={v.id} className="viewer-chip">
              <UserAvatar name={v.name} image={v.image} size="sm" />
              <span>{v.name}</span>
              <button
                type="button"
                className="btn-icon"
                aria-label={`${v.name}-কে তালিকা থেকে সরান`}
                onClick={() => onChange(viewers.filter((x) => x.id !== v.id))}
              >
                <IconClose className="ic ic-sm" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="t-caption t-muted">এখনো কাউকে যোগ করা হয়নি।</p>
      )}
    </div>
  )
}

export function PrivacySection({ initial }: { initial: PrivacyState }) {
  const router = useRouter()
  const [state, setState] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [pending, start] = useTransition()
  const dirty = JSON.stringify(state) !== JSON.stringify(saved)

  function save() {
    start(async () => {
      const res = await updatePrivacyAction({
        visibility: state.visibility,
        allowedViewers: state.viewers.map((v) => v.id),
        showPhoto: state.showPhoto,
        showCover: state.showCover,
        showBio: state.showBio,
        showDistrict: state.showDistrict,
        showJourney: state.showJourney,
        showActivity: state.showActivity,
        discoverable: state.discoverable,
      })
      if (!res.ok) {
        toast.error('সংরক্ষণ করা যায়নি', { description: res.error })
        return
      }
      setSaved(state)
      toast.success('গোপনীয়তা হালনাগাদ হয়েছে')
      router.refresh()
    })
  }

  const allPublic = SECTIONS.every((s) => state[s.key])
  return (
    <section id="privacy" className="card card-pad settings-section" aria-labelledby="s-privacy">
      <h2 id="s-privacy" className="t-h3">
        গোপনীয়তা
      </h2>

      <fieldset className="field" style={{ border: 0, padding: 0, margin: '18px 0 0' }}>
        <legend className="label" style={{ marginBottom: 10 }}>
          কারা আপনার প্রোফাইল দেখতে পারবে
        </legend>
        <div className="visibility-grid" role="radiogroup">
          {VISIBILITY.map((v) => (
            <label
              key={v.value}
              className={`visibility-card${state.visibility === v.value ? ' is-checked' : ''}`}
            >
              <input
                type="radio"
                name="visibility"
                value={v.value}
                checked={state.visibility === v.value}
                onChange={() => setState((s) => ({ ...s, visibility: v.value as Visibility }))}
              />
              <strong>{v.label}</strong>
              <span>{v.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {state.visibility === 'custom' ? (
        <ViewerPicker
          viewers={state.viewers}
          onChange={(viewers) => setState((s) => ({ ...s, viewers }))}
        />
      ) : null}

      {state.visibility !== 'private' ? (
        <div style={{ marginTop: 20 }}>
          <div className="setting-row">
            <div>
              <strong id="pv-all">যা দেখাবেন</strong>
              <p>যারা প্রোফাইল দেখতে পারবেন, তাঁরা শুধু চালু রাখা অংশগুলো দেখবেন।</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setState((s) => ({
                  ...s,
                  ...Object.fromEntries(SECTIONS.map((x) => [x.key, !allPublic])),
                }))
              }
            >
              {allPublic ? 'সব বন্ধ' : 'সব চালু'}
            </Button>
          </div>
          {SECTIONS.map((s) => (
            <div key={s.key} className="setting-row">
              <div>
                <strong id={`pv-${s.key}`}>{s.label}</strong>
                {s.hint ? <p>{s.hint}</p> : null}
              </div>
              <Switch
                checked={state[s.key as SectionKey]}
                onCheckedChange={(next) => setState((x) => ({ ...x, [s.key]: next }))}
                labelledBy={`pv-${s.key}`}
              />
            </div>
          ))}
        </div>
      ) : null}

      <div className="setting-row">
        <div>
          <strong id="pv-discoverable">স্থানীয় সার্কেলে খুঁজে পাওয়া যাবে</strong>
          <p>আপনার জেলার সার্কেল সমন্বয়ক আপনাকে আমন্ত্রণ জানাতে পারবেন।</p>
        </div>
        <Switch
          checked={state.discoverable}
          onCheckedChange={(next) => setState((x) => ({ ...x, discoverable: next }))}
          labelledBy="pv-discoverable"
        />
      </div>

      <div className="privacy-note" style={{ marginTop: 16 }}>
        <IconInfo className="ic" />
        <span>
          লক করা প্রোফাইলে অন্যরা শুধু আপনার নাম দেখবেন। ফোন, ইমেইল ও আপনার প্রশ্ন সবসময় গোপন থাকে।
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <Button type="button" onClick={save} pending={pending} disabled={!dirty}>
          গোপনীয়তা সংরক্ষণ
        </Button>
      </div>
    </section>
  )
}
