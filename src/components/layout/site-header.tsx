'use client'

import {
  IconBell,
  IconChevronDown,
  IconChevronNext,
  IconClose,
  IconDashboard,
  IconLogout,
  IconMenu,
  IconNext,
  IconSearch,
  IconSettings,
  IconShield,
  IconUser,
} from '@/components/icons'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { NotifIcon } from '@/components/notifications/notif-icon'
import { UserAvatar } from '@/components/ui/user-avatar'
import { handleMenuKeys, useDismiss } from '@/hooks/use-dismiss'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsPreview,
} from '@/hooks/use-notifications'
import { signOut, useSession, type ClientSession } from '@/lib/auth/client'
import { bn, formatRelative } from '@/lib/format'
import { journeyLabel } from '@/lib/journey'
import { useAbilities } from '@/components/auth/use-abilities'
import { MAIN_NAV, activeNavKey } from '@/lib/site'
import { cn } from '@/lib/utils'

import { BrandLink } from './brand-link'
import { ThemeToggle, ThemeToggleRow } from './theme-toggle'

type SessionUser = ClientSession['user']

function useCompactHeader() {
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const onScroll = () => setCompact((window.scrollY || document.documentElement.scrollTop) > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return compact
}

/**
 * Signs out and returns to the home page. A failed request
 * (offline, server not responding, or a browser extension that blocks it) shows a message instead
 * of breaking the page; the member is still signed in and can try again.
 */
function useLogout() {
  const router = useRouter()
  return useCallback(async () => {
    try {
      const { error } = await signOut()
      if (error) throw new Error(error.message)
    } catch {
      toast.error('লগআউট করা যায়নি', {
        description: 'ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।',
      })
      return
    }
    router.push('/')
    router.refresh()
  }, [router])
}

export function SiteHeader() {
  const pathname = usePathname() ?? '/'
  const active = activeNavKey(pathname)
  const compact = useCompactHeader()
  // open menus belong to the page they were opened on, so they close on navigation without an effect
  const [ui, setUi] = useState<{ path: string; menu: boolean; panel: 'none' | 'notif' | 'user' }>({
    path: pathname,
    menu: false,
    panel: 'none',
  })
  const current =
    ui.path === pathname ? ui : { path: pathname, menu: false, panel: 'none' as const }
  const menuOpen = current.menu
  const panel = current.panel
  const setMenuOpen = (open: boolean) => setUi({ ...current, menu: open })
  const setPanel = (
    next: 'none' | 'notif' | 'user' | ((p: 'none' | 'notif' | 'user') => 'none' | 'notif' | 'user'),
  ) => setUi({ ...current, panel: typeof next === 'function' ? next(current.panel) : next })
  const { data: session, isPending } = useSession()
  const user = session?.user ?? null

  return (
    <>
      <header className={cn('site-header', compact && 'is-compact')}>
        <div className="rh-container site-header__inner">
          <BrandLink />
          <nav className="site-nav" aria-label="প্রধান মেনু">
            {MAIN_NAV.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={cn('nav-link', active === item.key && 'is-active')}
                aria-current={active === item.key ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="site-header__actions">
            <Link href="/search" className="btn-icon" aria-label="খুঁজুন">
              <IconSearch className="ic" aria-hidden="true" />
            </Link>
            <ThemeToggle />
            <div className="hdr-auth-slot">
              {isPending ? (
                <span
                  className="sk only-desktop-nav"
                  style={{ width: 76, height: 44, borderRadius: 10 }}
                  aria-hidden="true"
                />
              ) : user ? (
                <>
                  <NotificationsPanel
                    userId={user.id}
                    open={panel === 'notif'}
                    onToggle={() => setPanel((p) => (p === 'notif' ? 'none' : 'notif'))}
                    onClose={() => setPanel('none')}
                  />
                  <UserMenu
                    user={user}
                    open={panel === 'user'}
                    onToggle={() => setPanel((p) => (p === 'user' ? 'none' : 'user'))}
                    onClose={() => setPanel('none')}
                  />
                </>
              ) : (
                <Link
                  href={`/login?next=${encodeURIComponent(pathname)}`}
                  className="btn btn-secondary btn-sm only-desktop-nav"
                  style={{ marginLeft: 6 }}
                >
                  লগইন
                </Link>
              )}
            </div>
            <MobileDrawer
              open={menuOpen}
              onOpenChange={setMenuOpen}
              active={active}
              user={user}
              pathname={pathname}
            />
          </div>
        </div>
      </header>
      <div className="site-header__spacer" />
    </>
  )
}

function NotificationsPanel({
  userId,
  open,
  onToggle,
  onClose,
}: {
  userId: string
  open: boolean
  onToggle: () => void
  onClose: () => void
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  useDismiss(open, onClose, triggerRef)
  const { data, isLoading } = useNotificationsPreview(userId)
  const markOne = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()
  const router = useRouter()
  const unread = data?.unreadCount ?? 0
  const label = unread ? `নোটিফিকেশন, ${bn(unread)}টি অপঠিত` : 'নোটিফিকেশন'

  return (
    <div className="hdr-pop">
      <button
        ref={triggerRef}
        type="button"
        className="btn-icon"
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={onToggle}
      >
        <IconBell className="ic" aria-hidden="true" />
        {unread > 0 && <span className="count-badge">{bn(unread > 9 ? '9+' : unread)}</span>}
      </button>
      {open && (
        <>
          <button
            type="button"
            className="dd-scrim"
            aria-label="প্যানেল বন্ধ করুন"
            onClick={onClose}
          />
          <div className="dropdown" role="dialog" aria-label="নোটিফিকেশন">
            <div className="dropdown__head">
              <strong style={{ fontFamily: 'var(--rh-font-heading)', fontSize: 17 }}>
                নোটিফিকেশন
              </strong>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => markAll.mutate()}
                disabled={unread === 0}
                style={{ padding: '0 10px', fontSize: 14 }}
              >
                সব পড়া হয়েছে
              </button>
            </div>
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="notif-item" aria-hidden="true">
                    <span className="sk" style={{ width: 38, height: 38, borderRadius: '50%' }} />
                    <span className="notif-item__text">
                      <span className="sk" style={{ height: 14, width: '90%' }} />
                      <span className="sk" style={{ height: 12, width: '40%', marginTop: 6 }} />
                    </span>
                  </div>
                ))}
              {!isLoading && data?.docs.length === 0 && (
                <div className="empty" style={{ padding: '32px 16px' }}>
                  <span className="empty__icon">
                    <IconBell className="ic ic-lg" aria-hidden="true" />
                  </span>
                  <p className="t-small t-muted">এখনো কোনো নোটিফিকেশন নেই।</p>
                </div>
              )}
              {data?.docs.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={cn('notif-item', !n.read && 'is-unread')}
                  onClick={() => {
                    if (!n.read) markOne.mutate(n.id)
                    if (n.link) {
                      onClose()
                      router.push(n.link)
                    }
                  }}
                >
                  <NotifIcon kind={n.kind} />
                  <span className="notif-item__text">
                    <p>{n.text}</p>
                    <time dateTime={n.createdAt}>{formatRelative(n.createdAt)}</time>
                  </span>
                  {!n.read && <span className="unread-dot" aria-label="অপঠিত" />}
                </button>
              ))}
            </div>
            <div className="dropdown__foot">
              <Link href="/notifications" className="link-arrow" onClick={onClose}>
                সব নোটিফিকেশন দেখুন <IconNext className="ic" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function UserMenu({
  user,
  open,
  onToggle,
  onClose,
}: {
  user: SessionUser
  open: boolean
  onToggle: () => void
  onClose: () => void
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  useDismiss(open, onClose, triggerRef)
  const logout = useLogout()
  const { admin: isStaff, moderate: isModerator } = useAbilities(user)

  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  }, [open])

  return (
    <div className="hdr-pop only-desktop-nav" style={{ marginLeft: 6 }}>
      <button
        ref={triggerRef}
        type="button"
        className="avatar-btn"
        aria-label="অ্যাকাউন্ট মেনু"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={onToggle}
      >
        <UserAvatar name={user.name} image={user.image} tone="gold" />
        <IconChevronDown className="ic ic-sm" aria-hidden="true" />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="dd-scrim"
            aria-label="মেনু বন্ধ করুন"
            onClick={onClose}
          />
          <div
            ref={menuRef}
            className="dropdown dropdown--menu"
            role="menu"
            aria-label="অ্যাকাউন্ট মেনু"
            onKeyDown={handleMenuKeys}
          >
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                padding: '10px 12px 14px',
                marginBottom: 6,
                borderBottom: '1px solid var(--rh-border)',
              }}
            >
              <UserAvatar name={user.name} image={user.image} tone="gold" />
              <div style={{ minWidth: 0 }}>
                <strong style={{ display: 'block', lineHeight: 1.4 }}>{user.name}</strong>
                <span className="t-caption t-muted">
                  যাত্রার ধাপ: {journeyLabel(user.journeyStage)}
                </span>
              </div>
            </div>
            <Link
              href={user.username ? `/members/${user.username}` : '/settings'}
              className="menu-item"
              role="menuitem"
              onClick={onClose}
            >
              <IconUser className="ic" aria-hidden="true" />
              প্রোফাইল
            </Link>
            <Link href="/dashboard" className="menu-item" role="menuitem" onClick={onClose}>
              <IconDashboard className="ic" aria-hidden="true" />
              ড্যাশবোর্ড
            </Link>
            <Link href="/settings" className="menu-item" role="menuitem" onClick={onClose}>
              <IconSettings className="ic" aria-hidden="true" />
              সেটিংস
            </Link>
            {isModerator && (
              <Link
                href="/forum/moderation"
                className="menu-item"
                role="menuitem"
                onClick={onClose}
              >
                <IconShield className="ic" aria-hidden="true" />
                মডারেশন কিউ
              </Link>
            )}
            {isStaff && (
              <Link href="/admin" prefetch={false} className="menu-item" role="menuitem">
                <IconDashboard className="ic" aria-hidden="true" />
                অ্যাডমিন প্যানেল
              </Link>
            )}
            <div style={{ height: 1, background: 'var(--rh-border)', margin: '6px 4px' }} />
            <button
              type="button"
              className="menu-item menu-item--danger"
              role="menuitem"
              onClick={logout}
            >
              <IconLogout className="ic" aria-hidden="true" />
              লগআউট
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function MobileDrawer({
  open,
  onOpenChange,
  active,
  user,
  pathname,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  active: string | null
  user: SessionUser | null
  pathname: string
}) {
  const logout = useLogout()
  const close = () => onOpenChange(false)
  // the same links as the desktop account menu, by the রোল ও অনুমতি page
  const { admin: isStaff, moderate: isModerator } = useAbilities(user)
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger asChild>
        <button type="button" className="btn-icon only-mobile-nav" aria-label="মেনু খুলুন">
          <IconMenu className="ic ic-lg" />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="drawer-scrim" />
        <DialogPrimitive.Content className="drawer" aria-describedby={undefined}>
          <DialogPrimitive.Title className="sr-only">মোবাইল মেনু</DialogPrimitive.Title>
          <div className="drawer__top">
            <BrandLink onClick={close} />
            <DialogPrimitive.Close className="btn-icon" aria-label="মেনু বন্ধ করুন">
              <IconClose className="ic ic-lg" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <nav
            aria-label="মোবাইল মেনু"
            style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            {MAIN_NAV.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={cn('drawer__link', active === item.key && 'is-active')}
                aria-current={active === item.key ? 'page' : undefined}
                onClick={close}
              >
                {item.label} <IconChevronNext className="ic" aria-hidden="true" />
              </Link>
            ))}
          </nav>
          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              paddingTop: 16,
              borderTop: '1px solid var(--rh-border)',
            }}
          >
            <ThemeToggleRow />
            {user ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    padding: '6px 4px 10px',
                  }}
                >
                  <UserAvatar name={user.name} image={user.image} tone="gold" />
                  <div>
                    <strong style={{ display: 'block', lineHeight: 1.4 }}>{user.name}</strong>
                    <span className="t-caption t-muted">
                      যাত্রার ধাপ: {journeyLabel(user.journeyStage)}
                    </span>
                  </div>
                </div>
                <Link
                  href={user.username ? `/members/${user.username}` : '/settings'}
                  className="menu-item"
                  onClick={close}
                >
                  প্রোফাইল
                </Link>
                <Link href="/dashboard" className="menu-item" onClick={close}>
                  ড্যাশবোর্ড
                </Link>
                <Link href="/notifications" className="menu-item" onClick={close}>
                  নোটিফিকেশন
                </Link>
                <Link href="/settings" className="menu-item" onClick={close}>
                  সেটিংস
                </Link>
                {isModerator ? (
                  <Link href="/forum/moderation" className="menu-item" onClick={close}>
                    মডারেশন কিউ
                  </Link>
                ) : null}
                {isStaff ? (
                  <Link href="/admin" prefetch={false} className="menu-item" onClick={close}>
                    অ্যাডমিন প্যানেল
                  </Link>
                ) : null}
                <button type="button" className="menu-item menu-item--danger" onClick={logout}>
                  লগআউট
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/login?next=${encodeURIComponent(pathname)}`}
                  className="btn btn-secondary btn-block"
                  onClick={close}
                >
                  লগইন
                </Link>
                <Link href="/join" className="btn btn-primary btn-block" onClick={close}>
                  যুক্ত হোন
                </Link>
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
