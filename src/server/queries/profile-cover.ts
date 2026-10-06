import type { Payload } from 'payload'

import { bn } from '@/lib/format'
import { readPrivacy } from '@/lib/profile-privacy'
import { ayahReference, surahPath } from '@/lib/quran-meta'

/** What a member put on their profile cover: an ayah, a hadith or their own words. */
export type ProfileCover = {
  kind: 'ayah' | 'hadith' | 'text'
  arabic: string | null
  text: string
  reference: string | null
  href: string | null
}

type StoredCover =
  | {
      kind?: string | null
      ayahKey?: string | null
      hadithKey?: string | null
      text?: string | null
      source?: string | null
    }
  | null
  | undefined

export async function resolveCover(
  payload: Payload,
  cover: StoredCover,
): Promise<ProfileCover | null> {
  if (!cover?.kind || cover.kind === 'none') return null
  if (cover.kind === 'text') {
    return cover.text
      ? {
          kind: 'text',
          arabic: null,
          text: cover.text,
          reference: cover.source || null,
          href: null,
        }
      : null
  }
  if (cover.kind === 'ayah' && cover.ayahKey) {
    const res = await payload.find({
      collection: 'ayahs',
      where: { key: { equals: cover.ayahKey } },
      select: { surah: true, ayah: true, arabic: true, translation: true },
      depth: 0,
      limit: 1,
    })
    const a = res.docs[0]
    if (!a) return null
    return {
      kind: 'ayah',
      arabic: a.arabic,
      text: a.translation,
      reference: ayahReference(a.surah, a.ayah),
      href: surahPath(a.surah, a.ayah),
    }
  }
  if (cover.kind === 'hadith' && cover.hadithKey) {
    const res = await payload.find({
      collection: 'hadiths',
      where: { key: { equals: cover.hadithKey } },
      select: { arabic: true, text: true, number: true, numberLabel: true, book: true },
      populate: { 'hadith-collections': { name: true, slug: true } },
      depth: 1,
      limit: 1,
    })
    const h = res.docs[0]
    const book =
      h?.book && typeof h.book === 'object' ? (h.book as { name: string; slug: string }) : null
    if (!h || !book) return null
    return {
      kind: 'hadith',
      arabic: h.arabic ?? null,
      text: h.text,
      reference: `${book.name} : ${bn(h.numberLabel ?? h.number)}`,
      href: `/hadith/${book.slug}/${h.number}`,
    }
  }
  return null
}

/**
 * Cover and photo for a scholar or speaker page. The page is public and cached, so a linked member's
 * own cover and photo appear only if their profile is open to everyone and those parts are shown.
 * A photo the admin set on the profile itself comes first.
 */
export async function getPersonExtras(
  payload: Payload,
  person: { user?: unknown; photo?: unknown },
): Promise<{ cover: ProfileCover | null; photo: { src: string; large: string } | null }> {
  type PhotoDoc = { url?: string | null; sizes?: { card?: { url?: string | null } | null } | null }
  const adminPhoto: PhotoDoc | null =
    typeof person.photo === 'number'
      ? ((await payload
          .findByID({ collection: 'media', id: person.photo, depth: 0 })
          .catch(() => null)) as PhotoDoc | null)
      : person.photo && typeof person.photo === 'object'
        ? (person.photo as PhotoDoc)
        : null
  const fromAdmin = adminPhoto?.url
    ? { src: adminPhoto.sizes?.card?.url ?? adminPhoto.url, large: adminPhoto.url }
    : null
  const userId =
    person.user && typeof person.user === 'object'
      ? (person.user as { id: number }).id
      : (person.user as number | null | undefined)
  if (!userId) return { cover: null, photo: fromAdmin }
  const u = await payload
    .findByID({
      collection: 'users',
      id: userId,
      select: { gender: true, avatar: true, cover: true, privacy: true },
      depth: 1,
      overrideAccess: true,
    })
    .catch(() => null)
  if (!u) return { cover: null, photo: fromAdmin }
  const privacy = readPrivacy(u.privacy)
  const open = privacy.visibility === 'public'
  const avatar = u.avatar && typeof u.avatar === 'object' ? u.avatar : null
  const own =
    open && privacy.showPhoto && u.gender === 'male' && avatar?.url
      ? { src: avatar.sizes?.md?.url ?? avatar.url, large: avatar.sizes?.lg?.url ?? avatar.url }
      : null
  return {
    cover: open && privacy.showCover ? await resolveCover(payload, u.cover) : null,
    photo: fromAdmin ?? own,
  }
}
