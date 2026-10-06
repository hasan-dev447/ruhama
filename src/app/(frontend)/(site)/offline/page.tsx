import { IconOffline, IconRetry } from '@/components/icons'
import type { Metadata } from 'next'

import { OFFLINE_SLOT_ID } from '@/sw/protocol'

export const metadata: Metadata = {
  title: 'আপনি এখন অফলাইনে · Ruhama',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-static'

/**
 * Served by the service worker whenever a page cannot be reached without a connection. It has to work
 * with no JavaScript (chunks may not be cached), so the worker writes the saved-article list straight
 * into the slot below and "try again" is a plain link that reloads the address the visitor asked for.
 */
export default function OfflinePage() {
  return (
    <main id="main" className="error-wrap">
      <div className="rh-pattern" aria-hidden="true" style={{ zIndex: -1 }} />
      <div
        style={{
          maxWidth: 640,
          width: '100%',
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
          <IconOffline className="ic ic-lg" aria-hidden="true" />
        </span>
        <h1 className="t-h2">আপনি এখন অফলাইনে</h1>
        <p className="t-body-lg t-muted">
          ইন্টারনেট সংযোগ ফিরে এলে পাতাটি আবার খুলবে। ততক্ষণ সংরক্ষিত লেখাগুলো পড়তে পারেন।
        </p>
        {/* an empty href reloads the current address, which is the page the visitor wanted */}
        <a href="" className="btn btn-primary">
          <IconRetry className="ic" aria-hidden="true" />
          আবার চেষ্টা করুন
        </a>
        <section
          className="card"
          aria-labelledby="off-h"
          style={{ width: '100%', padding: '20px 22px', textAlign: 'left' }}
        >
          <h2 id="off-h" className="t-h4" style={{ fontSize: 18 }}>
            অফলাইনে পড়ার জন্য সংরক্ষিত
          </h2>
          <div
            id={OFFLINE_SLOT_ID}
            dangerouslySetInnerHTML={{ __html: '' }}
            suppressHydrationWarning
          />
        </section>
      </div>
    </main>
  )
}
