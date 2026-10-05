'use server'

import { actionContext, actionError } from '@/server/action-context'
import { toggleBookmark } from '@/server/services/bookmarks'

import type { ActionResult } from './types'

export async function toggleBookmarkAction(target: {
  collection: string
  id: number | string
}): Promise<ActionResult<{ saved: boolean }>> {
  try {
    const ctx = await actionContext()
    const data = await toggleBookmark(ctx, target as never)
    return { ok: true, data }
  } catch (err) {
    return actionError(err)
  }
}
