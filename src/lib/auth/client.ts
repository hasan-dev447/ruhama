'use client'

import { createAuthClient } from 'better-auth/react'
import {
  inferAdditionalFields,
  magicLinkClient,
  phoneNumberClient,
} from 'better-auth/client/plugins'

/**
 * Browser auth client. Talks to Better Auth at /api/auth on the same origin,
 * which shares its session cookie with the Payload admin panel.
 */
export const authClient = createAuthClient({
  plugins: [
    magicLinkClient(),
    phoneNumberClient(),
    inferAdditionalFields({
      user: {
        role: { type: 'string[]', required: false, input: false },
        username: { type: 'string', required: false },
        journeyStage: { type: 'string', required: false },
      },
    }),
  ],
})

export const { useSession, signOut } = authClient

export type ClientSession = typeof authClient.$Infer.Session
