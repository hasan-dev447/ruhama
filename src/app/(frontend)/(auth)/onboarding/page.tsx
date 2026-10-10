import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { AuthCard } from '@/components/auth/auth-card'
import { OnboardingForm } from '@/components/auth/onboarding-form'
import { safeNext } from '@/lib/auth/errors'
import { bn } from '@/lib/format'
import { emailGrace, missingProfile } from '@/lib/profile-complete'
import { buildMetadata } from '@/lib/seo'
import { actionContext } from '@/server/action-context'

export const metadata: Metadata = buildMetadata({
  title: 'প্রোফাইল সম্পূর্ণ করুন',
  path: '/onboarding',
  noIndex: true,
})

type Props = { searchParams: Promise<{ next?: string }> }

/**
 * After sign-up: ভাই / বোন (required at once) and, for an account without a real email, an email
 * confirmed with a code (optional for the first days, then required; see lib/profile-complete.ts).
 * The reminder bar on every page brings such a member back here.
 */
export default async function OnboardingPage({ searchParams }: Props) {
  const [{ next: rawNext }, { user }] = await Promise.all([searchParams, actionContext()])
  const next = safeNext(rawNext)
  if (!user) redirect(`/login?next=${encodeURIComponent(`/onboarding?next=${next}`)}`)
  const missing = missingProfile(user)
  const grace = emailGrace(user)
  if (!missing.gender && !grace.needed) redirect(next)

  const email = !grace.needed ? 'none' : grace.expired ? 'required' : 'optional'
  const ask = grace.expired
    ? `আপনার অ্যাকাউন্টে ${bn(7)} দিনের মধ্যে কোনো ইমেইল যাচাই করা হয়নি, তাই অ্যাকাউন্টটি সাময়িকভাবে বন্ধ আছে। একটি ইমেইল দিয়ে কোড যাচাই করলেই আবার সব চালু হবে।`
    : missing.gender
      ? 'শুরু করার আগে জানিয়ে দিন, আপনি ভাই না বোন।'
      : `আপনার অ্যাকাউন্টে এখনো যাচাই করা ইমেইল নেই। আর ${bn(grace.daysLeft)} দিন সময় আছে।`
  return (
    <AuthCard
      title={grace.expired ? 'ইমেইল যাচাই করুন' : 'আর একটি ধাপ'}
      lead={`আসসালামু আলাইকুম, ${user.name}। ${ask}`}
    >
      <OnboardingForm
        next={next}
        needGender={missing.gender}
        email={email}
        daysLeft={grace.daysLeft}
      />
    </AuthCard>
  )
}
