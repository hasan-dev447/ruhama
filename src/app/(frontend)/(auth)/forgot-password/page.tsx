import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthCard } from '@/components/auth/auth-card'
import { ForgotPasswordForm } from '@/components/auth/recovery-forms'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'পাসওয়ার্ড ভুলে গেছেন',
  path: '/forgot-password',
  noIndex: true,
})

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="পাসওয়ার্ড ভুলে গেছেন?"
      lead="অ্যাকাউন্টের ইমেইল দিন, নতুন পাসওয়ার্ড দেওয়ার লিংক পাঠিয়ে দেব।"
    >
      <ForgotPasswordForm />
      <p className="t-small t-muted" style={{ textAlign: 'center', marginTop: 24 }}>
        মনে পড়েছে?{' '}
        <Link href="/login" className="link" style={{ fontWeight: 600 }}>
          লগইন করুন
        </Link>
      </p>
    </AuthCard>
  )
}
