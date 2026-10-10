'use client'

import { toast } from '@payloadcms/ui'
import { IconCopy } from '@/components/icons'
import { useSyncExternalStore } from 'react'

type Provider = 'google' | 'facebook' | 'youtube'

const CONSOLE: Record<Provider, string> = {
  google:
    'Google Cloud Console-এ OAuth client-এর "Authorized redirect URIs" অংশে এই ঠিকানাটি যোগ করুন।',
  facebook: 'Facebook Login > Settings-এর "Valid OAuth Redirect URIs" অংশে এই ঠিকানাটি যোগ করুন।',
  youtube:
    'YouTube-এর OAuth client-এর "Authorized redirect URIs" অংশে এই ঠিকানাটি যোগ করুন (লোকাল টেস্টের জন্য http://localhost:3000 দিয়েও একটি)।',
}

const PATH: Record<Provider, string> = {
  google: '/api/auth/callback/google',
  facebook: '/api/auth/callback/facebook',
  youtube: '/api/v1/integrations/youtube/callback',
}

const noop = () => () => {}

/** The redirect address to paste into the provider's console, with a copy button. */
export function CallbackUrl({ provider }: { provider: Provider }) {
  const origin = useSyncExternalStore(
    noop,
    () => process.env.NEXT_PUBLIC_SITE_URL || window.location.origin,
    () => process.env.NEXT_PUBLIC_SITE_URL ?? '',
  )
  const url = `${origin.replace(/\/$/, '')}${PATH[provider]}`

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
          <IconCopy size={15} aria-hidden="true" /> কপি
        </button>
      </div>
      <p className="field-description">{CONSOLE[provider]}</p>
    </div>
  )
}
