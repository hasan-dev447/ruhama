'use client'

import { ButtonLink } from '@/components/ui/button'
import { authClient } from '@/lib/auth/client'

/** Shown only to the profile's owner; resolved on the client so the page stays cacheable. */
export function OwnerEditButton({ username }: { username: string }) {
  const { data } = authClient.useSession()
  if (data?.user?.username !== username) return null
  return (
    <ButtonLink href="/settings" variant="secondary" size="sm" style={{ marginBottom: 4 }}>
      প্রোফাইল সম্পাদনা
    </ButtonLink>
  )
}
