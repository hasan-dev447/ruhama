'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import type { z } from 'zod'

import { actionContext, actionError } from '@/server/action-context'
import {
  notificationPrefsSchema,
  privacySchema,
  requestAccountDeletion,
  updateNotificationPrefs,
  updatePrivacy,
  updateProfile,
  type ProfileInput,
} from '@/server/services/settings'

import type { ActionResult } from './types'

/** The public profile is cached; refresh it as soon as the owner changes it. */
function refreshProfile(username: string | null | undefined) {
  if (!username) return
  revalidateTag(`member:${username}`, { expire: 0 })
  revalidatePath(`/members/${username}`)
}

export async function updateProfileAction(input: ProfileInput): Promise<ActionResult> {
  try {
    const ctx = await actionContext()
    await updateProfile(ctx, input)
    revalidatePath('/dashboard')
    refreshProfile(ctx.user?.username)
    return { ok: true }
  } catch (err) {
    return actionError(err)
  }
}

export async function updatePrivacyAction(
  input: z.input<typeof privacySchema>,
): Promise<ActionResult> {
  try {
    const ctx = await actionContext()
    await updatePrivacy(ctx, input)
    refreshProfile(ctx.user?.username)
    return { ok: true }
  } catch (err) {
    return actionError(err)
  }
}

export async function updateNotificationPrefsAction(
  input: z.input<typeof notificationPrefsSchema>,
): Promise<ActionResult> {
  try {
    await updateNotificationPrefs(await actionContext(), input)
    return { ok: true }
  } catch (err) {
    return actionError(err)
  }
}

export async function requestAccountDeletionAction(confirm: string): Promise<ActionResult> {
  try {
    if (confirm.trim() !== 'মুছে ফেলুন')
      return { ok: false, error: 'নিশ্চিত করতে ঘরে “মুছে ফেলুন” লিখুন।' }
    await requestAccountDeletion(await actionContext())
    return { ok: true }
  } catch (err) {
    return actionError(err)
  }
}
