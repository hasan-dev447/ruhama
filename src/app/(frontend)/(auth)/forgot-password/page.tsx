import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthCard } from '@/components/auth/auth-card'
import { ForgotPasswordForm } from '@/components/auth/recovery-forms'
import { buildMetadata } from '@/lib/seo'
import { deliveryAvailability } from '@/server/integrations'

export const metadata: Metadata = buildMetadata({
  title: 'পাসওয়ার্ড ভুলে গেছেন',
  path: '/forgot-password',
  noIndex: true,
})

export default async function ForgotPasswordPage() {
  const { email } = await deliveryAvailability()
  return (
    <AuthCard
      title="পাসওয়ার্ড ভুলে গেছেন?"
      lead="অ্যাকাউন্টের ইমেইল দিন, নতুন পাসওয়ার্ড দেওয়ার লিংক পাঠিয়ে দেব।"
    >
      {email ? (
        <ForgotPasswordForm />
      ) : (
        <p className="privacy-note" style={{ marginTop: 20 }}>
          ইমেইল পাঠানোর সেবা এখনো চালু হয়নি, তাই এখান থেকে পাসওয়ার্ড রিসেট করা যাচ্ছে না।
          সাহায্যের জন্য যোগাযোগ পাতা থেকে আমাদের জানান।
        </p>
      )}
      <p className="t-small t-muted" style={{ textAlign: 'center', marginTop: 24 }}>
        মনে পড়েছে?{' '}
        <Link href="/login" className="link" style={{ fontWeight: 600 }}>
          লগইন করুন
        </Link>
      </p>
    </AuthCard>
  )
}
