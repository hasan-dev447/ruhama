'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSyncExternalStore } from 'react'

import { IconClose } from '@/components/icons'
import { useSession } from '@/lib/auth/client'
import { bn } from '@/lib/format'
import { emailGrace } from '@/lib/profile-complete'

const KEY = 'rh-email-reminder-hidden'
const listeners = new Set<() => void>()

function hiddenNow() {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

function hide() {
  try {
    sessionStorage.setItem(KEY, '1')
  } catch {
    // storage blocked: it simply shows again on the next page
  }
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/**
 * A bar on every page for an account still without a confirmed email (Facebook sign-up without
 * one): how many days are left and a link to add it. It can be hidden for this visit; once the
 * days are up the account is held at /onboarding instead (ProfileGate).
 */
export function EmailReminder() {
  const { data } = useSession()
  const pathname = usePathname()
  const hidden = useSyncExternalStore(subscribe, hiddenNow, () => true)
  const user = data?.user
  if (!user || hidden || pathname.startsWith('/onboarding')) return null
  const grace = emailGrace(user as { email?: string; createdAt?: string | Date })
  if (!grace.needed || grace.expired) return null

  return (
    <div className="email-reminder" role="status">
      <span>
        আপনার অ্যাকাউন্টে যাচাই করা ইমেইল নেই।{' '}
        {grace.daysLeft > 1 ? `আর ${bn(grace.daysLeft)} দিনের` : 'আজকের'} মধ্যে ইমেইল যোগ করে যাচাই
        না করলে অ্যাকাউন্ট সাময়িকভাবে বন্ধ থাকবে।
      </span>
      <Link href={`/onboarding?next=${encodeURIComponent(pathname)}`}>ইমেইল যোগ করুন</Link>
      <button type="button" onClick={hide} aria-label="এই বার্তা লুকান">
        <IconClose className="ic ic-sm" aria-hidden="true" />
      </button>
    </div>
  )
}
