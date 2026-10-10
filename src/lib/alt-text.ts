/**
 * An alt text for a file uploaded without one, made from its name: "majlis-dhaka_2026.jpg" reads
 * "majlis dhaka". Camera and app names (IMG_2034, DSC, WhatsApp Image, Screenshot), dates, numbers and
 * hashes say nothing about the picture, so they are dropped; when nothing is left, a plain description
 * of the kind of file is used. Editors can always write a better one.
 */

const NOISE = new Set([
  'img',
  'image',
  'images',
  'dsc',
  'dscn',
  'dscf',
  'pxl',
  'vid',
  'photo',
  'photos',
  'pic',
  'picture',
  'screenshot',
  'screen',
  'shot',
  'whatsapp',
  'scan',
  'scanned',
  'copy',
  'final',
  'edited',
  'untitled',
  'new',
  'file',
  'download',
  'at',
  'am',
  'pm',
])

const FALLBACK = {
  image: 'Ruhama-র ছবি',
  audio: 'Ruhama-র অডিও',
  pdf: 'Ruhama-র ডকুমেন্ট',
  other: 'Ruhama-র ফাইল',
}

export function fallbackAlt(mimeType?: string | null): string {
  if (mimeType?.startsWith('image/')) return FALLBACK.image
  if (mimeType?.startsWith('audio/')) return FALLBACK.audio
  if (mimeType === 'application/pdf') return FALLBACK.pdf
  return FALLBACK.other
}

export function altFromFilename(filename?: string | null, mimeType?: string | null): string {
  let name = filename ?? ''
  try {
    name = decodeURIComponent(name)
  } catch {
    // a stray % in the name: use it as it is
  }
  name = name
    .replace(/\.[a-z0-9]{2,5}$/i, '') // extension
    .replace(/\(\d+\)|-\d+x\d+$/g, ' ') // "(1)" copies, "-1024x768" sizes
    .replace(/[_\-.+~]+/g, ' ')
  const words = name
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !NOISE.has(w.toLowerCase()))
    .filter((w) => !/^[0-9a-f]{8,}$/i.test(w)) // hashes and ids
    .filter((w) => {
      // with digits in it (20260107, 4k, DSC0042, IMG2034): keep only real words around the digits
      if (!/\d/.test(w)) return true
      const letters = w.replace(/[^\p{L}]/gu, '')
      return letters.length >= 3 && !NOISE.has(letters.toLowerCase())
    })
  const text = words.join(' ').trim()
  if (text.replace(/[^\p{L}]/gu, '').length < 3) return fallbackAlt(mimeType)
  // "majlis dhaka" -> "Majlis dhaka"; Bangla has no case
  return text.charAt(0).toUpperCase() + text.slice(1)
}
