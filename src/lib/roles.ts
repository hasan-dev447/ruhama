/**
 * Roles shared by the server, the admin panel and the client.
 * A user's `role` field is an array (Payload multi-select).
 */
export const ROLES = [
  'super_admin',
  'shura',
  'reviewer',
  'editor',
  'author',
  'moderator',
  // public profile roles: a page under আলিম, লেখক ও বক্তা, no admin panel access
  'scholar',
  'speaker',
  'member',
] as const
export type Role = (typeof ROLES)[number]

export const STAFF_ROLES: Role[] = [
  'super_admin',
  'shura',
  'reviewer',
  'editor',
  'author',
  'moderator',
]
export const CONTENT_ROLES: Role[] = ['super_admin', 'shura', 'reviewer', 'editor', 'author']
export const REVIEWER_ROLES: Role[] = ['super_admin', 'shura', 'reviewer']
export const PUBLISHER_ROLES: Role[] = ['super_admin', 'shura']
export const EDITOR_ROLES: Role[] = ['super_admin', 'shura', 'editor']
export const MODERATOR_ROLES: Role[] = ['super_admin', 'shura', 'moderator']
export const ADMIN_ROLES: Role[] = ['super_admin', 'shura']

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'সুপার অ্যাডমিন',
  shura: 'শূরা',
  reviewer: 'রিভিউয়ার',
  editor: 'সম্পাদক',
  author: 'লেখক',
  moderator: 'মডারেটর',
  scholar: 'আলিম',
  speaker: 'বক্তা',
  member: 'সদস্য',
}

/**
 * The roles that come with a public profile (আলিম, লেখক ও বক্তা) and the "ভূমিকা" each one shows
 * there. Which of them actually create a profile is the people menu's rule (lib/collection-rules).
 */
export const PROFILE_KIND_OF: Partial<Record<Role, 'scholar' | 'author' | 'reviewer' | 'speaker'>> =
  {
    scholar: 'scholar',
    speaker: 'speaker',
    author: 'author',
    reviewer: 'reviewer',
  }

type WithRole = unknown

export function rolesOf(user: WithRole): Role[] {
  const raw = (user as { role?: unknown } | null | undefined)?.role
  if (Array.isArray(raw)) return raw.filter((r): r is Role => ROLES.includes(r as Role))
  if (typeof raw === 'string')
    return raw
      .split(',')
      .map((r) => r.trim())
      .filter((r): r is Role => ROLES.includes(r as Role))
  return []
}

export function hasRole(user: WithRole, ...roles: Role[]): boolean {
  const mine = rolesOf(user)
  return roles.some((r) => mine.includes(r))
}

export const isStaff = (user: WithRole) => hasRole(user, ...STAFF_ROLES)
export const isPublisher = (user: WithRole) => hasRole(user, ...PUBLISHER_ROLES)
export const isReviewer = (user: WithRole) => hasRole(user, ...REVIEWER_ROLES)
export const isModerator = (user: WithRole) => hasRole(user, ...MODERATOR_ROLES)
export const isEditor = (user: WithRole) => hasRole(user, ...EDITOR_ROLES)
export const isAdmin = (user: WithRole) => hasRole(user, ...ADMIN_ROLES)
