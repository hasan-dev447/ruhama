import { UserRound } from 'lucide-react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { TableOfContents } from '@/components/content/article-aids'
import {
  DeleteSection,
  LoginsSection,
  NotificationsSection,
  PrivacySection,
  ProfileSection,
  SessionsSection,
  type SettingsUser,
} from '@/components/settings/settings-sections'
import { ButtonLink } from '@/components/ui/button'
import { PageHero } from '@/components/ui/primitives'
import { features } from '@/lib/env'
import { buildMetadata } from '@/lib/seo'
import { actionContext } from '@/server/action-context'

export const metadata: Metadata = buildMetadata({
  title: 'প্রোফাইল সেটিংস',
  path: '/settings',
  noIndex: true,
})

const SECTIONS = [
  { id: 'info', text: 'ব্যক্তিগত তথ্য', level: 2 as const },
  { id: 'privacy', text: 'গোপনীয়তা', level: 2 as const },
  { id: 'logins', text: 'লগইন পদ্ধতি', level: 2 as const },
  { id: 'sessions', text: 'সক্রিয় সেশন', level: 2 as const },
  { id: 'notify', text: 'নোটিফিকেশন', level: 2 as const },
  { id: 'delete', text: 'অ্যাকাউন্ট মুছুন', level: 2 as const },
]

const pref = (
  p: { email?: boolean | null; site?: boolean | null } | null | undefined,
  email: boolean,
  site: boolean,
) => ({ email: p?.email ?? email, site: p?.site ?? site })

export default async function SettingsPage() {
  const { user } = await actionContext()
  if (!user) redirect('/login?next=/settings')

  const np = user.notificationPrefs
  const view: SettingsUser = {
    name: user.name,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    phoneNumber: user.phoneNumber ?? null,
    phoneNumberVerified: Boolean(user.phoneNumberVerified),
    district: user.district ?? null,
    bio: user.bio ?? null,
    avatarColor:
      (['teal', 'gold', 'sage', 'deep'] as const).find((c) => c === user.avatarColor) ?? 'gold',
    interests: (user.interests ?? []) as string[],
    journeyStage: user.journeyStage ?? 'kalema',
    privacy: {
      profilePublic: user.privacy?.profilePublic ?? true,
      showActivity: user.privacy?.showActivity ?? true,
      showJourney: user.privacy?.showJourney ?? true,
      discoverable: user.privacy?.discoverable ?? false,
    },
    notificationPrefs: {
      answer: pref(np?.answer, true, true),
      event: pref(np?.event, true, true),
      forum: pref(np?.forum, false, true),
      weekly: pref(np?.weekly, true, false),
      course: pref(np?.course, false, true),
    },
  }

  return (
    <main id="main">
      <PageHero
        crumbs={[{ label: 'ড্যাশবোর্ড', href: '/dashboard' }, { label: 'প্রোফাইল সেটিংস' }]}
        title="প্রোফাইল সেটিংস"
        lead="নিজের তথ্য, গোপনীয়তা, লগইন পদ্ধতি ও নোটিফিকেশন: সব এক জায়গায়।"
        style={{ padding: '40px 0' }}
      />
      <section className="section-sm" style={{ paddingBottom: 96 }}>
        <div className="rh-container">
          <div className="layout-side">
            <aside
              className="layout-side__aside sticky-col"
              aria-label="সেটিংস বিভাগ"
              style={{ maxWidth: 260 }}
            >
              <TableOfContents headings={SECTIONS} title="সেটিংস" />
              {user.username ? (
                <ButtonLink
                  href={`/members/${user.username}`}
                  variant="ghost"
                  size="sm"
                  style={{ justifyContent: 'flex-start' }}
                >
                  <UserRound className="ic" aria-hidden="true" />
                  পাবলিক প্রোফাইল দেখুন
                </ButtonLink>
              ) : null}
            </aside>
            <div
              className="layout-side__main"
              style={{ maxWidth: 820, display: 'flex', flexDirection: 'column', gap: 24 }}
            >
              <ProfileSection user={view} />
              <PrivacySection initial={view.privacy} />
              <LoginsSection
                user={view}
                google={features.google()}
                facebook={features.facebook()}
              />
              <SessionsSection />
              <NotificationsSection initial={view.notificationPrefs} />
              <DeleteSection />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
