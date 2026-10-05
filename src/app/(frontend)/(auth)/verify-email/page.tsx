import { CircleCheck } from 'lucide-react'
import type { Metadata } from 'next'

import { AuthCard } from '@/components/auth/auth-card'
import { ResendVerificationForm } from '@/components/auth/recovery-forms'
import { ButtonLink } from '@/components/ui/button'
import { FormAlert } from '@/components/ui/form'
import { safeNext } from '@/lib/auth/errors'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'ইমেইল যাচাই',
  path: '/verify-email',
  noIndex: true,
})

type Props = { searchParams: Promise<{ error?: string; next?: string }> }

/** Better Auth sends people here after the verification link (already signed in on success). */
export default async function VerifyEmailPage({ searchParams }: Props) {
  const { error, next } = await searchParams
  if (error) {
    return (
      <AuthCard title="যাচাই সম্পন্ন হয়নি">
        <div style={{ marginTop: 20 }}>
          <FormAlert>
            লিংকটির মেয়াদ শেষ বা লিংকটি আগেই ব্যবহার করা হয়েছে। নিচে ইমেইল দিয়ে নতুন লিংক নিন।
          </FormAlert>
        </div>
        <ResendVerificationForm />
      </AuthCard>
    )
  }
  return (
    <AuthCard title="আহলান ওয়া সাহলান!">
      <div className="empty" role="status" style={{ padding: '24px 0 8px' }}>
        <span
          className="empty__icon"
          style={{ background: 'var(--rh-success-soft)', color: 'var(--rh-success)' }}
        >
          <CircleCheck className="ic ic-lg" aria-hidden="true" />
        </span>
        <h2 className="t-h4">ইমেইল যাচাই সম্পন্ন</h2>
        <p className="t-small t-muted">
          আপনার অ্যাকাউন্ট এখন চালু। যাত্রার প্রথম ধাপ থেকে শুরু করুন, ইনশাআল্লাহ।
        </p>
        <ButtonLink href={safeNext(next)}>এগিয়ে যান</ButtonLink>
      </div>
    </AuthCard>
  )
}
