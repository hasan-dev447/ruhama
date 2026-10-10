'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { cancelPublicProfileAction, savePublicProfileAction } from '@/actions/settings'
import { IconAdd, IconClose, IconExternal } from '@/components/icons'
import { Button, ButtonLink } from '@/components/ui/button'
import { Field, FormAlert, Input, Textarea } from '@/components/ui/form'
import { formatRelative } from '@/lib/format'

import { Card } from './settings-sections'

type Values = {
  name: string
  title: string
  specialty: string
  bio: string
  location: string
  education: { degree: string; institution: string }[]
  expertise: string[]
}

export type PublicProfileState = {
  values: Values
  pending: Values | null
  pendingAt: string | null
  requireApproval: boolean
  active: boolean
  publicPath: string | null
}

/**
 * "পাবলিক প্রোফাইল": for members an admin gave a profile role (আলিম, বক্তা, লেখক, রিভিউয়ার).
 * They write their own page under আলিম, লেখক ও বক্তা here; by the people menu's rule it may wait
 * for approval before it shows on the site.
 */
export function PublicProfileSection({ initial }: { initial: PublicProfileState }) {
  const router = useRouter()
  // continue from the waiting version when there is one
  const start = initial.pending ?? initial.values
  const [v, setV] = useState<Values>(start)
  const [expertise, setExpertise] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, run] = useTransition()
  const set = <K extends keyof Values>(k: K, value: Values[K]) =>
    setV((x) => ({ ...x, [k]: value }))

  function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    run(async () => {
      const res = await savePublicProfileAction({
        ...v,
        education: v.education.filter((x) => x.degree.trim()),
      })
      if (!res.ok) return setError(res.error)
      toast.success(
        res.data?.pending
          ? 'জমা হয়েছে। অনুমোদনের পর সাইটে দেখাবে।'
          : 'সংরক্ষিত হয়েছে, এখন সাইটে দেখা যাচ্ছে।',
      )
      router.refresh()
    })
  }

  function cancelPending() {
    run(async () => {
      const res = await cancelPublicProfileAction()
      if (!res.ok) return setError(res.error)
      setV(initial.values)
      toast.success('অপেক্ষমাণ পরিবর্তন ফেরত নেওয়া হয়েছে')
      router.refresh()
    })
  }

  function addExpertise() {
    const t = expertise.trim()
    if (!t || v.expertise.includes(t) || v.expertise.length >= 12) return
    set('expertise', [...v.expertise, t])
    setExpertise('')
  }

  return (
    <Card
      id="public-profile"
      title="পাবলিক প্রোফাইল"
      action={
        initial.publicPath && initial.active ? (
          <ButtonLink
            href={initial.publicPath}
            target="_blank"
            rel="noopener"
            variant="ghost"
            size="sm"
          >
            <IconExternal className="ic" aria-hidden="true" /> সাইটে দেখুন
          </ButtonLink>
        ) : null
      }
    >
      <p className="t-small t-muted" style={{ margin: '8px 0 16px' }}>
        “আলিম, লেখক ও বক্তা” তালিকায় আপনার পরিচিতি। আপনার লেখা, রিভিউ ও আলোচনার পাশে এটি দেখায়।
        {initial.requireApproval ? ' পরিবর্তন সাইটে যাওয়ার আগে টিম একবার দেখে অনুমোদন দেয়।' : ''}
      </p>

      {!initial.active ? (
        <FormAlert>
          আপনার প্রোফাইল এখন সাইটে লুকানো আছে। প্রয়োজনে অ্যাডমিন টিমের সাথে যোগাযোগ করুন।
        </FormAlert>
      ) : null}

      {initial.pendingAt ? (
        <div className="profile-pending" role="status">
          <span>
            আপনার পরিবর্তন <strong>অনুমোদনের অপেক্ষায়</strong> ({formatRelative(initial.pendingAt)}{' '}
            জমা)। এখন সাইটে আগের সংস্করণ দেখাচ্ছে। চাইলে আরও বদলে আবার জমা দিতে পারেন।
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={cancelPending}
            disabled={pending}
          >
            ফেরত নিন
          </Button>
        </div>
      ) : null}

      <form onSubmit={save} className="public-profile-form" noValidate>
        {error ? <FormAlert>{error}</FormAlert> : null}
        <div className="form-grid">
          <Field label="নাম (যেভাবে দেখাবে)" htmlFor="pp-name" required>
            <Input id="pp-name" value={v.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="পদবি" htmlFor="pp-title" hint="যেমন: মুহাদ্দিস, খতিব, শিক্ষক">
            <Input id="pp-title" value={v.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <Field
            label="বিশেষ ক্ষেত্র (এক লাইনে)"
            htmlFor="pp-spec"
            hint="যেমন: হাদিস ও উলুমুল হাদিস"
          >
            <Input
              id="pp-spec"
              value={v.specialty}
              onChange={(e) => set('specialty', e.target.value)}
            />
          </Field>
          <Field label="অবস্থান" htmlFor="pp-loc" hint="যেমন: খুলনা">
            <Input
              id="pp-loc"
              value={v.location}
              onChange={(e) => set('location', e.target.value)}
            />
          </Field>
        </div>
        <Field
          label="পরিচিতি"
          htmlFor="pp-bio"
          hint="নিজের সম্পর্কে কয়েক লাইন: পড়াশোনা, কাজ, আগ্রহ।"
        >
          <Textarea
            id="pp-bio"
            rows={5}
            value={v.bio}
            onChange={(e) => set('bio', e.target.value)}
          />
        </Field>

        <fieldset className="pp-group">
          <legend className="label">শিক্ষা ও প্রশিক্ষণ</legend>
          {v.education.map((e, i) => (
            <div key={i} className="pp-row">
              <Input
                aria-label="ডিগ্রি"
                placeholder="ডিগ্রি, যেমন: দাওরায়ে হাদিস"
                value={e.degree}
                onChange={(ev) =>
                  set(
                    'education',
                    v.education.map((x, j) => (j === i ? { ...x, degree: ev.target.value } : x)),
                  )
                }
              />
              <Input
                aria-label="প্রতিষ্ঠান"
                placeholder="প্রতিষ্ঠান"
                value={e.institution}
                onChange={(ev) =>
                  set(
                    'education',
                    v.education.map((x, j) =>
                      j === i ? { ...x, institution: ev.target.value } : x,
                    ),
                  )
                }
              />
              <button
                type="button"
                className="pp-remove"
                aria-label="সরান"
                onClick={() =>
                  set(
                    'education',
                    v.education.filter((_, j) => j !== i),
                  )
                }
              >
                <IconClose className="ic ic-sm" aria-hidden="true" />
              </button>
            </div>
          ))}
          {v.education.length < 10 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => set('education', [...v.education, { degree: '', institution: '' }])}
            >
              <IconAdd className="ic" aria-hidden="true" /> শিক্ষা যোগ করুন
            </Button>
          ) : null}
        </fieldset>

        <fieldset className="pp-group">
          <legend className="label">বিশেষজ্ঞতা</legend>
          <div className="pp-chips">
            {v.expertise.map((x) => (
              <span key={x} className="pp-chip">
                {x}
                <button
                  type="button"
                  aria-label={`${x} সরান`}
                  onClick={() =>
                    set(
                      'expertise',
                      v.expertise.filter((y) => y !== x),
                    )
                  }
                >
                  <IconClose className="ic ic-sm" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
          <div className="pp-row">
            <Input
              aria-label="নতুন বিশেষজ্ঞতা"
              placeholder="যেমন: ফিকহ, তাফসীর"
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addExpertise()
                }
              }}
            />
            <Button type="button" variant="secondary" size="sm" onClick={addExpertise}>
              যোগ করুন
            </Button>
          </div>
        </fieldset>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button type="submit" pending={pending}>
            {initial.requireApproval ? 'অনুমোদনের জন্য জমা দিন' : 'সংরক্ষণ করুন'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
