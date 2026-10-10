'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import {
  addContactAction,
  confirmContactAction,
  makePrimaryContactAction,
  removeContactAction,
} from '@/actions/settings'
import type { ActionResult } from '@/actions/types'
import { IconAdd, IconInfo, IconMail, IconMobile } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/form'
import { authClient } from '@/lib/auth/client'
import { bn } from '@/lib/format'
import type { ContactKind, ContactList, ContactView } from '@/server/services/contacts'

const LABEL: Record<ContactKind, { one: string; add: string; placeholder: string; type: string }> =
  {
    email: {
      one: 'ইমেইল',
      add: 'আরেকটি ইমেইল যোগ করুন',
      placeholder: 'you@example.com',
      type: 'email',
    },
    phone: {
      one: 'মোবাইল নম্বর',
      add: 'আরেকটি মোবাইল নম্বর যোগ করুন',
      placeholder: '01XXXXXXXXX',
      type: 'tel',
    },
  }

const show = (kind: ContactKind, value: string) =>
  kind === 'phone' ? bn(value.replace(/^\+88/, '')) : value

/** One kind (emails or numbers): the list, and adding one with a code. */
function ContactGroup({
  kind,
  items,
  canAdd,
  run,
  pending,
}: {
  kind: ContactKind
  items: ContactView[]
  /** the matching service (email or SMS) can deliver a code */
  canAdd: boolean
  run: (fn: () => Promise<ActionResult<ContactList>>, done?: string) => Promise<boolean>
  pending: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [value, setValue] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const l = LABEL[kind]

  async function send(target: string) {
    const ok = await run(
      () => addContactAction({ kind, value: target }),
      kind === 'email' ? 'ইমেইলে কোড পাঠানো হয়েছে' : 'SMS-এ কোড পাঠানো হয়েছে',
    )
    if (ok) {
      setSentTo(target)
      setCode('')
    }
  }
  async function confirm() {
    if (!sentTo) return
    const ok = await run(
      () => confirmContactAction({ kind, value: sentTo, code }),
      `${l.one} যাচাই হয়েছে`,
    )
    if (ok) {
      setSentTo(null)
      setAdding(false)
      setValue('')
      setCode('')
    }
  }

  return (
    <div className="contact-group">
      <h3 className="t-h4" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {kind === 'email' ? <IconMail className="ic" /> : <IconMobile className="ic" />}
        {kind === 'email' ? 'ইমেইল' : 'মোবাইল নম্বর'}
      </h3>
      {items.length ? (
        <ul className="list-reset">
          {items.map((c) => (
            <li key={c.value} className="setting-row contact-row">
              <div style={{ minWidth: 0 }}>
                <strong className="contact-row__value">{show(kind, c.value)}</strong>
                <div className="contact-row__badges">
                  {c.primary ? <Badge variant="verified">প্রধান</Badge> : null}
                  {c.verified ? null : <Badge variant="neutral">যাচাই বাকি</Badge>}
                </div>
              </div>
              <div className="contact-row__actions">
                {!c.primary && c.verified ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () => makePrimaryContactAction({ kind, value: c.value }),
                        `প্রধান ${l.one} বদলানো হয়েছে`,
                      )
                    }
                  >
                    প্রধান করুন
                  </Button>
                ) : null}
                {!c.verified && !c.primary && canAdd ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      setAdding(true)
                      void send(c.value)
                    }}
                  >
                    যাচাই করুন
                  </Button>
                ) : null}
                {c.primary && kind === 'email' && !c.verified && canAdd ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={async () => {
                      const { error } = await authClient.sendVerificationEmail({
                        email: c.value,
                        callbackURL: '/settings#contacts',
                      })
                      if (error) toast.error('লিংক পাঠানো যায়নি')
                      else toast.success('যাচাইয়ের লিংক ইমেইলে পাঠানো হয়েছে')
                    }}
                  >
                    যাচাইয়ের লিংক পাঠান
                  </Button>
                ) : null}
                {!(c.primary && kind === 'email') ? (
                  <Button
                    variant="dangerGhost"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      if (!window.confirm(`${show(kind, c.value)} সরিয়ে দেবেন?`)) return
                      void run(() => removeContactAction({ kind, value: c.value }), 'সরানো হয়েছে')
                    }}
                  >
                    মুছুন
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="t-small t-muted">কোনো {l.one} যুক্ত নেই।</p>
      )}

      {canAdd ? (
        adding ? (
          <div className="contact-add">
            {sentTo ? (
              <>
                <p className="t-small">
                  <strong>{show(kind, sentTo)}</strong>-এ পাঠানো ৬ অঙ্কের কোডটি লিখুন।
                </p>
                <div className="contact-add__row">
                  <Input
                    aria-label="যাচাইয়ের কোড"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    style={{ maxWidth: 160 }}
                  />
                  <Button
                    size="sm"
                    onClick={confirm}
                    pending={pending}
                    disabled={code.length !== 6}
                  >
                    যাচাই করুন
                  </Button>
                  <Button variant="ghost" size="sm" disabled={pending} onClick={() => send(sentTo)}>
                    আবার পাঠান
                  </Button>
                </div>
              </>
            ) : (
              <Field label={l.add} htmlFor={`add-${kind}`}>
                <div className="contact-add__row">
                  <Input
                    id={`add-${kind}`}
                    type={l.type}
                    inputMode={kind === 'phone' ? 'tel' : 'email'}
                    placeholder={l.placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                  <Button
                    size="sm"
                    pending={pending}
                    disabled={!value.trim()}
                    onClick={() => send(value)}
                  >
                    কোড পাঠান
                  </Button>
                </div>
              </Field>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAdding(false)
                setSentTo(null)
                setValue('')
              }}
            >
              বাতিল
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <IconAdd className="ic" />
            {l.add}
          </Button>
        )
      ) : (
        <p className="t-caption t-muted">
          {kind === 'email'
            ? 'ইমেইল পাঠানোর সেবা চালু হলে এখান থেকে নতুন ইমেইল যোগ করা যাবে।'
            : 'SMS সেবা চালু হলে এখান থেকে নতুন নম্বর যোগ করা যাবে।'}
        </p>
      )}
    </div>
  )
}

/**
 * Emails and mobile numbers on the account, like Facebook's: each new one is confirmed with a code,
 * any confirmed one signs in, and one of each is primary.
 */
export function ContactsSection({
  initial,
  email,
  sms,
}: {
  initial: ContactList
  email: boolean
  sms: boolean
}) {
  const [list, setList] = useState(initial)
  const [pending, start] = useTransition()

  function run(fn: () => Promise<ActionResult<ContactList>>, done?: string) {
    return new Promise<boolean>((resolve) =>
      start(async () => {
        const res = await fn()
        if (!res.ok) {
          toast.error(res.error)
          resolve(false)
          return
        }
        setList(res.data)
        if (done) toast.success(done)
        resolve(true)
      }),
    )
  }

  return (
    <section id="contacts" className="card card-pad settings-section" aria-labelledby="s-contacts">
      <h2 id="s-contacts" className="t-h3">
        ইমেইল ও মোবাইল নম্বর
      </h2>
      <p className="t-small t-muted" style={{ marginTop: 6 }}>
        যাচাই করা যেকোনো ইমেইল বা নম্বর দিয়ে লগইন করা যায়। গুরুত্বপূর্ণ বার্তা যায় প্রধান
        ঠিকানায়।
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginTop: 18 }}>
        <ContactGroup kind="email" items={list.emails} canAdd={email} run={run} pending={pending} />
        <ContactGroup kind="phone" items={list.phones} canAdd={sms} run={run} pending={pending} />
      </div>
      <div className="privacy-note" style={{ marginTop: 18 }}>
        <IconInfo className="ic" />
        <span>আপনার ইমেইল ও নম্বর কখনো প্রোফাইলে বা অন্য কাউকে দেখানো হয় না।</span>
      </div>
    </section>
  )
}
