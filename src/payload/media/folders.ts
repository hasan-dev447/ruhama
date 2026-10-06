/**
 * Where uploads are kept in the R2 bucket: `media/<folder>/<year>/<month>/<file>`, so the bucket stays
 * browsable by topic and date. Shared by the Media collection (server) and its folder picker (admin).
 */

export const MEDIA_FOLDERS = [
  { value: 'auto', label: 'ধরন অনুযায়ী (ছবি, অডিও, ডকুমেন্ট)' },
  { value: 'articles', label: 'প্রবন্ধ' },
  { value: 'events', label: 'মজলিস' },
  { value: 'courses', label: 'কোর্স ও পাঠ' },
  { value: 'people', label: 'আলিম ও লেখক' },
  { value: 'circles', label: 'হালাকা' },
  { value: 'site', label: 'সাইট (হোম, পরিচিতি, SEO)' },
] as const

export type MediaFolder = (typeof MEDIA_FOLDERS)[number]['value']

const isFolder = (value: unknown): value is MediaFolder =>
  MEDIA_FOLDERS.some((f) => f.value === value)

/** The folder an "auto" upload goes to, from its MIME type. */
export function typeFolder(mimeType?: string | null): string {
  if (!mimeType) return 'files'
  if (mimeType.startsWith('image/')) return 'images'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType === 'application/pdf') return 'documents'
  return 'files'
}

/** The object prefix for a new upload, e.g. `media/articles/2026/10` or `media/images/2026/10`. */
export function mediaPrefix(folder: unknown, mimeType?: string | null, date = new Date()): string {
  const name = isFolder(folder) && folder !== 'auto' ? folder : typeFolder(mimeType)
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `media/${name}/${date.getUTCFullYear()}/${month}`
}
