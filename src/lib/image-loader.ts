import { imageUrl } from './image-url'

/**
 * Loader for any `next/image` use (configured in next.config.ts): resizing goes through Cloudflare
 * instead of Vercel's optimizer, so it never draws on the Vercel image quota.
 */
export default function cloudflareImageLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}) {
  return imageUrl(src, { width, quality })
}
