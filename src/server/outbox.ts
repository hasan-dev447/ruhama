import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

/**
 * Local outbox for emails and SMS when no real provider is configured.
 * Set OUTBOX_DIR (used by the end-to-end tests) to capture messages as JSON lines.
 */
export async function writeOutbox(
  kind: 'email' | 'sms',
  record: Record<string, unknown>,
): Promise<boolean> {
  const dir = process.env.OUTBOX_DIR
  if (!dir) return false
  const abs = path.resolve(dir)
  await mkdir(abs, { recursive: true })
  await appendFile(
    path.join(abs, `${kind}.jsonl`),
    `${JSON.stringify({ ...record, at: new Date().toISOString() })}\n`,
    'utf8',
  )
  return true
}
