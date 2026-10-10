import type { Payload, PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

import { isProfileIncomplete } from '@/lib/profile-complete'

import { errors } from './errors'

/** Everything a service needs: the Payload instance, the acting user and request metadata. */
export type ServiceContext = {
  payload: Payload
  user: User | null
  req?: PayloadRequest
  ip?: string
}

/**
 * The signed-in member. A member who has not chosen ভাই / বোন or given a real email yet can do
 * nothing else until they do it on /onboarding.
 */
export function requireUser(ctx: ServiceContext, opts: { allowIncomplete?: boolean } = {}): User {
  if (!ctx.user) throw errors.unauthorized()
  if (!opts.allowIncomplete && isProfileIncomplete(ctx.user)) throw errors.profileIncomplete()
  return ctx.user
}
