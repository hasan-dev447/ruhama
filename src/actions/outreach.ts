'use server'

import type { ContactInput, VolunteerInput } from '@/lib/validation/forms'
import { actionContext, actionError } from '@/server/action-context'
import { submitContact, submitVolunteer } from '@/server/services/outreach'

import type { ActionResult } from './types'

export async function submitVolunteerAction(input: VolunteerInput): Promise<ActionResult> {
  try {
    await submitVolunteer(await actionContext(), input)
    return { ok: true }
  } catch (err) {
    return actionError(err)
  }
}

export async function submitContactAction(input: ContactInput): Promise<ActionResult> {
  try {
    await submitContact(await actionContext(), input)
    return { ok: true }
  } catch (err) {
    return actionError(err)
  }
}
