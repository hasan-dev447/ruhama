import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

/**
 * Encryption for third-party credentials saved from the admin (OAuth secrets, SMS and email API keys).
 * AES-256-GCM with a key derived from PAYLOAD_SECRET, so a database dump alone never reveals them.
 * Changing PAYLOAD_SECRET makes saved credentials unreadable: they then have to be entered again.
 */

const VERSION = 'v1'

const key = (secret = process.env.PAYLOAD_SECRET ?? '') =>
  createHash('sha256').update(`ruhama:integrations:${secret}`).digest()

export function encryptSecret(plain: string, secret?: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(secret), iv)
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return [
    VERSION,
    iv.toString('base64'),
    cipher.getAuthTag().toString('base64'),
    data.toString('base64'),
  ].join(':')
}

/** The plain value, or null when nothing is stored or it cannot be decrypted (wrong key, tampered data). */
export function decryptSecret(stored: string | null | undefined, secret?: string): string | null {
  if (!stored) return null
  const [version, iv, tag, data] = stored.split(':')
  if (version !== VERSION || !iv || !tag || !data) return null
  try {
    const decipher = createDecipheriv('aes-256-gcm', key(secret), Buffer.from(iv, 'base64'))
    decipher.setAuthTag(Buffer.from(tag, 'base64'))
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString(
      'utf8',
    )
  } catch {
    return null
  }
}

/** What the admin shows for a saved secret: only its last four characters. */
export const secretHint = (plain: string) => (plain.length > 6 ? `••••${plain.slice(-4)}` : '••••')
