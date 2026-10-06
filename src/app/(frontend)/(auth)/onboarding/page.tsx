import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { AuthCard } from '@/components/auth/auth-card'
import { OnboardingForm } from '@/components/auth/onboarding-form'
import { safeNext } from '@/lib/auth/errors'
import { buildMetadata } from '@/lib/seo'
import { actionContext } from '@/server/action-context'

export const metadata: Metadata = buildMetadata({
  title: 'প্রোফাইল সম্পূর্ণ করুন',
  path: '/onboarding',
  noIndex: true,
})

type Props = { searchParams: Promise<{ next?: string }> }

/**
 * The first stop after a Google, Facebook, magic-link or phone sign-up: the member chooses ভাই or
 * বোন once. Nothing else on the site works until they do (see requireUser and ProfileGate).
 */
export default async function OnboardingPage({ searchParams }: Props) {
  const [{ next: rawNext }, { user }] = await Promise.all([searchParams, actionContext()])
  const next = safeNext(rawNext)
  if (!user) redirect(`/login?next=${encodeURIComponent(`/onboarding?next=${next}`)}`)
  if (user.gender) redirect(next)
  return (
    <AuthCard
      title="আর একটি ধাপ"
      lead={`আসসালামু আলাইকুম, ${user.name}। শুরু করার আগে জানিয়ে দিন, আপনি ভাই না বোন।`}
    >
      <OnboardingForm next={next} />
    </AuthCard>
  )
}
