import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'

import { request, type FullConfig } from '@playwright/test'

import { ACCOUNTS, BASE_URL, SEED_PASSWORD, stateFile, testIp } from './helpers'

/**
 * Sign every seeded account in once per run and keep the session for the tests. The app allows only
 * 8 password sign-ins per account in 15 minutes (brute-force protection), so tests reuse these instead
 * of signing in again. Tests that end sessions on purpose sign in separately (see signInFresh).
 */
export default async function globalSetup(_config: FullConfig) {
  await mkdir('tests/e2e/.auth', { recursive: true })
  for (const email of Object.values(ACCOUNTS)) {
    // a session saved by an earlier run is reused while it is still valid
    if (existsSync(stateFile(email))) {
      const saved = await request.newContext({ baseURL: BASE_URL, storageState: stateFile(email) })
      const session = (await (
        await saved.get('/api/auth/get-session')
      )
        .json()
        .catch(() => null)) as { user?: { email?: string } } | null
      await saved.dispose()
      if (session?.user?.email === email) continue
    }
    const ctx = await request.newContext({ baseURL: BASE_URL })
    const res = await ctx.post('/api/auth/sign-in/email', {
      data: { email, password: SEED_PASSWORD },
      headers: { origin: new URL(BASE_URL).origin, 'x-forwarded-for': testIp() },
    })
    if (!res.ok())
      throw new Error(
        `global setup: sign-in failed for ${email} (${res.status()}). Is the database seeded (npm run seed)?`,
      )
    await ctx.storageState({ path: stateFile(email) })
    await ctx.dispose()
  }
}
