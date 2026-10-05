import config from '@payload-config'
import { getPayload } from 'payload'
import { getPayloadAuth } from 'payload-auth/better-auth'

import type { PayloadAuthConfig } from './auth/options'

/** Payload Local API (no HTTP round trips). */
export const getPayloadClient = () => getPayload({ config })

/** Payload with the typed Better Auth instance attached. */
export const getPayloadWithAuth = () => getPayloadAuth<PayloadAuthConfig>(config)
