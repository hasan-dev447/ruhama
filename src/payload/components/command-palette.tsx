'use client'

import { getTranslation } from '@payloadcms/translations'
import { useAuth, useConfig, useEntityVisibility, useTranslation } from '@payloadcms/ui'
import {
  Bell,
  CornerDownLeft,
  ExternalLink,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type Kind = 'open' | 'create' | 'global' | 'page' | 'site'
type Entry = {
  id: string
  label: string
  group: string
  href: string
  kind: Kind
  keywords: string
  external?: boolean
}

const RECENT_KEY = 'rh-admin-recent'

/** English words people may type for a Bangla menu, so search works in either language. */
const ALIASES: Record<string, string> = {
  articles: 'article post blog probondho prabandha',
  'ikhtilaf-topics': 'ikhtilaf difference opinion',
  questions: 'question qa answer fatwa',
  series: 'series',
  categories: 'category categories topic',
  tags: 'tag tags',
  people: 'people scholar speaker author alim',
  courses: 'course courses class',
  lessons: 'lesson lessons',
  events: 'event events majlis program',
  'event-registrations': 'registration booking seat',
  circles: 'circle halaqa local',
  videos: 'video youtube',
  playlists: 'playlist',
  media: 'media image upload file photo',
  users: 'user users member members role admin',
  'forum-threads': 'forum thread discussion',
  'forum-posts': 'forum post reply',
  reports: 'report flag abuse',
  notifications: 'notification',
  'contact-messages': 'contact message inbox',
  volunteers: 'volunteer',
  'newsletter-subscribers': 'newsletter subscriber email',
  'audit-logs': 'audit log history',
  hadiths: 'hadith',
  ayahs: 'ayah quran verse',
  surahs: 'surah quran',
  'site-settings': 'settings site config',
  'home-page': 'home homepage hero',
}

const allowed = (p: unknown) =>
  p === true ||
  (typeof p === 'object' && p !== null && (p as { permission?: boolean }).permission === true)

const normalize = (s: string) => s.toLowerCase().normalize('NFC').trim()

function score(entry: Entry, q: string) {
  if (!q) return 1
  const label = normalize(entry.label)
  if (label.startsWith(q)) return 4
  if (label.includes(q)) return 3
  if (normalize(entry.group).includes(q)) return 2
  if (entry.keywords.includes(q)) return 1.5
  return 0
}

const ICON: Record<Kind, typeof FileText> = {
  open: FileText,
  create: Plus,
  global: Settings,
  page: LayoutDashboard,
  site: ExternalLink,
}

function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

function rememberRecent(id: string) {
  try {
    const next = [id, ...readRecent().filter((r) => r !== id)].slice(0, 6)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // private mode: recents are a convenience only
  }
}

/**
 * "খুঁজুন" in the admin header and Ctrl/Cmd+K anywhere: jump to any menu, create something new or open
 * a site page. Lists exactly what the signed-in person may see (same rules as the sidebar).
 */
export function AdminCommandPalette() {
  const router = useRouter()
  const { config } = useConfig()
  const { permissions, user } = useAuth()
  const { isEntityVisible } = useEntityVisibility()
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [recent, setRecent] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const admin = config.routes.admin

  const entries = useMemo<Entry[]>(() => {
    const out: Entry[] = [
      {
        id: 'page:dashboard',
        label: 'ড্যাশবোর্ড',
        group: 'শর্টকাট',
        href: admin,
        kind: 'page',
        keywords: 'dashboard home',
      },
      {
        id: 'page:account',
        label: 'আমার অ্যাকাউন্ট',
        group: 'শর্টকাট',
        href: `${admin}/account`,
        kind: 'page',
        keywords: 'account profile',
      },
    ]
    for (const c of config.collections) {
      if (!isEntityVisible({ collectionSlug: c.slug })) continue
      const perms = permissions?.collections?.[c.slug]
      if (!allowed(perms?.read)) continue
      const group = c.admin?.group ? getTranslation(c.admin.group, i18n) : 'অন্যান্য'
      const keywords = `${c.slug} ${ALIASES[c.slug] ?? ''}`.toLowerCase()
      out.push({
        id: `open:${c.slug}`,
        label: getTranslation(c.labels.plural, i18n),
        group,
        href: `${admin}/collections/${c.slug}`,
        kind: 'open',
        keywords,
      })
      if (allowed(perms?.create)) {
        out.push({
          id: `create:${c.slug}`,
          label: `নতুন ${getTranslation(c.labels.singular, i18n)}`,
          group,
          href: `${admin}/collections/${c.slug}/create`,
          kind: 'create',
          keywords: `new create add ${keywords}`,
        })
      }
    }
    for (const g of config.globals) {
      if (!isEntityVisible({ globalSlug: g.slug })) continue
      if (!allowed(permissions?.globals?.[g.slug]?.read)) continue
      out.push({
        id: `global:${g.slug}`,
        label: getTranslation(g.label, i18n),
        group: g.admin?.group ? getTranslation(g.admin.group, i18n) : 'সেটিংস',
        href: `${admin}/globals/${g.slug}`,
        kind: 'global',
        keywords: `${g.slug} ${ALIASES[g.slug] ?? ''}`.toLowerCase(),
      })
    }
    const roles = Array.isArray(user?.role)
      ? (user.role as string[])
      : String(user?.role ?? '').split(',')
    if (roles.some((r) => ['super_admin', 'shura', 'moderator'].includes(r))) {
      out.push({
        id: 'site:moderation',
        label: 'ফোরাম মডারেশন',
        group: 'সাইট',
        href: '/forum/moderation',
        kind: 'site',
        keywords: 'moderation queue forum report',
        external: true,
      })
    }
    out.push(
      {
        id: 'site:home',
        label: 'সাইট দেখুন',
        group: 'সাইট',
        href: '/',
        kind: 'site',
        keywords: 'site view home',
        external: true,
      },
      {
        id: 'site:notifications',
        label: 'আমার নোটিফিকেশন',
        group: 'সাইট',
        href: '/notifications',
        kind: 'site',
        keywords: 'notification',
        external: true,
      },
      {
        id: 'page:logout',
        label: 'লগআউট',
        group: 'শর্টকাট',
        href: `${admin}${config.admin.routes.logout}`,
        kind: 'page',
        keywords: 'logout sign out',
      },
    )
    return out
  }, [config, permissions, isEntityVisible, i18n, user, admin])

  const q = normalize(query)
  const results = useMemo(() => {
    if (!q) {
      const byId = new Map(entries.map((e) => [e.id, e]))
      const rec = recent.map((id) => byId.get(id)).filter(Boolean) as Entry[]
      const rest = entries.filter((e) => e.kind !== 'create' && !recent.includes(e.id))
      return [...rec.map((e) => ({ ...e, group: 'সাম্প্রতিক' })), ...rest]
    }
    return entries
      .map((e) => ({ e, s: score(e, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.e)
      .slice(0, 40)
  }, [entries, q, recent])

  const show = useCallback(() => {
    setRecent(readRecent())
    setQuery('')
    setActive(0)
    setOpen(true)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (open) setOpen(false)
        else show()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, show])

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [active])

  function go(entry: Entry) {
    rememberRecent(entry.id)
    setOpen(false)
    if (entry.external) window.open(entry.href, '_blank', 'noopener')
    else router.push(entry.href)
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault()
      go(results[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)
  let lastGroup = ''

  return (
    <>
      <button
        type="button"
        className="rh-cmd-trigger"
        onClick={show}
        aria-haspopup="dialog"
        aria-label="মেনু বা কাজ খুঁজুন"
      >
        <Search size={16} aria-hidden="true" />
        <span className="rh-cmd-trigger__text">খুঁজুন…</span>
        <kbd>{isMac ? '⌘' : 'Ctrl'} K</kbd>
      </button>

      {open ? (
        <div
          className="rh-cmd-overlay"
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="rh-cmd" role="dialog" aria-modal="true" aria-label="দ্রুত খুঁজুন">
            <div className="rh-cmd__search">
              <Search size={18} aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                onKeyDown={onInputKey}
                placeholder="কী খুঁজছেন? যেমন: আর্টিকেল, নতুন মজলিস, ইউজার, settings"
                role="combobox"
                aria-expanded="true"
                aria-controls="rh-cmd-list"
                aria-activedescendant={results[active] ? `rh-cmd-${results[active].id}` : undefined}
              />
              <kbd>Esc</kbd>
            </div>
            <div className="rh-cmd__list" id="rh-cmd-list" role="listbox" ref={listRef}>
              {results.length === 0 ? (
                <p className="rh-cmd__empty">“{query}” নামে কিছু পাওয়া যায়নি।</p>
              ) : (
                results.map((entry, i) => {
                  const Icon =
                    entry.group === 'সাম্প্রতিক'
                      ? History
                      : entry.id === 'page:account'
                        ? UserRound
                        : entry.id === 'page:logout'
                          ? LogOut
                          : entry.id === 'site:moderation'
                            ? ShieldCheck
                            : entry.id === 'site:notifications'
                              ? Bell
                              : ICON[entry.kind]
                  const heading = entry.group !== lastGroup ? entry.group : null
                  lastGroup = entry.group
                  return (
                    <div key={`${entry.group}-${entry.id}`}>
                      {heading ? <div className="rh-cmd__group">{heading}</div> : null}
                      <div
                        id={`rh-cmd-${entry.id}`}
                        role="option"
                        aria-selected={i === active}
                        data-index={i}
                        className={`rh-cmd__item${i === active ? ' is-active' : ''}${entry.kind === 'create' ? ' is-create' : ''}`}
                        onMouseMove={() => setActive(i)}
                        onClick={() => go(entry)}
                      >
                        <span className="rh-cmd__icon">
                          <Icon size={16} aria-hidden="true" />
                        </span>
                        <span className="rh-cmd__label">{entry.label}</span>
                        {entry.external ? (
                          <ExternalLink size={14} className="rh-cmd__meta" aria-hidden="true" />
                        ) : null}
                        {i === active ? (
                          <CornerDownLeft size={14} className="rh-cmd__meta" aria-hidden="true" />
                        ) : null}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <div className="rh-cmd__foot">
              <span>
                <kbd>↑</kbd>
                <kbd>↓</kbd> বেছে নিন
              </span>
              <span>
                <kbd>Enter</kbd> খুলুন
              </span>
              <span>
                <kbd>Esc</kbd> বন্ধ
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
