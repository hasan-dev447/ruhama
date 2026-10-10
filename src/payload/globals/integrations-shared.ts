/** Shared by the integrations global, its admin components and the server (no server-only imports). */

/** Typed into a secret field to delete the saved value. */
export const SECRET_CLEAR = '__clear__'

/** [group, field] of every secret in the integrations global. */
export const INTEGRATION_SECRETS = [
  ['google', 'clientSecret'],
  ['facebook', 'clientSecret'],
  ['sms', 'apiKey'],
  ['email', 'resendApiKey'],
  ['youtube', 'clientSecret'],
] as const

export type IntegrationTarget = 'google' | 'facebook' | 'sms' | 'email' | 'youtube'
