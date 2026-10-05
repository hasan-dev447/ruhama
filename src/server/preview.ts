import 'server-only'

import { draftMode } from 'next/headers'

import { CONTENT_ROLES, hasRole } from '@/lib/roles'
import type { User } from '@/payload-types'

import { actionContext } from './action-context'

/**
 * The staff member viewing a draft preview, or null for everyone else.
 * Draft mode alone is never trusted: the session is re-checked on every render.
 */
export async function previewUser(): Promise<User | null> {
  const dm = await draftMode()
  if (!dm.isEnabled) return null
  const { user } = await actionContext()
  return user && hasRole(user, ...CONTENT_ROLES) ? user : null
}
