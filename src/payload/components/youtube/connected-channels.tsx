'use client'

import { toast } from '@payloadcms/ui'
import { useCallback, useEffect, useState } from 'react'

import { IconDelete } from '@/components/icons'

import { api, useYouTube } from './use-youtube'
import { GoogleMark } from './youtube-field'

type Row = {
  id: number
  channelTitle?: string | null
  channelHandle?: string | null
  channelThumb?: string | null
  status?: string | null
  connectedAt?: string | null
  lastUsedAt?: string | null
  user?: { id: number; name?: string | null; email?: string | null } | number | null
}

const date = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '-'

/**
 * Integrations > YouTube: every channel connected on the site, who connected it, and a disconnect
 * button (it also withdraws the permission on Google's side). Plus "connect my channel" for the admin.
 */
export function ConnectedChannels() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [reload, setReload] = useState(0)
  const yt = useYouTube(true)

  useEffect(() => {
    let alive = true
    api<{ docs: Row[] }>('/all')
      .then((r) => alive && setRows(r.docs))
      .catch(() => alive && setRows([]))
    return () => {
      alive = false
    }
  }, [reload, yt.status])

  const remove = useCallback(async (r: Row) => {
    if (
      !window.confirm(
        `"${r.channelTitle}" চ্যানেলের সংযোগ বিচ্ছিন্ন করবেন? যুক্ত করা ভিডিওগুলো সাইটে থেকে যাবে।`,
      )
    )
      return
    try {
      await api(`/connections/${r.id}`, { method: 'DELETE' })
      toast.success('সংযোগ বিচ্ছিন্ন হয়েছে')
      setReload((n) => n + 1)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }, [])

  return (
    <div className="rh-yt-channels">
      <span className="field-label">যুক্ত চ্যানেল</span>
      {rows && rows.length ? (
        <ul>
          {rows.map((r) => {
            const who = r.user && typeof r.user === 'object' ? r.user.name || r.user.email : null
            return (
              <li key={r.id}>
                {r.channelThumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.channelThumb} alt="" width={32} height={32} />
                ) : (
                  <span className="rh-yt-channels__dot" />
                )}
                <span className="rh-yt-channels__name">
                  <strong>{r.channelTitle}</strong>
                  <span>
                    {r.channelHandle ? `${r.channelHandle} · ` : ''}
                    {who ? `যুক্ত করেছেন ${who} · ` : ''}
                    {date(r.connectedAt)}
                  </span>
                </span>
                {r.status === 'revoked' ? (
                  <span className="rh-contacts-panel__tag">আবার যুক্ত করতে হবে</span>
                ) : null}
                <button
                  type="button"
                  className="rh-contacts-panel__remove"
                  aria-label={`${r.channelTitle} বিচ্ছিন্ন করুন`}
                  onClick={() => void remove(r)}
                >
                  <IconDelete size={14} />
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="rh-contacts-panel__muted">
          {rows ? 'এখনো কোনো চ্যানেল যুক্ত হয়নি।' : 'লোড হচ্ছে...'}
        </p>
      )}
      {yt.status?.enabled ? (
        <button type="button" className="rh-yt-google" onClick={yt.connect}>
          <GoogleMark /> আমার YouTube চ্যানেল যুক্ত করুন
        </button>
      ) : (
        <p className="rh-contacts-panel__muted">
          চ্যানেল যুক্ত করতে উপরে Client ID ও secret দিয়ে “YouTube সংযোগ চালু” করে সংরক্ষণ করুন।
        </p>
      )}
    </div>
  )
}
