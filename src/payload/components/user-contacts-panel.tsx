'use client'

import { toast, useDocumentInfo, useField, useFormFields } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

import { IconDelete, IconMail, IconMobile } from '@/components/icons'

type Contact = { id: number; kind: 'email' | 'phone'; value: string; verified?: boolean | null }

const showPhone = (v: string) => v.replace(/^\+88/, '')

/**
 * A user's photo, emails and numbers in their admin panel: the primary ones, every extra one (with
 * whether it is confirmed) and remove buttons. Adding or confirming stays with the member, who has to
 * receive the code.
 */
export function UserContactsPanel() {
  const { id } = useDocumentInfo()
  const email = useFormFields(([f]) => f.email?.value as string | undefined)
  const emailVerified = useFormFields(([f]) => Boolean(f.emailVerified?.value))
  const phone = useFormFields(([f]) => f.phoneNumber?.value as string | undefined)
  const phoneVerified = useFormFields(([f]) => Boolean(f.phoneNumberVerified?.value))
  const image = useFormFields(([f]) => f.image?.value as string | undefined)
  const { value: avatar, setValue: setAvatar } = useField<number | { id: number } | null>({
    path: 'avatar',
  })
  const { setValue: setImage } = useField<string | null>({ path: 'image' })
  const [extras, setExtras] = useState<Contact[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!id) return
    let alive = true
    fetch(`/api/user-contacts?where[user][equals]=${id}&limit=50&depth=0&sort=kind`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((json: { docs?: Contact[] }) => alive && setExtras(json.docs ?? []))
      .catch(() => alive && setExtras([]))
    return () => {
      alive = false
    }
  }, [id, reload])

  if (!id) return null
  const avatarId = avatar && typeof avatar === 'object' ? avatar.id : avatar

  async function removeExtra(c: Contact) {
    if (
      !window.confirm(
        `${c.kind === 'phone' ? showPhone(c.value) : c.value} এই অ্যাকাউন্ট থেকে সরাবেন?`,
      )
    )
      return
    setBusy(`c${c.id}`)
    const res = await fetch(`/api/user-contacts/${c.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    setBusy(null)
    if (!res.ok) return toast.error('সরানো যায়নি')
    toast.success('সরানো হয়েছে')
    setReload((n) => n + 1)
  }

  async function removePhoto() {
    if (
      !avatarId ||
      !window.confirm('এই সদস্যের প্রোফাইল ছবি মুছে ফেলবেন? এটি স্থায়ীভাবে মুছে যাবে।')
    )
      return
    setBusy('photo')
    const res = await fetch(`/api/avatars/${avatarId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    setBusy(null)
    if (!res.ok) return toast.error('ছবি মোছা যায়নি')
    // the server already cleared it from the user; keep the open form in step without a save
    setAvatar(null, true)
    setImage(null, true)
    toast.success('প্রোফাইল ছবি মুছে ফেলা হয়েছে')
  }

  const emails = (extras ?? []).filter((c) => c.kind === 'email')
  const phones = (extras ?? []).filter((c) => c.kind === 'phone')

  return (
    <div className="rh-contacts-panel">
      <span className="field-label">ছবি, ইমেইল ও মোবাইল</span>

      <div className="rh-contacts-panel__photo">
        <span className="rh-avatar-cell__img" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {image && avatarId ? <img src={image} alt="" /> : '?'}
        </span>
        {avatarId ? (
          <button
            type="button"
            className="rh-int-btn rh-int-btn--danger"
            onClick={removePhoto}
            disabled={busy === 'photo'}
          >
            <IconDelete size={15} /> ছবি মুছুন
          </button>
        ) : (
          <span className="rh-contacts-panel__muted">প্রোফাইল ছবি নেই</span>
        )}
      </div>

      <ul className="rh-contacts-panel__list">
        {email ? (
          <li>
            <IconMail size={15} />
            <span className="rh-contacts-panel__value">{email}</span>
            <span className="rh-contacts-panel__tag is-primary">প্রধান</span>
            {emailVerified ? null : <span className="rh-contacts-panel__tag">যাচাই বাকি</span>}
          </li>
        ) : null}
        {emails.map((c) => (
          <li key={c.id}>
            <IconMail size={15} />
            <span className="rh-contacts-panel__value">{c.value}</span>
            {c.verified ? null : <span className="rh-contacts-panel__tag">যাচাই বাকি</span>}
            <button
              type="button"
              className="rh-contacts-panel__remove"
              aria-label={`${c.value} সরান`}
              disabled={busy === `c${c.id}`}
              onClick={() => removeExtra(c)}
            >
              <IconDelete size={14} />
            </button>
          </li>
        ))}
        {phone ? (
          <li>
            <IconMobile size={15} />
            <span className="rh-contacts-panel__value">{showPhone(phone)}</span>
            <span className="rh-contacts-panel__tag is-primary">প্রধান</span>
            {phoneVerified ? null : <span className="rh-contacts-panel__tag">যাচাই বাকি</span>}
          </li>
        ) : null}
        {phones.map((c) => (
          <li key={c.id}>
            <IconMobile size={15} />
            <span className="rh-contacts-panel__value">{showPhone(c.value)}</span>
            {c.verified ? null : <span className="rh-contacts-panel__tag">যাচাই বাকি</span>}
            <button
              type="button"
              className="rh-contacts-panel__remove"
              aria-label={`${showPhone(c.value)} সরান`}
              disabled={busy === `c${c.id}`}
              onClick={() => removeExtra(c)}
            >
              <IconDelete size={14} />
            </button>
          </li>
        ))}
      </ul>
      {extras && !emails.length && !phones.length ? (
        <p className="rh-contacts-panel__muted">কোনো অতিরিক্ত ইমেইল বা নম্বর নেই।</p>
      ) : null}
      <p className="rh-contacts-panel__muted">
        নতুন ইমেইল বা নম্বর সদস্য নিজে সেটিংস থেকে কোড দিয়ে যোগ করেন।
      </p>
    </div>
  )
}
