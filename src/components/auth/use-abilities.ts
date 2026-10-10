'use client'

import { useQuery } from '@tanstack/react-query'

import { isModerator, isStaff } from '@/lib/roles'

type Abilities = { admin: boolean; moderate: boolean }

/**
 * What the signed-in member may open from the site: the admin panel, the forum moderation tools.
 * It follows the রোল ও অনুমতি page (asked from the server); until the answer arrives, the usual
 * roles decide, so the menu does not jump.
 */
export function useAbilities(
  user: { id: string | number; role?: unknown } | null | undefined,
): Abilities {
  const guess: Abilities = { admin: isStaff(user), moderate: isModerator(user) }
  const { data } = useQuery({
    queryKey: ['me', 'abilities', user?.id ?? null],
    enabled: Boolean(user),
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Abilities> => {
      const res = await fetch('/api/v1/me/abilities', { credentials: 'include' })
      if (!res.ok) return guess
      return (await res.json()) as Abilities
    },
  })
  if (!user) return { admin: false, moderate: false }
  return data ?? guess
}
