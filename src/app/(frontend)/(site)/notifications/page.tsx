import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { NotificationList } from '@/components/notifications/notification-list'
import { Breadcrumbs } from '@/components/ui/primitives'
import { buildMetadata } from '@/lib/seo'
import { actionContext } from '@/server/action-context'

export const metadata: Metadata = buildMetadata({
  title: 'নোটিফিকেশন',
  path: '/notifications',
  noIndex: true,
})

export default async function NotificationsPage() {
  const { user } = await actionContext()
  if (!user) redirect('/login?next=/notifications')
  if (!user.gender) redirect('/onboarding?next=/notifications')
  return (
    <main id="main">
      <section className="section-sm" style={{ paddingTop: 40 }}>
        <div className="rh-container">
          <Breadcrumbs
            items={[{ label: 'ড্যাশবোর্ড', href: '/dashboard' }, { label: 'নোটিফিকেশন' }]}
          />
          <NotificationList />
        </div>
      </section>
    </main>
  )
}
