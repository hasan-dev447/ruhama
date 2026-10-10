'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import type { z } from 'zod'

import { actionContext, actionError } from '@/server/action-context'
import { TAGS } from '@/server/cache/tags'
import {
  confirmContact,
  listContacts,
  makePrimaryContact,
  removeContact,
  startAddContact,
  type ContactKind,
  type ContactList,
} from '@/server/services/contacts'

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
import {
  cancelMyPendingProfile,
  saveMyPublicProfile,
  type PublicProfileInput,
} from '@/server/services/public-profile'

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

/** /onboarding: ভাই / বোন (once) and a real email when the account has none. */
export async function completeProfileAction(input: {
  gender?: string
  email?: string
}): Promise<ActionResult<{ emailPending: string | null }>> {
  try {
    const ctx = await actionContext()
    // an email given here gets a code first (services/contacts) and joins once it is confirmed
    const { emailPending } = await completeProfile(ctx, input)
    revalidatePath('/', 'layout')
    refreshProfile(ctx.user?.username)
    return { ok: true, data: { emailPending } }
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

/* ---------- emails and mobile numbers ---------- */

type ContactInput = { kind: ContactKind; value: string }

async function contactStep(
  run: (ctx: Awaited<ReturnType<typeof actionContext>>) => Promise<unknown>,
): Promise<ActionResult<ContactList>> {
  try {
    const ctx = await actionContext()
    await run(ctx)
    // the account may have changed (new primary), so list it from fresh data
    const fresh = await actionContext()
    refreshProfile(ctx.user?.username)
    return { ok: true, data: await listContacts(fresh) }
  } catch (err) {
    return actionError(err)
  }
}

/** Send a code to a new email or number (or send it again). */
export async function addContactAction(input: ContactInput) {
  return contactStep((ctx) => startAddContact(ctx, input))
}

export async function confirmContactAction(input: ContactInput & { code: string }) {
  return contactStep((ctx) => confirmContact(ctx, input))
}

export async function makePrimaryContactAction(input: ContactInput) {
  return contactStep((ctx) => makePrimaryContact(ctx, input))
}

export async function removeContactAction(input: ContactInput) {
  return contactStep((ctx) => removeContact(ctx, input))
}

/* ---------- public profile (আলিম, লেখক ও বক্তা) ---------- */

/** Save the member's own public profile; it may wait for approval (people menu's rule). */
export async function savePublicProfileAction(
  input: PublicProfileInput,
): Promise<ActionResult<{ pending: boolean }>> {
  try {
    const ctx = await actionContext()
    const data = await saveMyPublicProfile(ctx, input)
    revalidatePath('/settings')
    return { ok: true, data }
  } catch (err) {
    return actionError(err)
  }
}

/** Withdraw changes that are still waiting for approval. */
export async function cancelPublicProfileAction(): Promise<ActionResult> {
  try {
    await cancelMyPendingProfile(await actionContext())
    revalidatePath('/settings')
    return { ok: true }
  } catch (err) {
    return actionError(err)
  }
}
