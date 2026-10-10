import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { ModerationQueue } from '@/components/forum/moderation-queue'
import { PageHero } from '@/components/ui/primitives'
import { buildMetadata } from '@/lib/seo'
import { actionContext } from '@/server/action-context'
import { can } from '@/server/permissions'

export const metadata: Metadata = buildMetadata({
  title: 'মডারেশন কিউ',
  path: '/forum/moderation',
  noIndex: true,
})

/** Moderators only; everyone else gets a plain 404. */
export default async function ModerationPage() {
  const { user } = await actionContext()
  if (!user) redirect('/login?next=/forum/moderation')
  if (!(await can(user, 'forum.moderate'))) notFound()
  return (
    <main id="main">
      <PageHero
        crumbs={[{ label: 'আলোচনা ফোরাম', href: '/forum' }, { label: 'মডারেশন কিউ' }]}
        title="মডারেশন কিউ"
        lead="স্বয়ংক্রিয়ভাবে আটকে থাকা ও রিপোর্ট হওয়া পোস্ট। প্রথমে সতর্ক, প্রয়োজনে সাময়িক স্থগিত, তারপর অপসারণ।"
        style={{ padding: '40px 0' }}
      />
      <section className="section-sm" style={{ paddingBottom: 96 }}>
        <div className="rh-container">
          <ModerationQueue />
        </div>
      </section>
    </main>
  )
}
