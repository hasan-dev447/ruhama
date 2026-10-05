import type { Metadata } from 'next'

import { AuthCard } from '@/components/auth/auth-card'
import { ResetPasswordForm } from '@/components/auth/recovery-forms'
import { ButtonLink } from '@/components/ui/button'
import { FormAlert } from '@/components/ui/form'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'নতুন পাসওয়ার্ড',
  path: '/reset-password',
  noIndex: true,
})

type Props = { searchParams: Promise<{ token?: string; error?: string }> }

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token, error } = await searchParams
  return (
    <AuthCard title="নতুন পাসওয়ার্ড দিন">
      {token && !error ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
          <FormAlert>লিংকটির মেয়াদ শেষ বা লিংকটি সঠিক নয়। নতুন রিসেট লিংক নিন।</FormAlert>
          <ButtonLink href="/forgot-password" block>
            নতুন লিংক নিন
          </ButtonLink>
        </div>
      )}
    </AuthCard>
  )
}
