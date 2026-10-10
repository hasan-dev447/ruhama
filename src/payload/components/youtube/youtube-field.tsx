'use client'

import { TextField, toast, useField, useForm } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import { IconClose, IconSearch, IconVideo } from '@/components/icons'

import { api, type ChannelVideo, formatSeconds, useYouTube } from './use-youtube'

type Props = TextFieldClientProps & {
  /** what the field stores: the bare video id, or a youtu.be link */
  store?: 'id' | 'url'
  /** a sibling field to fill with the video's title when it is empty */
  titleField?: string
}

const PRIVACY: Record<ChannelVideo['privacy'], string> = {
  public: 'সবার জন্য',
  unlisted: 'Unlisted',
  private: 'Private',
  unknown: '',
}

/** Why a video cannot be used on the site, or null when it can. */
function unusable(v: ChannelVideo): string | null {
  if (v.privacy === 'private')
    return 'Private ভিডিও সাইটে চলে না। YouTube-এ Unlisted বা Public করুন।'
  if (!v.embeddable) return 'YouTube-এ এই ভিডিওর "Allow embedding" বন্ধ।'
  return null
}

/**
 * A YouTube link or id field with a "YouTube থেকে বেছে নিন" button: the user picks from the videos of
 * a channel they connected through Google (Integrations > YouTube), or connects one right here.
 * Pasting a link keeps working without any connection.
 */
export function YouTubeField(props: Props) {
  const { store = 'url', titleField, path } = props
  const { setValue } = useField<string>({ path })
  const { dispatchFields, getDataByPath } = useForm()
  const [open, setOpen] = useState(false)
  const yt = useYouTube(true)

  const titlePath = titleField ? path.replace(/[^.]+$/, titleField) : null
  const usable = yt.status?.enabled && yt.status.allowed

  function choose(v: ChannelVideo) {
    setValue(store === 'id' ? v.id : `https://youtu.be/${v.id}`)
    if (titlePath && !getDataByPath(titlePath))
      dispatchFields({ type: 'UPDATE', path: titlePath, value: v.title })
    setOpen(false)
    toast.success('ভিডিও যুক্ত হয়েছে')
  }

  return (
    <div className="rh-yt-field">
      <TextField {...props} />
      {usable ? (
        <button
          type="button"
          className="rh-int-btn rh-yt-field__pick"
          onClick={() => setOpen(true)}
        >
          <IconVideo size={15} aria-hidden="true" /> YouTube থেকে বেছে নিন
        </button>
      ) : null}
      {open ? <Picker yt={yt} onClose={() => setOpen(false)} onChoose={choose} /> : null}
    </div>
  )
}

function Picker({
  yt,
  onClose,
  onChoose,
}: {
  yt: ReturnType<typeof useYouTube>
  onClose: () => void
  onChoose: (v: ChannelVideo) => void
}) {
  const connections = useMemo(() => yt.status?.connections ?? [], [yt.status])
  const [picked, setPicked] = useState<number | null>(null)
  const channel = connections.find((c) => c.id === picked) ?? connections[0] ?? null
  const [q, setQ] = useState('')
  // "more videos" for a channel; switching channel starts again from its first page
  const [more, setMore] = useState<{ channel: number; token: string } | null>(null)
  const [result, setResult] = useState<{
    key: string
    channel: number
    videos: ChannelVideo[]
    next: string | null
    error: string | null
  } | null>(null)

  const channelId = channel?.id ?? null
  const token = more && more.channel === channelId ? more.token : ''
  const requestKey = channelId === null ? null : `${channelId}|${token}`

  useEffect(() => {
    if (channelId === null || requestKey === null) return
    let alive = true
    api<{ videos: ChannelVideo[]; nextPageToken: string | null }>(
      `/videos?connection=${channelId}${token ? `&pageToken=${encodeURIComponent(token)}` : ''}`,
    )
      .then((r) =>
        setResult((prev) =>
          alive
            ? {
                key: requestKey,
                channel: channelId,
                videos:
                  token && prev?.channel === channelId ? [...prev.videos, ...r.videos] : r.videos,
                next: r.nextPageToken,
                error: null,
              }
            : prev,
        ),
      )
      .catch((e: Error) =>
        setResult((prev) =>
          alive
            ? {
                key: requestKey,
                channel: channelId,
                videos: prev?.channel === channelId ? prev.videos : [],
                next: null,
                error: e.message,
              }
            : prev,
        ),
      )
    return () => {
      alive = false
    }
  }, [channelId, token, requestKey])

  const loading = requestKey !== null && result?.key !== requestKey
  const current = result && result.channel === channelId ? result : null
  const videos = current?.videos ?? []
  const next = current?.next ?? null
  const failed = current?.error ?? null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const shown = q.trim()
    ? videos.filter((v) => v.title.toLowerCase().includes(q.trim().toLowerCase()))
    : videos

  return createPortal(
    <div
      className="rh-yt-modal"
      role="dialog"
      aria-modal="true"
      aria-label="YouTube থেকে ভিডিও বেছে নিন"
    >
      <div className="rh-yt-modal__backdrop" onClick={onClose} />
      <div className="rh-yt-modal__panel">
        <header className="rh-yt-modal__head">
          <strong>YouTube থেকে ভিডিও বেছে নিন</strong>
          <button
            type="button"
            className="rh-yt-modal__close"
            onClick={onClose}
            aria-label="বন্ধ করুন"
          >
            <IconClose size={18} />
          </button>
        </header>

        {!connections.length ? (
          <div className="rh-yt-modal__empty">
            <p>
              আপনার YouTube চ্যানেল এখনো যুক্ত নেই। Google দিয়ে একবার যুক্ত করলে এখানে আপনার
              চ্যানেলের সব ভিডিও (Unlisted সহ) দেখাবে। সাইট শুধু ভিডিওর তালিকা দেখতে পারবে, কিছু
              বদলাতে বা আপলোড করতে পারবে না।
            </p>
            <button type="button" className="rh-yt-google" onClick={yt.connect}>
              <GoogleMark /> Google দিয়ে YouTube যুক্ত করুন
            </button>
          </div>
        ) : (
          <>
            <div className="rh-yt-modal__bar">
              <label className="rh-yt-modal__channel">
                <span className="sr-only">চ্যানেল</span>
                {channel?.channelThumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={channel.channelThumb} alt="" width={28} height={28} />
                ) : null}
                <select
                  value={channel?.id ?? ''}
                  onChange={(e) => setPicked(Number(e.target.value))}
                  disabled={connections.length < 2}
                >
                  {connections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.channelTitle}
                      {c.status === 'revoked' ? ' (আবার যুক্ত করুন)' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rh-yt-modal__search">
                <IconSearch size={15} aria-hidden="true" />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="লোড হওয়া ভিডিওর মধ্যে খুঁজুন"
                  aria-label="ভিডিও খুঁজুন"
                />
              </div>
              <button type="button" className="rh-int-btn rh-int-btn--ghost" onClick={yt.connect}>
                আরেকটি চ্যানেল যুক্ত করুন
              </button>
            </div>

            {failed ? (
              <div className="rh-yt-modal__error">
                <p>{failed}</p>
                <button type="button" className="rh-yt-google" onClick={yt.connect}>
                  <GoogleMark /> আবার Google দিয়ে যুক্ত করুন
                </button>
              </div>
            ) : null}

            <ul className="rh-yt-grid">
              {shown.map((v) => {
                const why = unusable(v)
                return (
                  <li key={v.id}>
                    <button
                      type="button"
                      className="rh-yt-card"
                      disabled={Boolean(why)}
                      title={why ?? v.title}
                      onClick={() => onChoose(v)}
                    >
                      <span className="rh-yt-card__thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={v.thumb} alt="" loading="lazy" />
                        {v.durationSeconds ? (
                          <span className="rh-yt-card__time">
                            {formatSeconds(v.durationSeconds)}
                          </span>
                        ) : null}
                      </span>
                      <span className="rh-yt-card__title">{v.title}</span>
                      <span className="rh-yt-card__meta">
                        {v.publishedAt
                          ? new Date(v.publishedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : null}
                        {PRIVACY[v.privacy] ? (
                          <span className={`rh-yt-card__privacy is-${v.privacy}`}>
                            {PRIVACY[v.privacy]}
                          </span>
                        ) : null}
                        {v.live ? (
                          <span className="rh-yt-card__privacy is-private">Live</span>
                        ) : null}
                      </span>
                      {why ? <span className="rh-yt-card__why">{why}</span> : null}
                    </button>
                  </li>
                )
              })}
            </ul>
            {!loading && !failed && !shown.length ? (
              <p className="rh-yt-modal__note">
                {q ? 'এই নামে লোড হওয়া কোনো ভিডিও নেই।' : 'এই চ্যানেলে এখনো কোনো ভিডিও নেই।'}
              </p>
            ) : null}
            <footer className="rh-yt-modal__foot">
              {loading ? <span>লোড হচ্ছে...</span> : null}
              {next && !loading && channel ? (
                <button
                  type="button"
                  className="rh-int-btn"
                  onClick={() => setMore({ channel: channel.id, token: next })}
                >
                  আরও ভিডিও
                </button>
              ) : null}
            </footer>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

/** Google's "G", for the connect button (Google's branding guidelines ask for it). */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

export { GoogleMark }
