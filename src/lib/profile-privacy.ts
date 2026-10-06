/**
 * Who may see a member's profile, and which parts. Shared by the settings page, the profile page and
 * the server checks, so they always agree.
 */

export const VISIBILITY = [
  { value: 'public', label: 'সবাই', hint: 'যে কেউ প্রোফাইল দেখতে পারবে।' },
  { value: 'members', label: 'শুধু সদস্যরা', hint: 'লগইন করা সদস্যরাই দেখতে পারবেন।' },
  { value: 'custom', label: 'নির্দিষ্ট কয়েকজন', hint: 'আপনি যাদের বেছে নেবেন, শুধু তাঁরা।' },
  { value: 'private', label: 'শুধু আমি (লক করা)', hint: 'নাম ছাড়া কেউ কিছু দেখবে না।' },
] as const

export type Visibility = (typeof VISIBILITY)[number]['value']

export const SECTIONS = [
  { key: 'showPhoto', label: 'প্রোফাইল ছবি', hint: 'ছবি না দেখালে আদ্যক্ষর দেখাবে।' },
  { key: 'showCover', label: 'কভারের আয়াত বা হাদিস', hint: '' },
  { key: 'showBio', label: 'সংক্ষিপ্ত পরিচিতি', hint: '' },
  { key: 'showDistrict', label: 'জেলা', hint: '' },
  { key: 'showJourney', label: 'যাত্রার ধাপ', hint: '' },
  { key: 'showActivity', label: 'কার্যক্রম ও সম্পন্ন কোর্স', hint: '' },
] as const

export type SectionKey = (typeof SECTIONS)[number]['key']

export type ProfilePrivacy = {
  visibility: Visibility
  allowedViewers: number[]
} & Record<SectionKey, boolean>

export const MAX_ALLOWED_VIEWERS = 50

const isVisibility = (v: unknown): v is Visibility => VISIBILITY.some((x) => x.value === v)

/** Normalise stored privacy (older rows have `profilePublic` only). */
export function readPrivacy(raw: unknown): ProfilePrivacy {
  const p = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const visibility = isVisibility(p.visibility)
    ? p.visibility
    : p.profilePublic === false
      ? 'private'
      : 'public'
  const viewers = Array.isArray(p.allowedViewers) ? p.allowedViewers : []
  return {
    visibility,
    allowedViewers: viewers
      .map((v) => (v && typeof v === 'object' ? (v as { id: unknown }).id : v))
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0),
    showPhoto: p.showPhoto !== false,
    showCover: p.showCover !== false,
    showBio: p.showBio !== false,
    showDistrict: p.showDistrict !== false,
    showJourney: p.showJourney !== false,
    showActivity: p.showActivity !== false,
  }
}

/** Can this viewer open the profile? Owners and staff always can. */
export function canViewProfile(
  privacy: ProfilePrivacy,
  viewer: { id: number; staff: boolean } | null,
  ownerId: number,
): boolean {
  if (viewer && (viewer.id === ownerId || viewer.staff)) return true
  switch (privacy.visibility) {
    case 'public':
      return true
    case 'members':
      return Boolean(viewer)
    case 'custom':
      return Boolean(viewer && privacy.allowedViewers.includes(viewer.id))
    default:
      return false
  }
}
