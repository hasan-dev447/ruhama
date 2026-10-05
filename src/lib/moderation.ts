/** Automatic flagging for forum posts. Flagged posts wait for a moderator instead of going live. */

export type FlagReason =
  'new_member' | 'blocked_term' | 'too_many_links' | 'shouting' | 'repetition'

export const FLAG_LABELS: Record<FlagReason, string> = {
  new_member: 'নতুন সদস্যের প্রথম দিকের পোস্ট',
  blocked_term: 'নিষিদ্ধ শব্দ',
  too_many_links: 'অনেক লিংক',
  shouting: 'বড় হাতের অক্ষরে চিৎকার',
  repetition: 'একই অক্ষর বা শব্দের অস্বাভাবিক পুনরাবৃত্তি',
}

export type ModerationRules = {
  firstPostsModerated: number
  maxLinks: number
  blockedTerms: string[]
}

export type AuthorStanding = { approvedPosts: number; trusted: boolean; staff: boolean }

const URL_RE = /\b(?:https?:\/\/|www\.)\S+/gi

/** Normalise for term matching: lower case, no joiners or diacritic variants of য়/ড়/ঢ়. */
const fold = (s: string) =>
  s
    .normalize('NFC')
    .toLowerCase()
    .replace(/য়/g, 'য়')
    .replace(/ড়/g, 'ড়')
    .replace(/ঢ়/g, 'ঢ়')
    .replace(/[​-‍]/g, '')

export function flagReasons(
  text: string,
  rules: ModerationRules,
  author: AuthorStanding,
): FlagReason[] {
  if (author.staff) return []
  const reasons: FlagReason[] = []
  if (!author.trusted && author.approvedPosts < rules.firstPostsModerated)
    reasons.push('new_member')

  const folded = fold(text)
  if (rules.blockedTerms.some((t) => t.trim() && folded.includes(fold(t.trim()))))
    reasons.push('blocked_term')

  const links = text.match(URL_RE)?.length ?? 0
  if (links > rules.maxLinks) reasons.push('too_many_links')

  const latin = text.replace(/[^A-Za-z]/g, '')
  if (latin.length >= 20 && latin.replace(/[^A-Z]/g, '').length / latin.length > 0.7)
    reasons.push('shouting')

  // \b is ASCII-only in JS, so words are delimited by whitespace (works for Bangla)
  if (/(.)\1{9,}/u.test(text) || /(?:^|\s)(\S+)(?:\s+\1){5,}(?=\s|$)/u.test(text))
    reasons.push('repetition')
  return reasons
}

export const linkCount = (text: string) => text.match(URL_RE)?.length ?? 0
