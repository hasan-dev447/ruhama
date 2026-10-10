'use client'

import { toast } from '@payloadcms/ui'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  IconAdd,
  IconCheck,
  IconChevronDown,
  IconClose,
  IconHistory,
  IconInfo,
  IconLock,
  IconSearch,
  IconShield,
  IconUsers,
} from '@/components/icons'
import {
  ABILITIES,
  defaultAbility,
  defaultLevel,
  entersAdmin,
  LEVEL_LABELS,
  levelRank,
  MENUS,
  publishKey,
  reviewKey,
  ROLE_INFO,
  roleAbility,
  roleLevel,
  type Level,
  type MenuDef,
  type PermissionMatrix,
  type WorkflowFallback,
} from '@/lib/permissions'
import { ROLE_LABELS, ROLES, type Role } from '@/lib/roles'

type Me = {
  id: number
  roles: Role[]
  isSuper: boolean
  canManage: boolean
  canAssign: boolean
  levels: Record<string, Level>
  abilities: Record<string, boolean>
}
type Overview = {
  me: Me
  matrix: PermissionMatrix
  fallback: WorkflowFallback
  counts: Record<Role, number>
}
type Draft = { menus: Record<string, Level>; abilities: Record<string, boolean> }
type Member = {
  id: number
  name: string
  contact: string | null
  username: string | null
  image: string | null
  roles: Role[]
}

const GROUPS = [...new Set(MENUS.map((m) => m.group))]

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    credentials: 'include',
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })
  const json = (await res.json().catch(() => null)) as (T & { error?: { message?: string } }) | null
  if (!res.ok || !json) throw new Error(json?.error?.message ?? 'কাজটি করা যায়নি')
  return json
}

function effective(o: Overview, role: Role): Draft {
  return {
    menus: Object.fromEntries(MENUS.map((m) => [m.slug, roleLevel(o.matrix, role, m.slug)])),
    abilities: Object.fromEntries(
      allKeys().map((k) => [k, roleAbility(o.matrix, role, k, o.fallback)]),
    ),
  }
}

const allKeys = () => [
  ...ABILITIES.map((a) => a.key),
  ...MENUS.filter((m) => m.workflow).flatMap((m) => [reviewKey(m.slug), publishKey(m.slug)]),
]

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

/**
 * রোল ও অনুমতি: pick a role on the left, then set what it may do in each menu (with levels such as
 * দেখা, নিজের, এডিট, সম্পূর্ণ) and its special duties, or give the role to people. The server checks
 * every change again (server/services/roles.ts).
 */
export function RoleManager() {
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<Role>('shura')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [tab, setTab] = useState<'perms' | 'members'>('perms')
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('')

  const load = useCallback(async (keepRole?: Role) => {
    try {
      const o = await api<Overview>('/roles')
      setData(o)
      setError(null)
      const r = keepRole ?? 'shura'
      setDraft(effective(o, r))
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading the page's data once
    void load()
  }, [load])

  const base = useMemo(() => (data ? effective(data, role) : null), [data, role])
  const changes = useMemo(() => {
    if (!draft || !base) return 0
    return (
      MENUS.filter((m) => draft.menus[m.slug] !== base.menus[m.slug]).length +
      allKeys().filter((k) => draft.abilities[k] !== base.abilities[k]).length
    )
  }, [draft, base])

  if (error)
    return (
      <div className="rh-roles">
        <p className="rh-roles__error">
          <IconLock size={16} aria-hidden="true" /> {error}
        </p>
      </div>
    )
  if (!data || !draft || !base)
    return <div className="rh-roles rh-roles--loading">লোড হচ্ছে...</div>

  const { me } = data
  const editable = role !== 'super_admin' && (me.isSuper || (me.canManage && role !== 'shura'))

  function pick(r: Role) {
    if (r === role) return
    if (changes && !window.confirm('সংরক্ষণ না করা পরিবর্তন বাদ যাবে। অন্য রোলে যাবেন?')) return
    setRole(r)
    setDraft(effective(data!, r))
  }

  async function save() {
    setSaving(true)
    try {
      const res = await api<{ changed: number }>(`/roles/${role}`, {
        method: 'PUT',
        body: JSON.stringify(draft),
      })
      toast.success(
        res.changed
          ? `${ROLE_LABELS[role]} রোলের ${res.changed}টি অনুমতি বদলানো হয়েছে। এখন থেকেই কার্যকর।`
          : 'কিছু বদলায়নি।',
      )
      await load(role)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  function resetToDefault() {
    setDraft({
      menus: Object.fromEntries(MENUS.map((m) => [m.slug, defaultLevel(role, m.slug)])),
      abilities: Object.fromEntries(
        allKeys().map((k) => [k, defaultAbility(role, k, data!.fallback)]),
      ),
    })
  }

  const draftMatrix: PermissionMatrix = { ...data.matrix, [role]: draft }
  const opensAdmin = entersAdmin(draftMatrix, [role], data.fallback)
  const menuCount = MENUS.filter((m) => draft.menus[m.slug] !== 'none').length
  const q = filter.trim().toLowerCase()

  return (
    <div className="rh-roles">
      <div className="rh-roles__intro">
        <IconInfo size={18} aria-hidden="true" />
        <div>
          <strong>
            আপনি{' '}
            {me.isSuper
              ? 'সুপার অ্যাডমিন: সব রোলের অনুমতি ও সবার রোল বদলাতে পারেন।'
              : me.canManage
                ? 'অন্য রোলের অনুমতি বদলাতে পারেন, তবে নিজের যতটুকু অনুমতি তার বেশি নয়। শূরা ও সুপার অ্যাডমিনের অনুমতি শুধু সুপার অ্যাডমিন বদলান।'
                : 'রোল দিতে ও সরাতে পারেন; অনুমতি বদলানো যায় শুধু দেখার জন্য।'}
          </strong>
          <span>
            কারও একাধিক রোল থাকলে প্রতিটি মেনুতে সবচেয়ে বেশি অনুমতিটি পান। অনুমতি সরালে আগের কাজ
            (যেমন প্রকাশিত লেখায় রিভিউয়ারের নাম) যেমন আছে তেমনই থাকে, শুধু এখন থেকে আর পারবেন না।
          </span>
        </div>
      </div>

      <div className="rh-roles__layout">
        <nav className="rh-roles__list" aria-label="রোল">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              className={`rh-roles__role tone-${ROLE_INFO[r].tone}${r === role ? ' is-active' : ''}`}
              aria-current={r === role ? 'true' : undefined}
              onClick={() => pick(r)}
            >
              <span className="rh-roles__role-dot" aria-hidden="true">
                {r === 'super_admin' ? <IconShield size={15} /> : initials(ROLE_LABELS[r])}
              </span>
              <span className="rh-roles__role-text">
                <strong>{ROLE_LABELS[r]}</strong>
                <span>{data.counts[r] ?? 0} জন</span>
              </span>
              {r === 'super_admin' || (r === 'shura' && !me.isSuper) ? (
                <IconLock size={13} className="rh-roles__role-lock" aria-hidden="true" />
              ) : null}
            </button>
          ))}
        </nav>

        <section className="rh-roles__panel" aria-label={`${ROLE_LABELS[role]} রোল`}>
          <header className="rh-roles__head">
            <div>
              <h2>{ROLE_LABELS[role]}</h2>
              <p>{ROLE_INFO[role].description}</p>
            </div>
            <div className="rh-roles__facts">
              <span className={opensAdmin ? 'is-yes' : 'is-no'}>
                {opensAdmin ? <IconCheck size={13} /> : <IconClose size={13} />} অ্যাডমিন প্যানেল
              </span>
              <span>{role === 'super_admin' ? 'সব মেনু' : `${menuCount}টি মেনু`}</span>
            </div>
          </header>

          <div className="rh-roles__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'perms'}
              className={tab === 'perms' ? 'is-active' : ''}
              onClick={() => setTab('perms')}
            >
              <IconShield size={15} aria-hidden="true" /> অনুমতি
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'members'}
              className={tab === 'members' ? 'is-active' : ''}
              onClick={() => setTab('members')}
            >
              <IconUsers size={15} aria-hidden="true" /> সদস্য ({data.counts[role] ?? 0})
            </button>
          </div>

          {tab === 'perms' ? (
            role === 'super_admin' ? (
              <div className="rh-roles__locked">
                <IconLock size={20} aria-hidden="true" />
                <p>
                  সুপার অ্যাডমিনের সব মেনুতে সম্পূর্ণ অনুমতি থাকে, বদলানো যায় না। এতে সাইট কখনো
                  তালাবদ্ধ হয়ে যায় না।
                </p>
              </div>
            ) : (
              <>
                {!editable ? (
                  <p className="rh-roles__readonly">
                    <IconLock size={14} aria-hidden="true" />{' '}
                    {role === 'shura'
                      ? 'শূরার অনুমতি শুধু সুপার অ্যাডমিন বদলাতে পারেন। আপনি দেখতে পারছেন।'
                      : 'অনুমতি বদলানোর অনুমতি আপনার নেই। আপনি দেখতে পারছেন।'}
                  </p>
                ) : null}

                <label className="rh-roles__filter">
                  <IconSearch size={15} aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="মেনু খুঁজুন, যেমন: প্রবন্ধ"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </label>

                <Legend />

                {GROUPS.map((g) => {
                  const menus = MENUS.filter(
                    (m) => m.group === g && (!q || m.label.toLowerCase().includes(q)),
                  )
                  if (!menus.length) return null
                  return (
                    <Group
                      key={g}
                      title={g}
                      count={menus.filter((m) => draft.menus[m.slug] !== 'none').length}
                      total={menus.length}
                      forceOpen={Boolean(q)}
                    >
                      {menus.map((m) => (
                        <MenuRow
                          key={m.slug}
                          menu={m}
                          role={role}
                          draft={draft}
                          base={base}
                          me={me}
                          editable={editable}
                          fallback={data.fallback}
                          onLevel={(l) =>
                            setDraft((d) => ({ ...d!, menus: { ...d!.menus, [m.slug]: l } }))
                          }
                          onAbility={(k, on) =>
                            setDraft((d) => ({ ...d!, abilities: { ...d!.abilities, [k]: on } }))
                          }
                        />
                      ))}
                    </Group>
                  )
                })}

                {!q ? (
                  <Group
                    title="বিশেষ দায়িত্ব"
                    count={ABILITIES.filter((a) => draft.abilities[a.key]).length}
                    total={ABILITIES.length}
                    forceOpen
                  >
                    {ABILITIES.map((a) => {
                      const on = draft.abilities[a.key]
                      const blocked = !me.isSuper && !on && !me.abilities[a.key]
                      return (
                        <div key={a.key} className="rh-roles__ability">
                          <div className="rh-roles__ability-text">
                            <strong>
                              {a.label}
                              {on !== base.abilities[a.key] ? <Changed /> : null}
                            </strong>
                            <span>{a.hint}</span>
                          </div>
                          <Switch
                            on={on}
                            label={a.label}
                            disabled={!editable || blocked}
                            title={
                              blocked ? 'যে দায়িত্ব আপনার নিজের নেই, তা দিতে পারবেন না' : undefined
                            }
                            onChange={(v) =>
                              setDraft((d) => ({
                                ...d!,
                                abilities: { ...d!.abilities, [a.key]: v },
                              }))
                            }
                          />
                        </div>
                      )
                    })}
                  </Group>
                ) : null}

                {editable ? (
                  <div className={`rh-roles__savebar${changes ? ' is-dirty' : ''}`}>
                    <span>
                      {changes ? `${changes}টি পরিবর্তন সংরক্ষণ করা হয়নি` : 'সব সংরক্ষিত'}
                    </span>
                    <button
                      type="button"
                      className="rh-int-btn rh-int-btn--ghost"
                      onClick={resetToDefault}
                    >
                      <IconHistory size={14} aria-hidden="true" /> শুরুর মানে ফেরান
                    </button>
                    <button
                      type="button"
                      className="rh-int-btn rh-int-btn--ghost"
                      disabled={!changes}
                      onClick={() => setDraft(base)}
                    >
                      বাতিল
                    </button>
                    <button
                      type="button"
                      className="rh-int-btn rh-roles__save"
                      disabled={!changes || saving}
                      onClick={() => void save()}
                    >
                      {saving ? 'সংরক্ষণ হচ্ছে...' : 'অনুমতি সংরক্ষণ করুন'}
                    </button>
                  </div>
                ) : null}
              </>
            )
          ) : (
            <Members key={role} role={role} me={me} onChanged={() => void load(role)} />
          )}
        </section>
      </div>
    </div>
  )
}

function Changed() {
  return <span className="rh-roles__changed" title="শুরুর মান থেকে বদলানো" />
}

function Legend() {
  return (
    <details className="rh-roles__legend">
      <summary>অনুমতির ধাপগুলো কী বোঝায়?</summary>
      <ul>
        {(['none', 'view', 'own', 'add', 'edit', 'full'] as Level[]).map((l) => (
          <li key={l}>
            <strong>{LEVEL_LABELS[l].label}</strong> {LEVEL_LABELS[l].hint}
          </li>
        ))}
      </ul>
    </details>
  )
}

function Group({
  title,
  count,
  total,
  forceOpen,
  children,
}: {
  title: string
  count: number
  total: number
  forceOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  const isOpen = forceOpen || open
  return (
    <div className={`rh-roles__group${isOpen ? ' is-open' : ''}`}>
      <button
        type="button"
        className="rh-roles__group-head"
        aria-expanded={isOpen}
        onClick={() => setOpen((o) => !o)}
      >
        <strong>{title}</strong>
        <span>
          {count}/{total}
        </span>
        <IconChevronDown size={16} aria-hidden="true" />
      </button>
      {isOpen ? <div className="rh-roles__group-body">{children}</div> : null}
    </div>
  )
}

function MenuRow({
  menu,
  role,
  draft,
  base,
  me,
  editable,
  fallback,
  onLevel,
  onAbility,
}: {
  menu: MenuDef
  role: Role
  draft: Draft
  base: Draft
  me: Me
  editable: boolean
  fallback: WorkflowFallback
  onLevel: (l: Level) => void
  onAbility: (key: string, on: boolean) => void
}) {
  const level = draft.menus[menu.slug]
  const changed = level !== base.menus[menu.slug]
  const mine = me.levels[menu.slug] ?? 'none'
  const hint = level === 'own' && menu.ownHint ? menu.ownHint : LEVEL_LABELS[level].hint
  return (
    <div className={`rh-roles__menu${level === 'none' ? ' is-off' : ''}`}>
      <div className="rh-roles__menu-text">
        <strong>
          {menu.label}
          {changed ? <Changed /> : null}
          {level !== defaultLevel(role, menu.slug) && !changed ? (
            <span className="rh-roles__custom">বদলানো</span>
          ) : null}
        </strong>
        <span>{hint}</span>
      </div>
      <div className="rh-roles__seg" role="radiogroup" aria-label={`${menu.label}: অনুমতি`}>
        {menu.levels.map((l) => {
          const above = !me.isSuper && levelRank(l) > levelRank(mine) && l !== base.menus[menu.slug]
          return (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={l === level}
              className={`lv-${l}${l === level ? ' is-on' : ''}`}
              disabled={!editable || above}
              title={above ? 'নিজের অনুমতির চেয়ে বেশি দেওয়া যায় না' : LEVEL_LABELS[l].hint}
              onClick={() => onLevel(l)}
            >
              {LEVEL_LABELS[l].label}
            </button>
          )
        })}
      </div>
      {menu.workflow ? (
        <div className="rh-roles__wf">
          {(
            [
              [reviewKey(menu.slug), 'রিভিউ করতে পারবেন', 'অনুমোদন বা সংশোধনের অনুরোধ'],
              [publishKey(menu.slug), 'প্রকাশ করতে পারবেন', 'চূড়ান্ত প্রকাশ ও প্রকাশ বাতিল'],
            ] as const
          ).map(([key, label, sub]) => {
            const on = draft.abilities[key]
            const blocked = !me.isSuper && !on && !me.abilities[key]
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                className={`rh-roles__chip${on ? ' is-on' : ''}`}
                disabled={!editable || blocked}
                title={blocked ? 'যে দায়িত্ব আপনার নিজের নেই, তা দিতে পারবেন না' : sub}
                onClick={() => onAbility(key, !on)}
              >
                {on ? (
                  <IconCheck size={13} aria-hidden="true" />
                ) : (
                  <IconAdd size={13} aria-hidden="true" />
                )}
                {label}
                {on !== base.abilities[key] ? <Changed /> : null}
                {on !== defaultAbility(role, key, fallback) && on === base.abilities[key] ? (
                  <span className="rh-roles__custom">বদলানো</span>
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function Switch({
  on,
  label,
  disabled,
  title,
  onChange,
}: {
  on: boolean
  label: string
  disabled?: boolean
  title?: string
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      title={title}
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

/** People holding the role: add by search, remove, and see what one person may do. */
function Members({ role, me, onChanged }: { role: Role; me: Me; onChanged: () => void }) {
  const [list, setList] = useState<{
    docs: Member[]
    totalDocs: number
    hasNextPage: boolean
  } | null>(null)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [found, setFound] = useState<Member[]>([])
  const [busy, setBusy] = useState<number | null>(null)
  const [openId, setOpenId] = useState<number | null>(null)

  const canTouchRole = me.isSuper || (me.canAssign && role !== 'super_admin' && role !== 'shura')

  const fetchPage = useCallback(
    async (p: number) => {
      const res = await api<{ docs: Member[]; totalDocs: number; hasNextPage: boolean }>(
        `/roles/${role}/members?page=${p}`,
      )
      setList((cur) => (p === 1 || !cur ? res : { ...res, docs: [...cur.docs, ...res.docs] }))
      setPage(p)
    },
    [role],
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the role's people, once per role
    void fetchPage(1).catch((e) => toast.error((e as Error).message))
  }, [fetchPage])

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) return
    const t = setTimeout(() => {
      api<{ docs: Member[] }>(`/roles/users?q=${encodeURIComponent(term)}`)
        .then((r) => setFound(r.docs))
        .catch(() => setFound([]))
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  async function change(member: Member, add: boolean) {
    if (
      !add &&
      !window.confirm(
        `${member.name}-এর “${ROLE_LABELS[role]}” রোল সরাবেন? তাঁর আগের কাজ যেমন আছে থাকবে।`,
      )
    )
      return
    setBusy(member.id)
    try {
      await api('/roles/assign', {
        method: 'POST',
        body: JSON.stringify({ userId: member.id, role, add }),
      })
      toast.success(
        add
          ? `${member.name} এখন ${ROLE_LABELS[role]}`
          : `${member.name}-এর ${ROLE_LABELS[role]} রোল সরানো হয়েছে`,
      )
      setQ('')
      setFound([])
      await fetchPage(1)
      onChanged()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const shownFound = q.trim().length >= 2 ? found : []
  const touchable = (m: Member) =>
    me.isSuper || !(m.roles.includes('super_admin') || m.roles.includes('shura'))

  return (
    <div className="rh-roles__members">
      {canTouchRole && me.canAssign ? (
        <div className="rh-roles__add">
          <label className="rh-roles__filter">
            <IconSearch size={15} aria-hidden="true" />
            <input
              type="search"
              placeholder="নাম, ইউজারনেম, ইমেইল বা মোবাইল দিয়ে খুঁজে রোল দিন"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          {shownFound.length ? (
            <ul className="rh-roles__found">
              {shownFound.map((m) => {
                const has = m.roles.includes(role)
                return (
                  <li key={m.id}>
                    <Person m={m} />
                    <button
                      type="button"
                      className="rh-int-btn"
                      disabled={has || busy === m.id || !touchable(m) || m.id === me.id}
                      title={
                        m.id === me.id
                          ? 'নিজের রোল নিজে বদলানো যায় না'
                          : !touchable(m)
                            ? 'সুপার অ্যাডমিন বা শূরার রোল শুধু সুপার অ্যাডমিন বদলাতে পারেন'
                            : undefined
                      }
                      onClick={() => void change(m, true)}
                    >
                      {has ? 'আগে থেকেই আছে' : `${ROLE_LABELS[role]} বানান`}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : q.trim().length >= 2 ? (
            <p className="rh-roles__hint">কাউকে পাওয়া যায়নি।</p>
          ) : null}
        </div>
      ) : (
        <p className="rh-roles__readonly">
          <IconLock size={14} aria-hidden="true" />{' '}
          {role === 'super_admin' || role === 'shura'
            ? `${ROLE_LABELS[role]} রোল শুধু সুপার অ্যাডমিন দিতে বা সরাতে পারেন।`
            : 'রোল দেওয়া বা সরানোর অনুমতি আপনার নেই।'}
        </p>
      )}

      {!list ? (
        <p className="rh-roles__hint">লোড হচ্ছে...</p>
      ) : !list.docs.length ? (
        <p className="rh-roles__empty">এই রোলে এখনো কেউ নেই।</p>
      ) : (
        <ul className="rh-roles__people">
          {list.docs.map((m) => (
            <li key={m.id} className={openId === m.id ? 'is-open' : ''}>
              <div className="rh-roles__person-row">
                <button
                  type="button"
                  className="rh-roles__person-open"
                  aria-expanded={openId === m.id}
                  onClick={() => setOpenId((id) => (id === m.id ? null : m.id))}
                  title="এই সদস্য কী কী পারেন"
                >
                  <Person m={m} />
                </button>
                <div className="rh-roles__person-roles">
                  {m.roles
                    .filter((r) => r !== role)
                    .map((r) => (
                      <span key={r} className="rh-roles__pill">
                        {ROLE_LABELS[r]}
                      </span>
                    ))}
                </div>
                <a
                  className="rh-roles__icon-btn"
                  href={`/admin/collections/users/${m.id}`}
                  title="ইউজারের পাতা"
                  aria-label={`${m.name}: ইউজারের পাতা`}
                >
                  <IconUsers size={15} aria-hidden="true" />
                </a>
                {canTouchRole && me.canAssign && role !== 'member' ? (
                  <button
                    type="button"
                    className="rh-roles__icon-btn is-danger"
                    disabled={busy === m.id || m.id === me.id || !touchable(m)}
                    title={
                      m.id === me.id
                        ? 'নিজের রোল নিজে সরানো যায় না'
                        : `${ROLE_LABELS[role]} রোল সরান`
                    }
                    aria-label={`${m.name}-এর ${ROLE_LABELS[role]} রোল সরান`}
                    onClick={() => void change(m, false)}
                  >
                    <IconClose size={15} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
              {openId === m.id ? <PersonAccess id={m.id} /> : null}
            </li>
          ))}
        </ul>
      )}
      {list?.hasNextPage ? (
        <button
          type="button"
          className="rh-int-btn rh-int-btn--ghost rh-roles__more"
          onClick={() => void fetchPage(page + 1)}
        >
          আরও দেখুন ({list.totalDocs - list.docs.length} জন বাকি)
        </button>
      ) : null}
    </div>
  )
}

function Person({ m }: { m: Member }) {
  return (
    <span className="rh-roles__person">
      <span className="rh-roles__avatar" aria-hidden="true">
        {m.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- a small avatar from the media host
          <img src={m.image} alt="" />
        ) : (
          initials(m.name)
        )}
      </span>
      <span className="rh-roles__person-text">
        <strong>{m.name}</strong>
        <span>{[m.username ? `@${m.username}` : null, m.contact].filter(Boolean).join(' · ')}</span>
      </span>
    </span>
  )
}

/** "এই সদস্য কী পারেন": every menu the person reaches through all their roles. */
function PersonAccess({ id }: { id: number }) {
  const [data, setData] = useState<{
    levels: Record<string, Level>
    abilities: Record<string, boolean>
  } | null>(null)
  useEffect(() => {
    let alive = true
    api<{ levels: Record<string, Level>; abilities: Record<string, boolean> }>(`/roles/users/${id}`)
      .then((d) => alive && setData(d))
      .catch(() => null)
    return () => {
      alive = false
    }
  }, [id])
  if (!data) return <p className="rh-roles__hint">লোড হচ্ছে...</p>
  const menus = MENUS.filter((m) => data.levels[m.slug] !== 'none')
  const abilities = [
    ...ABILITIES.filter((a) => data.abilities[a.key]).map((a) => a.label),
    ...MENUS.filter((m) => m.workflow).flatMap((m) => [
      ...(data.abilities[reviewKey(m.slug)] ? [`${m.label} রিভিউ`] : []),
      ...(data.abilities[publishKey(m.slug)] ? [`${m.label} প্রকাশ`] : []),
    ]),
  ]
  return (
    <div className="rh-roles__access">
      <p>সব রোল মিলিয়ে এই সদস্য যা পারেন:</p>
      {menus.length ? (
        <ul>
          {menus.map((m) => (
            <li key={m.slug}>
              {m.label}{' '}
              <span className={`lv lv-${data.levels[m.slug]}`}>
                {LEVEL_LABELS[data.levels[m.slug]].label}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rh-roles__hint">অ্যাডমিন প্যানেলের কোনো মেনু নেই।</p>
      )}
      {abilities.length ? <p className="rh-roles__abil">দায়িত্ব: {abilities.join(', ')}</p> : null}
    </div>
  )
}
