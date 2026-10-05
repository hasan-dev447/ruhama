import { Search } from 'lucide-react'
import type { Metadata } from 'next'

import { ButtonLink } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'পাতাটি পাওয়া যায়নি · Ruhama',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <main id="main" className="error-wrap">
      <div className="rh-pattern" aria-hidden="true" style={{ zIndex: -1 }} />
      <div className="hero__glow" aria-hidden="true" />
      <div
        style={{
          maxWidth: 640,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <svg
          viewBox="0 0 520 90"
          aria-hidden="true"
          style={{ width: 'min(520px, 100%)', height: 'auto', overflow: 'visible' }}
        >
          <path
            d="M0 60C80 20 150 80 230 50S330 20 360 45"
            style={{
              fill: 'none',
              stroke: 'var(--rh-accent)',
              strokeWidth: 1.75,
              strokeLinecap: 'round',
            }}
          />
          <path
            d="M360 45C380 62 372 82 352 78C336 74 344 52 368 50C396 48 420 70 452 64"
            style={{
              fill: 'none',
              stroke: 'var(--rh-accent)',
              strokeWidth: 1.75,
              strokeLinecap: 'round',
              strokeDasharray: '4 6',
              opacity: 0.7,
            }}
          />
          <circle
            cx="230"
            cy="50"
            r="5"
            style={{ fill: 'var(--rh-accent)', stroke: 'var(--rh-bg)', strokeWidth: 3 }}
          />
          <circle
            cx="90"
            cy="41"
            r="4"
            style={{ fill: 'var(--rh-accent)', stroke: 'var(--rh-bg)', strokeWidth: 3 }}
          />
        </svg>
        <p className="error-code" aria-hidden="true">
          ৪০৪
        </p>
        <h1 className="t-h2">এই পাতাটি খুঁজে পাওয়া যায়নি</h1>
        <p className="t-body-lg t-muted">
          লিংকটি হয়তো বদলে গেছে বা পাতাটি সরিয়ে নেওয়া হয়েছে। সুতো এখানে থেমেছে, কিন্তু পথ শেষ
          হয়নি।
        </p>
        <form
          role="search"
          action="/search"
          method="get"
          className="input-icon"
          style={{ width: '100%', maxWidth: 520, marginTop: 6 }}
        >
          <Search className="ic" aria-hidden="true" />
          <label htmlFor="nf-search" className="sr-only">
            সাইটে খুঁজুন
          </label>
          <input
            id="nf-search"
            name="q"
            className="input"
            type="search"
            placeholder="যা খুঁজছিলেন তা এখানে লিখুন"
            style={{ minHeight: 56 }}
          />
        </form>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            justifyContent: 'center',
            marginTop: 4,
          }}
        >
          <ButtonLink href="/">হোমে ফিরুন</ButtonLink>
          <ButtonLink href="/ilm" variant="secondary">
            ইলম কেন্দ্র
          </ButtonLink>
          <ButtonLink href="/qa" variant="ghost">
            প্রশ্ন করুন
          </ButtonLink>
        </div>
      </div>
    </main>
  )
}
