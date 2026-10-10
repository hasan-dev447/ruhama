import { ROLE_LABELS, ROLES, type Role } from './roles'

/**
 * রোল ও অনুমতি: what each role may do in each admin menu, plus a few abilities that are not a menu
 * (forum moderation, giving roles, reviewing, publishing). Shared by the server (access rules), the
 * admin panel and the role manager page.
 *
 * Only changes from the defaults below are stored (the "role-permissions" global), so a role keeps
 * today's behaviour until someone changes it. Super admin always has everything and cannot be
 * edited; only a super admin edits শূরা; anyone else allowed to manage roles never grants more than
 * they have themselves.
 */

export type Level = 'none' | 'view' | 'own' | 'add' | 'edit' | 'full'

/** Ordered from least to most. */
export const LEVEL_ORDER: Level[] = ['none', 'view', 'own', 'add', 'edit', 'full']
export const levelRank = (l: Level) => LEVEL_ORDER.indexOf(l)
export const atLeast = (l: Level, min: Level) => levelRank(l) >= levelRank(min)

export const LEVEL_LABELS: Record<Level, { label: string; hint: string }> = {
  none: { label: 'নেই', hint: 'মেনুটি দেখবেন না' },
  view: { label: 'দেখা', hint: 'শুধু দেখতে পারবেন, কিছু বদলাতে পারবেন না' },
  own: { label: 'নিজের', hint: 'নতুন লিখতে ও নিজের খসড়া এডিট করতে পারবেন' },
  add: { label: 'যোগ', hint: 'দেখা ও নতুন যোগ করা, আগেরগুলো বদলানো নয়' },
  edit: { label: 'এডিট', hint: 'যোগ ও সব এডিট করতে পারবেন, মুছতে পারবেন না' },
  full: { label: 'সম্পূর্ণ', hint: 'যোগ, এডিট ও মোছা, সব' },
}

/** The roles whose permissions can be changed (super admin always has everything). */
export const EDITABLE_ROLES = ROLES.filter((r) => r !== 'super_admin') as Exclude<
  Role,
  'super_admin'
>[]

export const ROLE_INFO: Record<Role, { description: string; tone: string }> = {
  super_admin: {
    description: 'সব অনুমতি, বদলানো যায় না। সাইটের মালিক ও প্রধান দায়িত্বশীল।',
    tone: 'gold',
  },
  shura: {
    description: 'পরামর্শ পরিষদ। সুপার অ্যাডমিন যতটুকু অনুমতি দেন, ততটুকু পরিচালনা করেন।',
    tone: 'teal',
  },
  editor: {
    description: 'কনটেন্ট সম্পাদনা ও প্রকাশের প্রস্তুতি, মজলিস ও সাইটের পাতা।',
    tone: 'deep',
  },
  reviewer: { description: 'লেখা যাচাই করে অনুমোদন বা সংশোধনের অনুরোধ।', tone: 'sage' },
  author: { description: 'প্রবন্ধ ও উত্তর লেখেন, রিভিউর জন্য পাঠান।', tone: 'sage' },
  moderator: { description: 'ফোরাম, মজলিস ও যোগাযোগের বার্তা দেখাশোনা।', tone: 'deep' },
  scholar: {
    description: 'পাবলিক প্রোফাইল (আলিম)। সাধারণত অ্যাডমিন প্যানেলের অনুমতি নেই।',
    tone: 'slate',
  },
  speaker: {
    description: 'পাবলিক প্রোফাইল (বক্তা)। সাধারণত অ্যাডমিন প্যানেলের অনুমতি নেই।',
    tone: 'slate',
  },
  member: { description: 'সাধারণ সদস্য। সাইট ব্যবহার করেন, অ্যাডমিন প্যানেল নয়।', tone: 'slate' },
}

const WORKFLOW_LEVELS: Level[] = ['none', 'view', 'own', 'edit', 'full']
const MENU_LEVELS: Level[] = ['none', 'view', 'edit', 'full']
const ADD_LEVELS: Level[] = ['none', 'view', 'add', 'edit', 'full']
const GLOBAL_LEVELS: Level[] = ['none', 'view', 'edit']

export type MenuDef = {
  slug: string
  label: string
  group: string
  kind: 'collection' | 'global'
  levels: Level[]
  /** review and publish workflow (its reviewers and publishers are set here too) */
  workflow?: boolean
  /** what "নিজের" means in this menu */
  ownHint?: string
}

type Defaults = Partial<Record<Exclude<Role, 'super_admin'>, Level>>
type MenuWithDefaults = MenuDef & { defaults: Defaults }

const STAFF_FULL: Defaults = { shura: 'full', editor: 'full' }

/** Every admin menu, in the sidebar's order and groups. */
const MENU_TABLE: MenuWithDefaults[] = [
  {
    slug: 'users',
    label: 'ইউজার',
    group: 'অ্যাকাউন্ট',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { shura: 'edit' },
  },
  {
    slug: 'audit-logs',
    label: 'অডিট লগ',
    group: 'অ্যাকাউন্ট',
    kind: 'collection',
    levels: ['none', 'view'],
    defaults: { shura: 'view' },
  },
  {
    slug: 'articles',
    label: 'প্রবন্ধ',
    group: 'ইলম কেন্দ্র',
    kind: 'collection',
    levels: WORKFLOW_LEVELS,
    workflow: true,
    ownHint: 'নতুন প্রবন্ধ লেখা এবং নিজের খসড়া বা ফেরত আসা লেখা এডিট',
    defaults: { ...STAFF_FULL, reviewer: 'own', author: 'own' },
  },
  {
    slug: 'ikhtilaf-topics',
    label: 'মতপার্থক্যের বিষয়',
    group: 'ইলম কেন্দ্র',
    kind: 'collection',
    levels: WORKFLOW_LEVELS,
    workflow: true,
    ownHint: 'নতুন বিষয় লেখা এবং নিজের খসড়া এডিট',
    defaults: { ...STAFF_FULL, reviewer: 'own', author: 'own' },
  },
  {
    slug: 'series',
    label: 'ধারাবাহিক',
    group: 'ইলম কেন্দ্র',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: STAFF_FULL,
  },
  {
    slug: 'questions',
    label: 'প্রশ্নোত্তর',
    group: 'প্রশ্নোত্তর',
    kind: 'collection',
    levels: WORKFLOW_LEVELS,
    workflow: true,
    ownHint: 'নিজের নামে দেওয়া প্রশ্নের উত্তর লেখা এবং নিজের খসড়া এডিট',
    defaults: { ...STAFF_FULL, reviewer: 'own', author: 'own', moderator: 'edit' },
  },
  {
    slug: 'answer-votes',
    label: 'উত্তরের মূল্যায়ন',
    group: 'প্রশ্নোত্তর',
    kind: 'collection',
    levels: ['none', 'view', 'full'],
    defaults: { shura: 'full' },
  },
  {
    slug: 'categories',
    label: 'বিষয়সমূহ',
    group: 'কনটেন্ট',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: STAFF_FULL,
  },
  {
    slug: 'tags',
    label: 'ট্যাগ',
    group: 'কনটেন্ট',
    kind: 'collection',
    levels: ADD_LEVELS,
    defaults: { ...STAFF_FULL, reviewer: 'add', author: 'add' },
  },
  {
    slug: 'media',
    label: 'মিডিয়া',
    group: 'কনটেন্ট',
    kind: 'collection',
    levels: ADD_LEVELS,
    defaults: { ...STAFF_FULL, reviewer: 'edit', author: 'edit' },
  },
  {
    slug: 'people',
    label: 'আলিম, লেখক ও বক্তা',
    group: 'মানুষ',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: STAFF_FULL,
  },
  {
    slug: 'courses',
    label: 'কোর্স',
    group: 'শেখার পথ',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { ...STAFF_FULL, reviewer: 'edit', author: 'edit' },
  },
  {
    slug: 'lessons',
    label: 'পাঠ',
    group: 'শেখার পথ',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { ...STAFF_FULL, reviewer: 'edit', author: 'edit' },
  },
  {
    slug: 'events',
    label: 'মজলিস',
    group: 'মজলিস ও সার্কেল',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { ...STAFF_FULL, moderator: 'edit' },
  },
  {
    slug: 'event-registrations',
    label: 'মজলিস রেজিস্ট্রেশন',
    group: 'মজলিস ও সার্কেল',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { shura: 'full', editor: 'edit', moderator: 'edit' },
  },
  {
    slug: 'event-recaps',
    label: 'মজলিসের সারসংক্ষেপ',
    group: 'মজলিস ও সার্কেল',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { ...STAFF_FULL, moderator: 'edit' },
  },
  {
    slug: 'circles',
    label: 'স্থানীয় সার্কেল',
    group: 'মজলিস ও সার্কেল',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { ...STAFF_FULL, moderator: 'edit' },
  },
  {
    slug: 'circle-meetups',
    label: 'সার্কেলের বৈঠক',
    group: 'মজলিস ও সার্কেল',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { ...STAFF_FULL, moderator: 'full' },
  },
  {
    slug: 'circle-memberships',
    label: 'সার্কেল সদস্যপদ',
    group: 'মজলিস ও সার্কেল',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { shura: 'full', editor: 'edit', moderator: 'edit' },
  },
  {
    slug: 'meetup-rsvps',
    label: 'বৈঠকে উপস্থিতি',
    group: 'মজলিস ও সার্কেল',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { shura: 'full' },
  },
  {
    slug: 'videos',
    label: 'ভিডিও',
    group: 'ভিডিও',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { ...STAFF_FULL, reviewer: 'edit', author: 'edit' },
  },
  {
    slug: 'playlists',
    label: 'প্লেলিস্ট',
    group: 'ভিডিও',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { ...STAFF_FULL, reviewer: 'edit', author: 'edit' },
  },
  ...(
    [
      ['surahs', 'সূরা'],
      ['ayahs', 'আয়াত'],
      ['hadith-collections', 'হাদিস গ্রন্থ'],
      ['hadiths', 'হাদিস'],
    ] as const
  ).map(([slug, label]): MenuWithDefaults => ({
    slug,
    label,
    group: 'কুরআন ও হাদিস',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { shura: 'full', editor: 'edit' },
  })),
  {
    slug: 'forum-categories',
    label: 'ফোরাম বিভাগ',
    group: 'ফোরাম',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { shura: 'full', moderator: 'edit' },
  },
  {
    slug: 'forum-threads',
    label: 'ফোরাম আলোচনা',
    group: 'ফোরাম',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { shura: 'full', moderator: 'edit' },
  },
  {
    slug: 'forum-posts',
    label: 'ফোরাম উত্তর',
    group: 'ফোরাম',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { shura: 'full', moderator: 'edit' },
  },
  {
    slug: 'reports',
    label: 'মডারেশন কিউ',
    group: 'ফোরাম',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { shura: 'full', moderator: 'edit' },
  },
  {
    slug: 'moderation-settings',
    label: 'মডারেশন নিয়ম',
    group: 'ফোরাম',
    kind: 'global',
    levels: GLOBAL_LEVELS,
    defaults: { shura: 'edit', moderator: 'edit' },
  },
  {
    slug: 'enrollments',
    label: 'এনরোলমেন্ট',
    group: 'সদস্য কার্যক্রম',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { shura: 'full' },
  },
  {
    slug: 'lesson-progress',
    label: 'পাঠের অগ্রগতি',
    group: 'সদস্য কার্যক্রম',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { shura: 'full' },
  },
  {
    slug: 'notifications',
    label: 'নোটিফিকেশন',
    group: 'সদস্য কার্যক্রম',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { shura: 'full' },
  },
  {
    slug: 'newsletter-subscribers',
    label: 'সাপ্তাহিক চিঠির গ্রাহক',
    group: 'যোগাযোগ',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { shura: 'full', editor: 'edit' },
  },
  {
    slug: 'volunteers',
    label: 'যুক্ত হওয়ার আবেদন',
    group: 'যোগাযোগ',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { shura: 'full', moderator: 'edit' },
  },
  {
    slug: 'contact-messages',
    label: 'যোগাযোগের বার্তা',
    group: 'যোগাযোগ',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: { shura: 'full', moderator: 'edit' },
  },
  {
    slug: 'pages',
    label: 'সাধারণ পাতা',
    group: 'সাইট',
    kind: 'collection',
    levels: MENU_LEVELS,
    defaults: STAFF_FULL,
  },
  {
    slug: 'home-page',
    label: 'হোম পেজ',
    group: 'সাইট',
    kind: 'global',
    levels: GLOBAL_LEVELS,
    defaults: { shura: 'edit', editor: 'edit' },
  },
  ...(
    [
      ['site-settings', 'সাইট সেটিংস'],
      ['about-page', 'আমাদের পরিচয় (ঘোষণাপত্র)'],
      ['adab-policy', 'আদব নীতিমালা'],
      ['integrations', 'ইন্টিগ্রেশন'],
      ['collection-rules', 'নিয়মাবলি'],
    ] as const
  ).map(([slug, label]): MenuWithDefaults => ({
    slug,
    label,
    group: 'সাইট',
    kind: 'global',
    levels: GLOBAL_LEVELS,
    defaults: { shura: 'edit' },
  })),
]

export const MENUS: MenuDef[] = MENU_TABLE.map(({ defaults: _d, ...m }) => m)
export const MENU_BY_SLUG: Record<string, MenuDef> = Object.fromEntries(
  MENUS.map((m) => [m.slug, m]),
)
export const WORKFLOW_MENUS = MENUS.filter((m) => m.workflow).map((m) => m.slug)

export type AbilityDef = { key: string; label: string; hint: string; group: string }

/** Abilities that are not one menu. Review and publish are per workflow menu (see below). */
export const ABILITIES: AbilityDef[] = [
  {
    key: 'forum.moderate',
    label: 'ফোরাম মডারেশন',
    hint: 'সাইটে মডারেশন পাতা, পোস্ট অনুমোদন, লুকানো ও রিপোর্টের সিদ্ধান্ত',
    group: 'বিশেষ দায়িত্ব',
  },
  {
    key: 'questions.answer',
    label: 'প্রশ্নের উত্তর লেখা',
    hint: 'প্রশ্নোত্তর মেনুতে উত্তর ও উত্তরদাতা লেখা (মেনুর অনুমতির পাশাপাশি)',
    group: 'বিশেষ দায়িত্ব',
  },
  {
    key: 'users.roles',
    label: 'রোল দেওয়া ও সরানো',
    hint: 'সদস্যদের রোল বদলানো (সুপার অ্যাডমিন ও শূরা রোল ছাড়া)',
    group: 'বিশেষ দায়িত্ব',
  },
  {
    key: 'roles.manage',
    label: 'রোলের অনুমতি বদলানো',
    hint: 'এই পাতায় অন্য রোলগুলোর অনুমতি ঠিক করা (নিজের চেয়ে বেশি দিতে পারবেন না)',
    group: 'বিশেষ দায়িত্ব',
  },
]

const ABILITY_DEFAULTS: Record<string, Exclude<Role, 'super_admin'>[]> = {
  'forum.moderate': ['shura', 'moderator'],
  'questions.answer': ['shura', 'editor', 'reviewer', 'author'],
  'users.roles': ['shura'],
  'roles.manage': ['shura'],
}

/** Review and publish keys of a workflow menu; their defaults come from that menu's rules. */
export const reviewKey = (slug: string) => `review:${slug}`
export const publishKey = (slug: string) => `publish:${slug}`
export const isWorkflowAbility = (key: string) => /^(review|publish):/.test(key)

export const allAbilityKeys = () => [
  ...ABILITIES.map((a) => a.key),
  ...WORKFLOW_MENUS.flatMap((s) => [reviewKey(s), publishKey(s)]),
]

/* ---------------- stored values and resolution ---------------- */

export type RolePermissions = { menus?: Record<string, Level>; abilities?: Record<string, boolean> }
export type PermissionMatrix = Partial<Record<Role, RolePermissions>>

/** Who reviews and publishes by default: the workflow menus' saved rules (their old setting). */
export type WorkflowFallback = Record<string, { reviewerRoles: Role[]; publisherRoles: Role[] }>

export function defaultLevel(role: Role, slug: string): Level {
  if (role === 'super_admin') return 'full'
  const m = MENU_TABLE.find((x) => x.slug === slug)
  return m?.defaults[role] ?? 'none'
}

export function defaultAbility(role: Role, key: string, fallback?: WorkflowFallback): boolean {
  if (role === 'super_admin') return true
  const wf = /^(review|publish):(.+)$/.exec(key)
  if (wf) {
    const f = fallback?.[wf[2]]
    const list =
      wf[1] === 'review'
        ? (f?.reviewerRoles ?? ['super_admin', 'shura', 'reviewer'])
        : (f?.publisherRoles ?? ['super_admin', 'shura'])
    return list.includes(role)
  }
  return (ABILITY_DEFAULTS[key] ?? []).includes(role as Exclude<Role, 'super_admin'>)
}

/** One role's level in one menu: the saved change, else the default. */
export function roleLevel(matrix: PermissionMatrix, role: Role, slug: string): Level {
  if (role === 'super_admin') return 'full'
  const saved = matrix[role]?.menus?.[slug]
  const menu = MENU_BY_SLUG[slug]
  if (saved && menu?.levels.includes(saved)) return saved
  return defaultLevel(role, slug)
}

export function roleAbility(
  matrix: PermissionMatrix,
  role: Role,
  key: string,
  fallback?: WorkflowFallback,
): boolean {
  if (role === 'super_admin') return true
  const saved = matrix[role]?.abilities?.[key]
  return typeof saved === 'boolean' ? saved : defaultAbility(role, key, fallback)
}

/** A user's level: the highest any of their roles gives. */
export function levelFor(matrix: PermissionMatrix, roles: Role[], slug: string): Level {
  let best: Level = 'none'
  for (const r of roles) {
    const l = roleLevel(matrix, r, slug)
    if (levelRank(l) > levelRank(best)) best = l
  }
  return best
}

export function abilityFor(
  matrix: PermissionMatrix,
  roles: Role[],
  key: string,
  fallback?: WorkflowFallback,
): boolean {
  return roles.some((r) => roleAbility(matrix, r, key, fallback))
}

/** Roles that reach a level in a menu (super admin always included). */
export function rolesWithLevel(matrix: PermissionMatrix, slug: string, min: Level): Role[] {
  return ROLES.filter((r) => atLeast(roleLevel(matrix, r, slug), min))
}

export function rolesWithAbility(
  matrix: PermissionMatrix,
  key: string,
  fallback?: WorkflowFallback,
): Role[] {
  return ROLES.filter((r) => roleAbility(matrix, r, key, fallback))
}

/** Can someone with these roles open the admin panel at all? */
export function entersAdmin(
  matrix: PermissionMatrix,
  roles: Role[],
  fallback?: WorkflowFallback,
): boolean {
  if (roles.includes('super_admin')) return true
  return (
    MENUS.some((m) => atLeast(levelFor(matrix, roles, m.slug), 'view')) ||
    allAbilityKeys().some((k) => abilityFor(matrix, roles, k, fallback))
  )
}

/** Keep only known menus, allowed levels and known abilities; drop values equal to the default. */
export function cleanRolePermissions(
  role: Role,
  input: unknown,
  fallback?: WorkflowFallback,
): RolePermissions {
  const src = (input && typeof input === 'object' ? input : {}) as RolePermissions
  const menus: Record<string, Level> = {}
  for (const [slug, level] of Object.entries(src.menus ?? {})) {
    const m = MENU_BY_SLUG[slug]
    if (!m || !m.levels.includes(level as Level)) continue
    if (level !== defaultLevel(role, slug)) menus[slug] = level as Level
  }
  const known = new Set(allAbilityKeys())
  const abilities: Record<string, boolean> = {}
  for (const [key, on] of Object.entries(src.abilities ?? {})) {
    if (!known.has(key) || typeof on !== 'boolean') continue
    if (on !== defaultAbility(role, key, fallback)) abilities[key] = on
  }
  return { menus, abilities }
}

export const roleLabel = (r: Role) => ROLE_LABELS[r]

/**
 * Can `actor` (with these roles) save this permission set for `role`? Super admin: any role but
 * super admin. Others need "roles.manage", never touch শূরা or super admin, and never grant a level
 * or ability above their own.
 */
export function permissionEditProblem(params: {
  matrix: PermissionMatrix
  actorRoles: Role[]
  role: Role
  next: RolePermissions
  fallback?: WorkflowFallback
}): string | null {
  const { matrix, actorRoles, role, next, fallback } = params
  if (role === 'super_admin') return 'সুপার অ্যাডমিনের অনুমতি বদলানো যায় না।'
  if (actorRoles.includes('super_admin')) return null
  if (!abilityFor(matrix, actorRoles, 'roles.manage', fallback))
    return 'রোলের অনুমতি বদলানোর অনুমতি আপনার নেই।'
  if (role === 'shura') return 'শূরার অনুমতি শুধু সুপার অ্যাডমিন বদলাতে পারেন।'
  for (const m of MENUS) {
    const want = next.menus?.[m.slug] ?? defaultLevel(role, m.slug)
    const before = roleLevel(matrix, role, m.slug)
    if (want === before) continue
    if (levelRank(want) > levelRank(levelFor(matrix, actorRoles, m.slug)))
      return `“${m.label}” মেনুতে আপনার নিজের যতটুকু অনুমতি, তার বেশি দিতে পারবেন না।`
  }
  for (const key of allAbilityKeys()) {
    const want = next.abilities?.[key] ?? defaultAbility(role, key, fallback)
    const before = roleAbility(matrix, role, key, fallback)
    if (want === before || !want) continue
    if (!abilityFor(matrix, actorRoles, key, fallback))
      return 'যে দায়িত্ব আপনার নিজের নেই, তা অন্য রোলকে দিতে পারবেন না।'
  }
  return null
}

/**
 * Can `actor` give or take `role` from a user who now has `targetRoles`? Super admin: anything
 * (but never their own super admin role). Others need "users.roles", and never touch super admin or
 * শূরা, neither the role nor a person who holds it.
 */
export function roleAssignProblem(params: {
  matrix: PermissionMatrix
  actorRoles: Role[]
  actorId: number | string
  targetId: number | string
  targetRoles: Role[]
  role: Role
  add: boolean
  fallback?: WorkflowFallback
}): string | null {
  const { matrix, actorRoles, actorId, targetId, targetRoles, role, add, fallback } = params
  const self = String(actorId) === String(targetId)
  if (actorRoles.includes('super_admin')) {
    if (self && role === 'super_admin' && !add)
      return 'নিজের সুপার অ্যাডমিন রোল নিজে সরানো যায় না।'
    return null
  }
  if (!abilityFor(matrix, actorRoles, 'users.roles', fallback))
    return 'রোল দেওয়া বা সরানোর অনুমতি আপনার নেই।'
  if (role === 'super_admin' || role === 'shura')
    return `${ROLE_LABELS[role]} রোল শুধু সুপার অ্যাডমিন দিতে বা সরাতে পারেন।`
  if (targetRoles.includes('super_admin') || targetRoles.includes('shura'))
    return 'সুপার অ্যাডমিন বা শূরার রোল শুধু সুপার অ্যাডমিন বদলাতে পারেন।'
  if (self) return 'নিজের রোল নিজে বদলানো যায় না।'
  return null
}

export const ALL_ROLES = ROLES
export { ROLE_LABELS }
