import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthCard } from '@/components/auth/auth-card'
import { LoginForm } from '@/components/auth/login-form'
import { safeNext } from '@/lib/auth/errors'
import { deliveryAvailability, oauthAvailability } from '@/server/integrations'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({ title: 'লগইন', path: '/login', noIndex: true })

const NOTICES: Record<string, string> = {
  oauth: 'লগইন সম্পন্ন হয়নি। আবার চেষ্টা করুন অথবা অন্য পদ্ধতি বেছে নিন।',
  link: 'লগইন লিংকটির মেয়াদ শেষ বা লিংকটি আগেই ব্যবহার করা হয়েছে। নতুন লিংক নিন।',
  session: 'নিরাপত্তার জন্য আবার লগইন করুন।',
}

type Props = { searchParams: Promise<{ next?: string; mode?: string; error?: string }> }

export default async function LoginPage({ searchParams }: Props) {
  const [sp, oauth, delivery] = await Promise.all([
    searchParams,
    oauthAvailability(),
    deliveryAvailability(),
  ])
  const mode = sp.mode === 'link' || sp.mode === 'phone' ? sp.mode : 'password'
  return (
    <AuthCard title="আবার স্বাগতম" lead="আপনার যাত্রা যেখানে থেমেছিল, সেখান থেকেই শুরু করুন।">
      <LoginForm
        next={safeNext(sp.next)}
        initialMode={mode}
        google={oauth.google}
        facebook={oauth.facebook}
        email={delivery.email}
        sms={delivery.sms}
        notice={sp.error ? (NOTICES[sp.error] ?? NOTICES.oauth!) : null}
      />
      <p className="t-small t-muted" style={{ textAlign: 'center', marginTop: 24 }}>
        নতুন?{' '}
        <Link
          href={sp.next ? `/register?next=${encodeURIComponent(safeNext(sp.next))}` : '/register'}
          className="link"
          style={{ fontWeight: 600 }}
        >
          অ্যাকাউন্ট খুলুন
        </Link>
      </p>
    </AuthCard>
  )
}
