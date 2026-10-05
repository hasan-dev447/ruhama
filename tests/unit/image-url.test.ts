import { afterEach, describe, expect, it, vi } from 'vitest'

async function load(env: Record<string, string | undefined>) {
  vi.resetModules()
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v as string)
  return import('@/lib/image-url')
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('edge-resized image URLs', () => {
  const media = 'https://media.ruhama.org/media/photo.jpg'

  it('uses Cloudflare transformations for media when enabled', async () => {
    const { imageUrl, imageSrcSet } = await load({
      NEXT_PUBLIC_IMAGE_TRANSFORMS: 'cloudflare',
      NEXT_PUBLIC_MEDIA_URL: 'https://media.ruhama.org',
    })
    expect(imageUrl(media, { width: 768 })).toBe(
      'https://media.ruhama.org/cdn-cgi/image/width=768,quality=75,format=auto,fit=scale-down/media/photo.jpg',
    )
    expect(imageSrcSet(media)?.split(', ')).toHaveLength(4)
  })

  it('leaves other sources and the disabled setting untouched', async () => {
    const on = await load({
      NEXT_PUBLIC_IMAGE_TRANSFORMS: 'cloudflare',
      NEXT_PUBLIC_MEDIA_URL: 'https://media.ruhama.org',
    })
    expect(on.imageUrl('https://lh3.googleusercontent.com/a.png', { width: 480 })).toBe(
      'https://lh3.googleusercontent.com/a.png',
    )
    expect(on.imageUrl('/api/media/file/a.png', { width: 480 })).toBe('/api/media/file/a.png')

    const off = await load({
      NEXT_PUBLIC_IMAGE_TRANSFORMS: '',
      NEXT_PUBLIC_MEDIA_URL: 'https://media.ruhama.org',
    })
    expect(off.imageUrl(media, { width: 480 })).toBe(media)
    expect(off.imageSrcSet(media)).toBeUndefined()
  })
})
