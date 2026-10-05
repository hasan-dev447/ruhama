/**
 * Vercel build entry (`vercel-build` takes precedence over `build` on Vercel).
 * Production deploys apply pending database migrations first, over DATABASE_URL_DIRECT, so the new
 * code never runs against an old schema. Preview deploys skip migrations: give previews their own
 * database (a Supabase branch) if they need schema changes.
 */
import { spawnSync } from 'node:child_process'

const run = (script) => {
  const res = spawnSync('npm', ['run', script], { stdio: 'inherit', shell: true })
  if (res.status !== 0) process.exit(res.status ?? 1)
}

if (process.env.VERCEL_ENV === 'production') {
  console.log('[vercel-build] applying database migrations')
  run('migrate')
} else {
  console.log(`[vercel-build] ${process.env.VERCEL_ENV ?? 'local'} build: migrations skipped`)
}
run('build')
