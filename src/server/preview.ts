import 'server-only'

import { draftMode } from 'next/headers'

import type { User } from '@/payload-types'

import { actionContext } from './action-context'
import { canEnterAdmin } from '@/server/permissions'

/**
 * The staff member viewing a draft preview, or null for everyone else.
 * Draft mode alone is never trusted: the session is re-checked on every render.
 */
export async function previewUser(): Promise<User | null> {
  const dm = await draftMode()
  if (!dm.isEnabled) return null
  const { user } = await actionContext()
  // anyone in the admin panel; what they may read is decided by each menu's access
  return user && (await canEnterAdmin(user)) ? user : null
}
