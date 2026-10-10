'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { useSession } from '@/lib/auth/client'
import { isProfileIncomplete } from '@/lib/profile-complete'

/**
 * A member who has not chosen ভাই / বোন, or whose days to confirm an email are up, is sent to
 * /onboarding from any page (lib/profile-complete.ts). The server refuses their actions too (requireUser), so this
 * is only the friendly half of the rule.
 */
export function ProfileGate() {
  const { data } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const incomplete = Boolean(data?.user && isProfileIncomplete(data.user))

  useEffect(() => {
    if (!incomplete) return
    const next = `${pathname}${window.location.search}`
    router.replace(`/onboarding?next=${encodeURIComponent(next)}`)
  }, [incomplete, pathname, router])

  return null
}
