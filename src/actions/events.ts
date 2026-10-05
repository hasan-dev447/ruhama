'use server'

import type { EventRegistrationInput } from '@/lib/validation/events'
import { actionContext, actionError } from '@/server/action-context'
import {
  cancelRegistration,
  registerForEvent,
  type RegistrationResult,
} from '@/server/services/events'

import type { ActionResult } from './types'

export async function registerForEventAction(
  eventId: number,
  input: EventRegistrationInput,
): Promise<ActionResult<RegistrationResult>> {
  try {
    return { ok: true, data: await registerForEvent(await actionContext(), eventId, input) }
  } catch (err) {
    return actionError(err)
  }
}

export async function cancelRegistrationAction(eventId: number): Promise<ActionResult> {
  try {
    await cancelRegistration(await actionContext(), eventId)
    return { ok: true }
  } catch (err) {
    return actionError(err)
  }
}
