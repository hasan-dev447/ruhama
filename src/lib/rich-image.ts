/**
 * How an image placed in rich text shows on the page: its own size, place, crop and caption, saved
 * on that one use (the media file and its other uses are untouched). Shared by the editor's fields
 * (payload.config, UploadFeature) and the site's renderer (components/content/rich-text.tsx).
 */

export const IMAGE_SIZE_OPTIONS = [
  { label: 'পূর্ণ প্রস্থ', value: 'full' },
  { label: 'বড় (তিন-চতুর্থাংশ)', value: 'large' },
  { label: 'মাঝারি (অর্ধেক)', value: 'medium' },
  { label: 'ছোট (এক-তৃতীয়াংশ)', value: 'small' },
] as const

export const IMAGE_ALIGN_OPTIONS = [
  { label: 'মাঝে', value: 'center' },
  { label: 'বামে, লেখা ডান পাশে', value: 'left' },
  { label: 'ডানে, লেখা বাম পাশে', value: 'right' },
] as const

export const IMAGE_ASPECT_OPTIONS = [
  { label: 'আসল অনুপাত (কাটা হবে না)', value: 'original' },
  { label: 'চওড়া 16:9', value: '16/9' },
  { label: '4:3', value: '4/3' },
  { label: 'বর্গ 1:1', value: '1/1' },
  { label: 'লম্বা 3:4', value: '3/4' },
] as const

export const IMAGE_FOCUS_OPTIONS = [
  { label: 'ছবির নির্ধারিত কেন্দ্র (মিডিয়াতে ঠিক করা)', value: 'auto' },
  { label: 'মাঝখান', value: 'center' },
  { label: 'উপরের অংশ', value: 'top' },
  { label: 'নিচের অংশ', value: 'bottom' },
  { label: 'বাম অংশ', value: 'left' },
  { label: 'ডান অংশ', value: 'right' },
] as const

export type ImageSize = (typeof IMAGE_SIZE_OPTIONS)[number]['value']

/** About how wide the image is drawn on a desktop reading column (720px), for picking a file. */
export const DISPLAY_WIDTH: Record<ImageSize, number> = {
  full: 720,
  large: 540,
  medium: 360,
  small: 240,
}

type Sized = { url?: string | null; width?: number | null } | null | undefined

/**
 * The lightest stored version wide enough for the place it is shown (1.75x, sharp on phones and
 * retina screens without paying for full 2x): the uncropped 480 / 960 versions made at upload, else
 * the original.
 */
export function pickImageUrl(
  doc: { url?: string | null; sizes?: { w480?: Sized; w960?: Sized } | null },
  size: ImageSize,
): string | null {
  const need = DISPLAY_WIDTH[size] * 1.75
  for (const v of [doc.sizes?.w480, doc.sizes?.w960]) {
    if (v?.url && (v.width ?? 0) >= need) return v.url
  }
  return doc.url ?? null
}

/** CSS object-position for the chosen part of the picture. */
export function focusPosition(
  focus: string | null | undefined,
  focal: { focalX?: number | null; focalY?: number | null },
): string {
  switch (focus) {
    case 'top':
      return 'center top'
    case 'bottom':
      return 'center bottom'
    case 'left':
      return 'left center'
    case 'right':
      return 'right center'
    case 'center':
      return 'center'
    default:
      return `${focal.focalX ?? 50}% ${focal.focalY ?? 50}%`
  }
}
