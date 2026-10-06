'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import type { z } from 'zod'

import { actionContext, actionError } from '@/server/action-context'
import { TAGS } from '@/server/cache/tags'
import {
  completeProfile,
  removeProfilePhoto,
  searchMembers,
  setProfilePhoto,
  updateCover,
  updatePrivacy,
  type CoverInput,
  type MemberHit,
  type PrivacyInput,
} from '@/server/services/profile'
import {
  notificationPrefsSchema,
  requestAccountDeletion,
  updateNotificationPrefs,
  updateProfile,
  type ProfileInput,
} from '@/server/services/settings'

import type { ActionResult } from './types'

/** The public profile is cached; refresh it as soon as the owner changes it. */
function refreshProfile(username: string | null | undefined) {
  if (!username) return
  revalidateTag(`member:${username}`, { expire: 0 })
  revalidatePath(`/members/${username}`)
  // a linked scholar or speaker page shows the member's cover and photo too
  revalidateTag(TAGS.collection('users'), { expire: 0 })
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

export async function updatePrivacyAction(input: PrivacyInput): Promise<ActionResult> {
  try {
    const ctx = await actionContext()
    await updatePrivacy(ctx, input)
    refreshProfile(ctx.user?.username)
    return { ok: true }
  } catch (err) {
    return actionError(err)
  }
}

/** ভাই / বোন, chosen once on /onboarding. */
export async function completeProfileAction(gender: string): Promise<ActionResult> {
  try {
    const ctx = await actionContext()
    await completeProfile(ctx, { gender })
    revalidatePath('/', 'layout')
    refreshProfile(ctx.user?.username)
    return { ok: true }
  } catch (err) {
    return actionError(err)
  }
}

/** Profile photo (brothers only): the browser sends an already resized square image. */
export async function setProfilePhotoAction(
  form: FormData,
): Promise<ActionResult<{ image: string | null; large: string | null }>> {
  try {
    const file = form.get('photo')
    if (!(file instanceof File)) return { ok: false, error: 'একটি ছবি বেছে নিন।' }
    const ctx = await actionContext()
    const data = await setProfilePhoto(ctx, {
      data: Buffer.from(await file.arrayBuffer()),
      mimetype: file.type,
      name: file.name,
      size: file.size,
    })
    refreshProfile(ctx.user?.username)
    return { ok: true, data }
  } catch (err) {
    return actionError(err)
  }
}

export async function removeProfilePhotoAction(): Promise<ActionResult> {
  try {
    const ctx = await actionContext()
    await removeProfilePhoto(ctx)
    refreshProfile(ctx.user?.username)
    return { ok: true }
  } catch (err) {
    return actionError(err)
  }
}

export async function updateCoverAction(input: CoverInput): Promise<ActionResult> {
  try {
    const ctx = await actionContext()
    await updateCover(ctx, input)
    refreshProfile(ctx.user?.username)
    return { ok: true }
  } catch (err) {
    return actionError(err)
  }
}

export async function searchMembersAction(q: string): Promise<ActionResult<MemberHit[]>> {
  try {
    return { ok: true, data: await searchMembers(await actionContext(), q) }
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
