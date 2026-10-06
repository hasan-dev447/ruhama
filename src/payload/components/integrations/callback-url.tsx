'use client'

import { toast } from '@payloadcms/ui'
import { Copy } from 'lucide-react'
import { useSyncExternalStore } from 'react'

const CONSOLE: Record<'google' | 'facebook', string> = {
  google:
    'Google Cloud Console-এ OAuth client-এর "Authorized redirect URIs" অংশে এই ঠিকানাটি যোগ করুন।',
  facebook: 'Facebook Login > Settings-এর "Valid OAuth Redirect URIs" অংশে এই ঠিকানাটি যোগ করুন।',
}

const noop = () => () => {}

/** The redirect address to paste into the provider's console, with a copy button. */
export function CallbackUrl({ provider }: { provider: 'google' | 'facebook' }) {
  const origin = useSyncExternalStore(
    noop,
    () => process.env.NEXT_PUBLIC_SITE_URL || window.location.origin,
    () => process.env.NEXT_PUBLIC_SITE_URL ?? '',
  )
  const url = `${origin.replace(/\/$/, '')}/api/auth/callback/${provider}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('কপি হয়েছে')
    } catch {
      toast.error('কপি করা যায়নি')
    }
  }

  return (
    <div className="field-type rh-callback">
      <span className="field-label">Redirect URI</span>
      <div className="rh-callback__row">
        <code>{url}</code>
        <button type="button" className="rh-int-btn rh-int-btn--ghost" onClick={copy}>
          <Copy size={15} aria-hidden="true" /> কপি
        </button>
      </div>
      <p className="field-description">{CONSOLE[provider]}</p>
    </div>
  )
}
