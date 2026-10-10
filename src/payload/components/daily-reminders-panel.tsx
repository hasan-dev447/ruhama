'use client'

import { toast } from '@payloadcms/ui'
import { useCallback, useEffect, useState } from 'react'

import { IconAdd, IconHadith, IconQuran } from '@/components/icons'

import { OpenDocument, type Target } from './list-drawer'

type Reminder = {
  id: number
  kind: 'ayah' | 'hadith'
  date?: string | null
  active?: boolean | null
  ayah?: { key?: string; translation?: string } | number | null
  hadith?: { key?: string; text?: string } | number | null
  custom?: { reference?: string | null; translation?: string | null } | null
}

const SLUG = 'daily-reminders'
const obj = <T,>(v: T | number | null | undefined): T | null =>
  v && typeof v === 'object' ? v : null

/** Today's date in Bangladesh, as the site counts days. */
const bdToday = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

/** The same choice the home page makes (src/server/queries/home.ts): today's date first, else by turn. */
function pickToday(list: Reminder[], today: string): number | null {
  const active = list.filter((r) => r.active)
  if (!active.length) return null
  const dated = active.find((r) => r.date?.slice(0, 10) === today)
  if (dated) return dated.id
  const undated = active.filter((r) => !r.date)
  const pool = undated.length ? undated : active
  const day = Math.floor(Date.parse(`${today}T00:00:00Z`) / 86400000)
  return pool[day % pool.length]?.id ?? null
}

const showDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

/**
 * The home page's daily verse and hadith, managed right inside the home page settings: every entry,
 * which one shows today, an on/off switch, and add or edit in a side panel.
 */
export function DailyRemindersPanel() {
  const [items, setItems] = useState<Reminder[] | null>(null)
  const [reload, setReload] = useState(0)
  const [target, setTarget] = useState<(Target & { kind?: Reminder['kind'] }) | null>(null)
  const [busy, setBusy] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    const q = new URLSearchParams({
      limit: '200',
      depth: '1',
      sort: 'id',
      'populate[ayahs][key]': 'true',
      'populate[ayahs][translation]': 'true',
      'populate[hadiths][key]': 'true',
      'populate[hadiths][text]': 'true',
    })
    fetch(`/api/${SLUG}?${q}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((json: { docs?: Reminder[] }) => alive && setItems(json.docs ?? []))
      .catch(() => alive && setItems([]))
    return () => {
      alive = false
    }
  }, [reload])

  const refresh = useCallback(() => setReload((n) => n + 1), [])
  const close = useCallback(() => setTarget(null), [])

  async function toggle(r: Reminder) {
    setBusy(r.id)
    const res = await fetch(`/api/${SLUG}/${r.id}?depth=0`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ active: !r.active }),
    })
    setBusy(null)
    if (!res.ok) return toast.error('পরিবর্তন করা যায়নি')
    toast.success(r.active ? 'বন্ধ করা হয়েছে' : 'চালু করা হয়েছে')
    refresh()
  }

  const today = bdToday()
  const all = items ?? []

  const section = (kind: Reminder['kind']) => {
    const list = all.filter((r) => r.kind === kind)
    const todayId = pickToday(list, today)
    const Icon = kind === 'ayah' ? IconQuran : IconHadith
    return (
      <div className="rh-daily-panel__group">
        <div className="rh-daily-panel__head">
          <strong>
            <Icon size={16} aria-hidden="true" /> {kind === 'ayah' ? 'আয়াত' : 'হাদিস'} (
            {list.length})
          </strong>
          <button
            type="button"
            className="rh-int-btn"
            onClick={() => setTarget({ slug: SLUG, key: Date.now(), kind })}
          >
            <IconAdd size={15} /> নতুন {kind === 'ayah' ? 'আয়াত' : 'হাদিস'}
          </button>
        </div>
        {items && !list.length ? (
          <p className="rh-contacts-panel__muted">এখনো কিছু যোগ করা হয়নি।</p>
        ) : null}
        <ul className="rh-daily-panel__list">
          {list.map((r) => {
            const doc = obj(kind === 'ayah' ? r.ayah : r.hadith) as {
              key?: string
              translation?: string
              text?: string
            } | null
            const ref = r.custom?.reference || doc?.key || `#${r.id}`
            const text = r.custom?.translation || doc?.translation || doc?.text || ''
            return (
              <li key={r.id} className={r.active ? undefined : 'is-off'}>
                <button
                  type="button"
                  className="rh-daily-panel__open"
                  onClick={() => setTarget({ slug: SLUG, id: r.id, key: Date.now() })}
                >
                  <span className="rh-daily-panel__ref">{ref}</span>
                  <span className="rh-daily-panel__text">{text}</span>
                </button>
                <span className="rh-daily-panel__when">
                  {r.id === todayId ? (
                    <span className="rh-contacts-panel__tag is-primary">আজ দেখাচ্ছে</span>
                  ) : null}
                  <span className="rh-contacts-panel__tag">
                    {r.date ? showDate(r.date) : 'পালাক্রমে'}
                  </span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(r.active)}
                  aria-label={`${ref} ${r.active ? 'বন্ধ করুন' : 'চালু করুন'}`}
                  className={`rh-inline-switch${r.active ? ' is-on' : ''}`}
                  disabled={busy === r.id}
                  onClick={() => void toggle(r)}
                >
                  <span className="rh-inline-switch__track" aria-hidden="true">
                    <span className="rh-inline-switch__thumb" />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  return (
    <div className="rh-daily-panel">
      <span className="field-label">আয়াত ও হাদিসের তালিকা</span>
      <p className="rh-contacts-panel__muted">
        তারিখ দেওয়া থাকলে সেদিন সেটিই দেখাবে, নইলে তারিখ ছাড়া চালু থাকা গুলো থেকে প্রতিদিন পালা
        করে একটি। খুলে সম্পাদনা করতে নামে ক্লিক করুন।
      </p>
      {items ? (
        <div className="rh-daily-panel__groups">
          {section('ayah')}
          {section('hadith')}
        </div>
      ) : (
        <p className="rh-contacts-panel__muted">লোড হচ্ছে...</p>
      )}
      {target ? (
        <OpenDocument
          key={target.key}
          target={target}
          onClosed={close}
          onChange={refresh}
          initialData={target.id ? undefined : { kind: target.kind, active: true }}
        />
      ) : null}
    </div>
  )
}
