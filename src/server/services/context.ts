import type { Payload, PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

import { errors } from './errors'

/** Everything a service needs: the Payload instance, the acting user and request metadata. */
export type ServiceContext = {
  payload: Payload
  user: User | null
  req?: PayloadRequest
  ip?: string
}

/**
 * The signed-in member. Members who have not chosen ভাই / বোন yet can do nothing else until they do
 * (Google, Facebook, magic-link and phone sign-ups choose it on /onboarding).
 */
export function requireUser(ctx: ServiceContext, opts: { allowIncomplete?: boolean } = {}): User {
  if (!ctx.user) throw errors.unauthorized()
  if (!opts.allowIncomplete && !ctx.user.gender) throw errors.profileIncomplete()
  return ctx.user
}
