/**
 * Responsive image URLs without Vercel's image optimizer (and its free-plan quota).
 *
 * Media lives in Cloudflare R2 behind a custom domain. With NEXT_PUBLIC_IMAGE_TRANSFORMS=cloudflare
 * and Image Transformations enabled for that domain's zone, Cloudflare resizes and converts images
 * at the edge (`/cdn-cgi/image/...`). Otherwise, and for any other source, the original URL is used.
 * The same URLs keep working if the site itself later moves to Cloudflare.
 */

const enabled = process.env.NEXT_PUBLIC_IMAGE_TRANSFORMS === 'cloudflare'

const mediaOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_MEDIA_URL
      ? new URL(process.env.NEXT_PUBLIC_MEDIA_URL).origin
      : null
  } catch {
    return null
  }
})()

/** Widths offered in srcset; wide enough for a 720px column on 2x screens. */
export const IMAGE_WIDTHS = [480, 768, 1080, 1440] as const

/** Whether this URL can be resized at the edge (used to skip a pointless srcset otherwise). */
export const transformable = (src: string) =>
  Boolean(enabled && mediaOrigin && src.startsWith(`${mediaOrigin}/`))

/** One resized variant (scale-down only: never crops, never enlarges). */
export function imageUrl(
  src: string,
  { width, quality = 75 }: { width: number; quality?: number },
): string {
  if (!transformable(src)) return src
  const path = src.slice(mediaOrigin!.length + 1)
  return `${mediaOrigin}/cdn-cgi/image/width=${width},quality=${quality},format=auto,fit=scale-down/${path}`
}

/** srcset for a responsive <img>, or undefined when resizing is off (the browser then uses src). */
export function imageSrcSet(
  src: string,
  widths: readonly number[] = IMAGE_WIDTHS,
): string | undefined {
  if (!transformable(src)) return undefined
  return widths.map((w) => `${imageUrl(src, { width: w })} ${w}w`).join(', ')
}
