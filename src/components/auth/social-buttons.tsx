'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { FacebookLogo, GoogleLogo } from '@/components/icons/social'
import { authClient } from '@/lib/auth/client'
import { authErrorMessage } from '@/lib/auth/errors'

/** OAuth buttons; Facebook appears only when its credentials are configured on the server. */
export function SocialButtons({
  google,
  facebook,
  next,
}: {
  google: boolean
  facebook: boolean
  next: string
}) {
  const [pending, setPending] = useState<'google' | 'facebook' | null>(null)
  if (!google && !facebook) return null

  async function go(provider: 'google' | 'facebook') {
    setPending(provider)
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: next,
      errorCallbackURL: `/login?error=oauth&next=${encodeURIComponent(next)}`,
    })
    if (error) {
      setPending(null)
      toast.error('লগইন শুরু করা যায়নি', { description: authErrorMessage(error) })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {google ? (
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => go('google')}
          disabled={pending !== null}
          aria-busy={pending === 'google'}
        >
          {pending === 'google' ? (
            <span className="spin" aria-hidden="true" />
          ) : (
            <GoogleLogo className="ic" />
          )}
          Google দিয়ে চালিয়ে যান
        </button>
      ) : null}
      {facebook ? (
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => go('facebook')}
          disabled={pending !== null}
          aria-busy={pending === 'facebook'}
        >
          {pending === 'facebook' ? (
            <span className="spin" aria-hidden="true" />
          ) : (
            <FacebookLogo className="ic" />
          )}
          Facebook দিয়ে চালিয়ে যান
        </button>
      ) : null}
    </div>
  )
}
