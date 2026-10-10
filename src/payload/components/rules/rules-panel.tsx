'use client'

import { toast } from '@payloadcms/ui'
import Link from 'next/link'
import { useEffect, useId, useState } from 'react'

import { IconChevronDown, IconLock, IconSettings } from '@/components/icons'
import {
  COLLECTION_RULES,
  resolveRules,
  type RuleDef,
  type RulesFor,
  type RuleValue,
} from '@/lib/collection-rules'
import { ROLE_LABELS, STAFF_ROLES, type Role } from '@/lib/roles'

type Loaded = { values: RulesFor; canEdit: boolean }

const same = (a: RuleValue | undefined, b: RuleValue | undefined) =>
  JSON.stringify(Array.isArray(a) ? [...a].sort() : a) ===
  JSON.stringify(Array.isArray(b) ? [...b].sort() : b)

/** A short line for the closed panel, e.g. "অনুমোদন: 2 জন · নিজে অনুমোদন: বন্ধ · প্রকাশ: শূরা". */
function summary(defs: RuleDef[], values: RulesFor) {
  return defs
    .slice(0, 3)
    .map((d) => {
      const v = values[d.key]
      let text: string
      if (d.type === 'number') text = `${v} ${d.unit ?? ''}`.trim()
      else if (d.type === 'boolean') text = v ? 'চালু' : 'বন্ধ'
      else text = (v as Role[]).map((r) => ROLE_LABELS[r]).join(', ')
      return `${d.short}: ${text}`
    })
    .join(' · ')
}

/**
 * "এই মেনুর নিয়ম" at the top of an admin list (and on the নিয়মাবলি page): this menu's adjustable
 * rules (lib/collection-rules.ts), closed until clicked. শূরা and super admin change them; other staff
 * see them. The server cleans and enforces every value; this is only the form.
 */
export function RulesPanel({ slug, defaultOpen = false }: { slug: string; defaultOpen?: boolean }) {
  const meta = COLLECTION_RULES[slug]
  const [open, setOpen] = useState(defaultOpen)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [draft, setDraft] = useState<RulesFor | null>(null)
  const [saving, setSaving] = useState(false)
  const bodyId = useId()

  useEffect(() => {
    if (!meta) return
    let alive = true
    fetch(`/api/v1/rules/${slug}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Loaded | null) => {
        if (!alive || !d) return
        setLoaded(d)
        setDraft(d.values)
      })
      .catch(() => null)
    return () => {
      alive = false
    }
  }, [slug, meta])

  if (!meta || !loaded || !draft) return null
  const defaults = resolveRules(slug, {})
  const editable = meta.rules.filter((d) => !d.managedByRoles)
  const dirty = editable.some((d) => !same(draft[d.key], loaded.values[d.key]))
  const set = (key: string, value: RuleValue) => setDraft((v) => ({ ...v!, [key]: value }))

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/rules/${slug}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ values: draft }),
      })
      const json = (await res.json().catch(() => null)) as
        (Loaded & { error?: { message?: string } }) | null
      if (!res.ok || !json) throw new Error(json?.error?.message ?? 'সংরক্ষণ করা যায়নি')
      setLoaded(json)
      setDraft(json.values)
      toast.success('নিয়ম সংরক্ষিত হয়েছে। এখন থেকেই কার্যকর।')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={open ? 'rh-rules is-open' : 'rh-rules'}>
      <button
        type="button"
        className="rh-rules__head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
      >
        <IconSettings size={17} aria-hidden="true" />
        <strong>{meta.title}</strong>
        <span className="rh-rules__summary">{summary(meta.rules, loaded.values)}</span>
        <IconChevronDown size={17} className="rh-rules__chev" aria-hidden="true" />
      </button>

      <div className="rh-rules__wrap" id={bodyId} aria-hidden={!open}>
        <div className="rh-rules__inner">
          <ul className="rh-rules__list">
            {meta.rules.map((d) => (
              <li key={d.key}>
                <div className="rh-rules__text">
                  <span className="rh-rules__label">
                    {d.label}
                    {!d.managedByRoles && !same(draft[d.key], defaults[d.key]) ? (
                      <span className="rh-rules__changed">বদলানো</span>
                    ) : null}
                  </span>
                  {d.help ? <span className="rh-rules__help">{d.help}</span> : null}
                </div>
                {d.managedByRoles ? (
                  <ManagedRoles roles={(loaded.values[d.key] as Role[]) ?? []} />
                ) : (
                  <RuleControl
                    def={d}
                    value={draft[d.key]!}
                    disabled={!loaded.canEdit || !open}
                    onChange={(v) => set(d.key, v)}
                  />
                )}
              </li>
            ))}
          </ul>
          {loaded.canEdit ? (
            <div className="rh-rules__foot">
              <button
                type="button"
                className="rh-int-btn rh-int-btn--ghost"
                disabled={!open || editable.every((d) => same(draft[d.key], defaults[d.key]))}
                onClick={() =>
                  setDraft((v) => ({
                    ...v!,
                    ...Object.fromEntries(editable.map((d) => [d.key, defaults[d.key]])),
                  }))
                }
              >
                শুরুর মানে ফেরান
              </button>
              <button
                type="button"
                className="rh-int-btn rh-int-btn--ghost"
                disabled={!open || !dirty}
                onClick={() => setDraft(loaded.values)}
              >
                বাতিল
              </button>
              <button
                type="button"
                className="rh-int-btn rh-rules__save"
                disabled={!open || !dirty || saving}
                onClick={() => void save()}
              >
                {saving ? 'সংরক্ষণ হচ্ছে...' : 'নিয়ম সংরক্ষণ করুন'}
              </button>
            </div>
          ) : (
            <p className="rh-rules__note">
              <IconLock size={14} aria-hidden="true" /> নিয়ম বদলানোর অনুমতি আপনার নেই (“রোল ও
              অনুমতি” পাতায় “নিয়মাবলি” মেনুর অনুমতি দেখুন)।
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

/** Reviewers and publishers: chosen per role on the রোল ও অনুমতি page, shown here for reference. */
function ManagedRoles({ roles }: { roles: Role[] }) {
  return (
    <div className="rh-rules__managed">
      <div className="rh-rules__roles" aria-label="যাদের অনুমতি আছে">
        {roles.map((r) => (
          <span key={r} className="rh-rules__role is-on is-static">
            {ROLE_LABELS[r]}
          </span>
        ))}
      </div>
      <Link href="/admin/globals/role-permissions" className="rh-rules__managed-link">
        রোল ও অনুমতি পাতায় বদলান
      </Link>
    </div>
  )
}

function RuleControl({
  def,
  value,
  disabled,
  onChange,
}: {
  def: RuleDef
  value: RuleValue
  disabled: boolean
  onChange: (v: RuleValue) => void
}) {
  if (def.type === 'number') {
    const n = value as number
    const clamp = (x: number) => Math.min(def.max, Math.max(def.min, Math.round(x) || 0))
    return (
      <div className="rh-rules__number">
        <button
          type="button"
          disabled={disabled || n <= def.min}
          onClick={() => onChange(clamp(n - 1))}
          aria-label="কমান"
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={def.min}
          max={def.max}
          value={n}
          disabled={disabled}
          aria-label={def.label}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
        />
        <button
          type="button"
          disabled={disabled || n >= def.max}
          onClick={() => onChange(clamp(n + 1))}
          aria-label="বাড়ান"
        >
          +
        </button>
        {def.unit ? <span className="rh-rules__unit">{def.unit}</span> : null}
      </div>
    )
  }
  if (def.type === 'boolean') {
    const on = value as boolean
    return (
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={def.label}
        disabled={disabled}
        className={`rh-inline-switch${on ? ' is-on' : ''}`}
        onClick={() => onChange(!on)}
      >
        <span className="rh-inline-switch__track" aria-hidden="true">
          <span className="rh-inline-switch__thumb" />
        </span>
        {on ? 'চালু' : 'বন্ধ'}
      </button>
    )
  }
  const roles = value as Role[]
  return (
    <div className="rh-rules__roles" role="group" aria-label={def.label}>
      {(def.choices ?? STAFF_ROLES).map((r) => {
        const locked = def.required?.includes(r)
        const on = roles.includes(r)
        return (
          <button
            key={r}
            type="button"
            aria-pressed={on}
            disabled={disabled || locked}
            title={locked ? 'এটি সবসময় থাকবে' : undefined}
            className={on ? 'rh-rules__role is-on' : 'rh-rules__role'}
            onClick={() => onChange(on ? roles.filter((x) => x !== r) : [...roles, r])}
          >
            {locked ? <IconLock size={12} aria-hidden="true" /> : null}
            {ROLE_LABELS[r]}
          </button>
        )
      })}
    </div>
  )
}
