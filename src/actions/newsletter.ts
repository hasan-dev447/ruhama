'use server'

import { actionContext, actionError } from '@/server/action-context'
import { subscribeNewsletter } from '@/server/services/newsletter'

import type { ActionResult } from './types'

export async function subscribeNewsletterAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const ctx = await actionContext()
    await subscribeNewsletter(ctx, {
      email: String(formData.get('email') ?? ''),
      source: String(formData.get('source') ?? 'site'),
    })
    return { ok: true }
  } catch (err) {
    return actionError(err)
  }
}
