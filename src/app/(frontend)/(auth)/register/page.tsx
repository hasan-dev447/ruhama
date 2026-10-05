import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthCard } from '@/components/auth/auth-card'
import { RegisterForm } from '@/components/auth/register-form'
import { safeNext } from '@/lib/auth/errors'
import { features } from '@/lib/env'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'অ্যাকাউন্ট খুলুন',
  path: '/register',
  noIndex: true,
})

type Props = { searchParams: Promise<{ next?: string }> }

export default async function RegisterPage({ searchParams }: Props) {
  const next = safeNext((await searchParams).next)
  return (
    <AuthCard
      title="নতুন অ্যাকাউন্ট খুলুন"
      lead="কোর্সের অগ্রগতি, সংরক্ষিত প্রবন্ধ ও আপনার যাত্রা এক জায়গায়।"
      wide
      brandWord={false}
    >
      <RegisterForm next={next} google={features.google()} facebook={features.facebook()} />
      <p className="t-small t-muted" style={{ textAlign: 'center', marginTop: 24 }}>
        আগে থেকেই অ্যাকাউন্ট আছে?{' '}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="link"
          style={{ fontWeight: 600 }}
        >
          লগইন করুন
        </Link>
      </p>
    </AuthCard>
  )
}
