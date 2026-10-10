import { IconUser } from '@/components/icons'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { isProfileIncomplete } from '@/lib/profile-complete'

import { TableOfContents } from '@/components/content/article-aids'
import { ContactsSection } from '@/components/settings/contact-settings'
import { PublicProfileSection } from '@/components/settings/public-profile-section'
import {
  CoverSection,
  PrivacySection,
  type CoverState,
  type PrivacyState,
} from '@/components/settings/profile-settings'
import {
  DeleteSection,
  LoginsSection,
  NotificationsSection,
  ProfileSection,
  SessionsSection,
  type SettingsUser,
} from '@/components/settings/settings-sections'
import { ButtonLink } from '@/components/ui/button'
import { PageHero } from '@/components/ui/primitives'
import { deliveryAvailability, oauthAvailability } from '@/server/integrations'
import { buildMetadata } from '@/lib/seo'
import { readPrivacy } from '@/lib/profile-privacy'
import { actionContext } from '@/server/action-context'
import { listContacts } from '@/server/services/contacts'
import { getMyPublicProfile } from '@/server/services/public-profile'
import { membersByIds } from '@/server/services/profile'

export const metadata: Metadata = buildMetadata({
  title: 'প্রোফাইল সেটিংস',
  path: '/settings',
  noIndex: true,
})

const SECTIONS = [
  { id: 'profile', text: 'ব্যক্তিগত তথ্য', level: 2 as const },
  { id: 'cover', text: 'প্রোফাইলের কভার', level: 2 as const },
  { id: 'privacy', text: 'গোপনীয়তা', level: 2 as const },
  { id: 'contacts', text: 'ইমেইল ও মোবাইল', level: 2 as const },
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
  const ctx = await actionContext()
  const { user } = ctx
  if (!user) redirect('/login?next=/settings')
  if (isProfileIncomplete(user)) redirect('/onboarding?next=/settings')
  const privacy = readPrivacy(user.privacy)
  const [oauth, delivery, viewers, contacts, publicProfile] = await Promise.all([
    oauthAvailability(),
    deliveryAvailability(),
    membersByIds(ctx, privacy.allowedViewers),
    listContacts(ctx),
    getMyPublicProfile(ctx),
  ])
  const avatar = user.avatar && typeof user.avatar === 'object' ? user.avatar : null
  const [ayahSurah, ayahNumber] = (user.cover?.ayahKey ?? '1:1').split(':').map(Number)
  const [hadithBook, hadithNumber] = (user.cover?.hadithKey ?? 'bukhari:1').split(':')
  const cover: CoverState = {
    kind: (user.cover?.kind as CoverState['kind']) ?? 'none',
    surah: ayahSurah || 1,
    ayah: ayahNumber || 1,
    book: hadithBook || 'bukhari',
    number: Number(hadithNumber) || 1,
    text: user.cover?.text ?? '',
    source: user.cover?.source ?? '',
  }
  const privacyState: PrivacyState = {
    ...privacy,
    discoverable: user.privacy?.discoverable ?? false,
    viewers,
  }

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
    gender: user.gender ?? null,
    photo:
      user.gender === 'male' ? (avatar?.sizes?.md?.url ?? avatar?.url ?? user.image ?? null) : null,
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
              <TableOfContents
                headings={
                  publicProfile
                    ? [
                        SECTIONS[0]!,
                        { id: 'public-profile', text: 'পাবলিক প্রোফাইল', level: 2 as const },
                        ...SECTIONS.slice(1),
                      ]
                    : SECTIONS
                }
                title="সেটিংস"
              />
              {user.username ? (
                <ButtonLink
                  href={`/members/${user.username}`}
                  variant="ghost"
                  size="sm"
                  style={{ justifyContent: 'flex-start' }}
                >
                  <IconUser className="ic" aria-hidden="true" />
                  পাবলিক প্রোফাইল দেখুন
                </ButtonLink>
              ) : null}
            </aside>
            <div
              className="layout-side__main"
              style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
            >
              <ProfileSection user={view} />
              {publicProfile ? <PublicProfileSection initial={publicProfile} /> : null}
              <CoverSection initial={cover} />
              <PrivacySection initial={privacyState} />
              <ContactsSection initial={contacts} email={delivery.email} sms={delivery.sms} />
              <LoginsSection user={view} google={oauth.google} facebook={oauth.facebook} />
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
