'use server'

import { actionContext, actionError } from '@/server/action-context'
import { cancelJoinRequest, requestToJoinCircle, toggleMeetupRsvp } from '@/server/services/circles'

import type { ActionResult } from './types'

export async function requestToJoinCircleAction(
  circleId: number,
  message: string,
): Promise<ActionResult<{ status: string }>> {
  try {
    return {
      ok: true,
      data: await requestToJoinCircle(await actionContext(), circleId, { message }),
    }
  } catch (err) {
    return actionError(err)
  }
}

export async function cancelJoinRequestAction(
  circleId: number,
): Promise<ActionResult<{ status: string }>> {
  try {
    return { ok: true, data: await cancelJoinRequest(await actionContext(), circleId) }
  } catch (err) {
    return actionError(err)
  }
}

export async function toggleMeetupRsvpAction(
  meetupId: number,
): Promise<ActionResult<{ attending: boolean; attendingCount: number }>> {
  try {
    return { ok: true, data: await toggleMeetupRsvp(await actionContext(), meetupId) }
  } catch (err) {
    return actionError(err)
  }
}
