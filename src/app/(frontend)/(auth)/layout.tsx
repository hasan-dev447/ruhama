import { IconBack } from '@/components/icons'
import Link from 'next/link'

import { ThemeToggle } from '@/components/layout/theme-toggle'

/** Login, registration and recovery: a focused card without the site header (design `Login` board). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="auth-wrap">
      <div className="rh-pattern" aria-hidden="true" style={{ zIndex: -1 }} />
      <div className="hero__glow" aria-hidden="true" style={{ top: -200 }} />
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link href="/" className="link-arrow" style={{ minHeight: 44 }}>
          <IconBack className="ic" aria-hidden="true" />
          হোমে ফিরুন
        </Link>
        <ThemeToggle />
      </div>
      {children}
      <p
        className="ar"
        lang="ar"
        dir="rtl"
        style={{
          position: 'absolute',
          bottom: 20,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 22,
          color: 'var(--rh-muted)',
          opacity: 0.8,
        }}
      >
        رُحَمَاءُ بَيْنَهُمْ
      </p>
    </main>
  )
}
