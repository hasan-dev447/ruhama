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

export function requireUser(ctx: ServiceContext): User {
  if (!ctx.user) throw errors.unauthorized()
  return ctx.user
}
