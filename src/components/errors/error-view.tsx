'use client'

import { IconRetry } from '@/components/icons'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { BrandMark } from '@/components/icons/brand-mark'

/** Design `ServerError` board, shared by the route error boundary and the global one. */
export function ErrorView({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [retrying, setRetrying] = useState(false)
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <main id="main" className="error-wrap">
      <div className="rh-pattern" aria-hidden="true" style={{ zIndex: -1 }} />
      <div
        style={{
          maxWidth: 640,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <span
          className="empty__icon"
          style={{
            width: 84,
            height: 84,
            background: 'var(--rh-accent-soft)',
            color: 'var(--rh-accent-ink)',
          }}
        >
          <BrandMark style={{ width: 42, height: 42, strokeWidth: 2.2 }} />
        </span>
        <h1 className="t-h2">কিছু একটা ঠিকমতো কাজ করছে না</h1>
        <p className="t-body-lg t-muted">
          আমাদের দিক থেকে একটি সাময়িক সমস্যা হয়েছে। আপনার তথ্য নিরাপদ আছে। কিছুক্ষণ পর আবার চেষ্টা
          করুন।
        </p>
        <div
          className="card"
          style={{
            padding: '22px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            width: '100%',
          }}
        >
          <p
            className="ar"
            lang="ar"
            dir="rtl"
            style={{ fontSize: 28, color: 'var(--rh-primary)' }}
          >
            فَإِنَّ مَعَ الْعُسْرِ يُسْرًا
          </p>
          <p className="t-small t-muted">“নিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি।”</p>
          <span className="ref-badge">সূরা আশ-শারহ : ৫</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={retrying}
            onClick={() => {
              setRetrying(true)
              reset()
              setTimeout(() => setRetrying(false), 1500)
            }}
          >
            <IconRetry className={retrying ? 'ic spin-icon' : 'ic'} aria-hidden="true" />
            {retrying ? 'চেষ্টা করা হচ্ছে…' : 'আবার চেষ্টা করুন'}
          </button>
          <Link href="/" className="btn btn-secondary">
            হোমে ফিরুন
          </Link>
        </div>
        <p className="t-caption t-muted">
          সমস্যা থেকে গেলে{' '}
          <Link href="/contact?topic=technical" className="link">
            জানান
          </Link>{' '}
          · ত্রুটি কোড: {error.digest ? `RH-${error.digest.slice(0, 8)}` : 'RH-৫০০'}
        </p>
      </div>
    </main>
  )
}
