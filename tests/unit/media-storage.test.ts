import { describe, expect, it } from 'vitest'

import { r2Endpoint } from '@/lib/r2'
import { contentSecurityPolicy } from '@/lib/security-headers'
import { mediaPrefix, typeFolder } from '@/payload/media/folders'

const OCT = new Date('2026-10-06T12:00:00Z')
const ENDPOINT = 'https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com'

describe('media folders', () => {
  it('files by chosen folder, year and month', () => {
    expect(mediaPrefix('articles', 'image/png', OCT)).toBe('media/articles/2026/10')
    expect(mediaPrefix('people', 'image/jpeg', new Date('2027-01-31T23:00:00Z'))).toBe(
      'media/people/2027/01',
    )
  })

  it('files "auto" uploads by type', () => {
    expect(mediaPrefix('auto', 'image/webp', OCT)).toBe('media/images/2026/10')
    expect(mediaPrefix('auto', 'audio/mpeg', OCT)).toBe('media/audio/2026/10')
    expect(mediaPrefix('auto', 'application/pdf', OCT)).toBe('media/documents/2026/10')
    expect(typeFolder(undefined)).toBe('files')
  })

  it('never lets an unknown folder name into the key', () => {
    expect(mediaPrefix('../../etc', 'image/png', OCT)).toBe('media/images/2026/10')
  })
})

describe('r2Endpoint', () => {
  it('accepts the endpoint with or without the bucket name', () => {
    expect(r2Endpoint(`${ENDPOINT}/ruhama-media`, 'ruhama-media')).toBe(ENDPOINT)
    expect(r2Endpoint(`${ENDPOINT}/`, 'ruhama-media')).toBe(ENDPOINT)
    expect(r2Endpoint(undefined, 'x')).toBeUndefined()
  })

  it('lets the admin upload to the bucket (CSP connect-src)', () => {
    const csp = contentSecurityPolicy({ R2_ENDPOINT: `${ENDPOINT}/b`, R2_BUCKET: 'b' })
    expect(csp).toMatch(new RegExp(`connect-src[^;]*${ENDPOINT.replace(/\./g, '\.')}`))
  })
})
