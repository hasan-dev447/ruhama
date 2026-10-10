import { z } from 'zod'

import {
  ABILITIES,
  abilityFor,
  allAbilityKeys,
  cleanRolePermissions,
  defaultAbility,
  defaultLevel,
  isWorkflowAbility,
  LEVEL_LABELS,
  levelFor,
  MENU_BY_SLUG,
  MENUS,
  permissionEditProblem,
  roleAbility,
  roleAssignProblem,
  roleLevel,
  type Level,
  type PermissionMatrix,
  type RolePermissions,
} from '@/lib/permissions'
import { ROLE_LABELS, ROLES, rolesOf, type Role } from '@/lib/roles'

import { getMatrix, invalidatePermissions, workflowFallback } from '../permissions'
import type { ServiceContext } from './context'
import { requireUser } from './context'
import { errors } from './errors'

/**
 * The রোল ও অনুমতি page: each role's permissions and who holds which role. Every change is checked
 * (lib/permissions.ts: permissionEditProblem, roleAssignProblem) and written to the audit log.
 */

const roleSchema = z.enum(ROLES)

async function mustEnter(ctx: ServiceContext) {
  // an admin tool: like the rest of the admin panel, it does not wait for the member onboarding
  const user = requireUser(ctx, { allowIncomplete: true })
  const matrix = await getMatrix()
  const fallback = await workflowFallback()
  const roles = rolesOf(user)
  const isSuper = roles.includes('super_admin')
  const canManage = isSuper || abilityFor(matrix, roles, 'roles.manage', fallback)
  const canAssign = isSuper || abilityFor(matrix, roles, 'users.roles', fallback)
  if (!canManage && !canAssign) throw errors.forbidden('এই পাতা দেখার অনুমতি আপনার নেই।')
  return { user, roles, matrix, fallback, isSuper, canManage, canAssign }
}

/** Everything the page needs on load. */
export async function rolesOverview(ctx: ServiceContext) {
  const { user, roles, matrix, fallback, isSuper, canManage, canAssign } = await mustEnter(ctx)
  const counts = Object.fromEntries(
    await Promise.all(
      ROLES.map(async (r) => {
        const res = await ctx.payload.count({
          collection: 'users',
          where: { role: { in: [r] } },
          overrideAccess: true,
        })
        return [r, res.totalDocs] as const
      }),
    ),
  ) as Record<Role, number>
  return {
    me: {
      id: user.id,
      roles,
      isSuper,
      canManage,
      canAssign,
      levels: Object.fromEntries(MENUS.map((m) => [m.slug, levelFor(matrix, roles, m.slug)])),
      abilities: Object.fromEntries(
        allAbilityKeys().map((k) => [k, abilityFor(matrix, roles, k, fallback)]),
      ),
    },
    matrix,
    fallback,
    counts,
  }
}

const permsSchema = z.object({
  menus: z.record(z.string(), z.string()).optional().default({}),
  abilities: z.record(z.string(), z.boolean()).optional().default({}),
})

/** Readable list of what changed for the audit log, e.g. "প্রবন্ধ: নিজের → এডিট". */
function describeChanges(
  role: Role,
  before: PermissionMatrix,
  after: PermissionMatrix,
  fallback: Awaited<ReturnType<typeof workflowFallback>>,
): string[] {
  const out: string[] = []
  for (const m of MENUS) {
    const a = roleLevel(before, role, m.slug)
    const b = roleLevel(after, role, m.slug)
    if (a !== b) out.push(`${m.label}: ${LEVEL_LABELS[a].label} → ${LEVEL_LABELS[b].label}`)
  }
  for (const key of allAbilityKeys()) {
    const a = roleAbility(before, role, key, fallback)
    const b = roleAbility(after, role, key, fallback)
    if (a === b) continue
    out.push(`${abilityLabel(key)}: ${b ? 'চালু' : 'বন্ধ'}`)
  }
  return out
}

export function abilityLabel(key: string) {
  const wf = /^(review|publish):(.+)$/.exec(key)
  if (wf) return `${MENU_BY_SLUG[wf[2]]?.label ?? wf[2]} ${wf[1] === 'review' ? 'রিভিউ' : 'প্রকাশ'}`
  return ABILITIES.find((a) => a.key === key)?.label ?? key
}

/** Save one role's permissions (the full wanted state; values equal to the defaults are dropped). */
export async function saveRolePermissions(
  ctx: ServiceContext,
  roleRaw: string,
  input: z.input<typeof permsSchema>,
) {
  const { user, roles, matrix, fallback } = await mustEnter(ctx)
  const role = roleSchema.parse(roleRaw)
  const parsed = permsSchema.parse(input)
  const next: RolePermissions = cleanRolePermissions(role, parsed, fallback)
  const problem = permissionEditProblem({ matrix, actorRoles: roles, role, next, fallback })
  if (problem) throw errors.forbidden(problem)

  const after: PermissionMatrix = { ...matrix, [role]: next }
  const changes = describeChanges(role, matrix, after, fallback)
  if (!changes.length) return { changed: 0 }

  await ctx.payload.updateGlobal({
    slug: 'role-permissions',
    data: { matrix: after },
    depth: 0,
    overrideAccess: true,
  })
  invalidatePermissions()
  // a workflow menu's own saved list follows, so its rules panel and old readers agree
  await syncWorkflowLists(ctx, after, fallback)
  await ctx.payload.create({
    collection: 'audit-logs',
    data: {
      action: 'permissions_change',
      actor: user.id,
      targetCollection: 'role-permissions',
      targetId: role,
      summary: `${ROLE_LABELS[role]}: ${changes.join('; ')}`.slice(0, 1000),
    },
    overrideAccess: true,
  })
  return { changed: changes.length }
}

/** Keep the workflow menus' reviewer and publisher lists equal to the role page. */
async function syncWorkflowLists(
  ctx: ServiceContext,
  matrix: PermissionMatrix,
  fallback: Awaited<ReturnType<typeof workflowFallback>>,
) {
  const current = (await ctx.payload.findGlobal({
    slug: 'collection-rules',
    depth: 0,
    overrideAccess: true,
  })) as { rules?: Record<string, Record<string, unknown>> | null }
  const rules = { ...(current.rules ?? {}) }
  let touched = false
  for (const key of allAbilityKeys().filter(isWorkflowAbility)) {
    const [kind, slug] = key.split(':') as ['review' | 'publish', string]
    const list = ROLES.filter((r) => roleAbility(matrix, r, key, fallback))
    const field = kind === 'review' ? 'reviewerRoles' : 'publisherRoles'
    const before = (rules[slug]?.[field] as Role[] | undefined) ?? fallback[slug]?.[field]
    if (JSON.stringify(before) === JSON.stringify(list)) continue
    rules[slug] = { ...(rules[slug] ?? {}), [field]: list }
    touched = true
  }
  if (!touched) return
  await ctx.payload.updateGlobal({
    slug: 'collection-rules',
    data: { rules },
    depth: 0,
    overrideAccess: true,
    context: { skipRulesAudit: true },
  })
}

export type RoleMember = {
  id: number
  name: string
  contact: string | null
  username: string | null
  image: string | null
  roles: Role[]
}

const toMember = (u: Record<string, unknown>): RoleMember => {
  const email = (u.email as string | null) ?? null
  return {
    id: u.id as number,
    name: (u.name as string) || 'নাম নেই',
    contact:
      email && !email.endsWith('.phone.ruhama.local')
        ? email
        : ((u.phoneNumber as string | null) ?? null),
    username: (u.username as string | null) ?? null,
    image: (u.image as string | null) ?? null,
    roles: rolesOf(u),
  }
}

const MEMBER_SELECT = {
  name: true,
  email: true,
  phoneNumber: true,
  username: true,
  image: true,
  role: true,
} as const

/** People holding a role (members: only the count, the list would be everyone). */
export async function roleMembers(ctx: ServiceContext, roleRaw: string, page = 1) {
  await mustEnter(ctx)
  const role = roleSchema.parse(roleRaw)
  const res = await ctx.payload.find({
    collection: 'users',
    where: { role: { in: [role] } },
    select: MEMBER_SELECT,
    depth: 0,
    sort: 'name',
    limit: 50,
    page,
    overrideAccess: true,
  })
  return {
    docs: res.docs.map((d) => toMember(d as never)),
    totalDocs: res.totalDocs,
    hasNextPage: res.hasNextPage,
  }
}

/** Find a person to give a role to (name, username, email or mobile). */
export async function searchUsersForRoles(ctx: ServiceContext, q: string) {
  const { canAssign } = await mustEnter(ctx)
  if (!canAssign) throw errors.forbidden()
  const term = q.trim().toLowerCase().slice(0, 80)
  if (term.length < 2) return { docs: [] as RoleMember[] }
  const res = await ctx.payload.find({
    collection: 'users',
    where: {
      or: [
        { name: { like: term } },
        { username: { like: term } },
        { contactsIndex: { like: term } },
      ],
    },
    select: MEMBER_SELECT,
    depth: 0,
    limit: 8,
    overrideAccess: true,
  })
  return { docs: res.docs.map((d) => toMember(d as never)) }
}

const assignSchema = z.object({
  userId: z.coerce.number().int().positive(),
  role: roleSchema,
  add: z.boolean(),
})

/** Give a role to a person or take it away (their public profile follows, see Users hooks). */
export async function assignRole(ctx: ServiceContext, input: z.input<typeof assignSchema>) {
  const { user, roles, matrix, fallback, canAssign } = await mustEnter(ctx)
  if (!canAssign) throw errors.forbidden('রোল দেওয়া বা সরানোর অনুমতি আপনার নেই।')
  const { userId, role, add } = assignSchema.parse(input)
  const target = await ctx.payload
    .findByID({
      collection: 'users',
      id: userId,
      depth: 0,
      select: MEMBER_SELECT,
      overrideAccess: true,
    })
    .catch(() => null)
  if (!target) throw errors.notFound('সদস্যকে পাওয়া যায়নি।')
  const targetRoles = rolesOf(target)
  const problem = roleAssignProblem({
    matrix,
    actorRoles: roles,
    actorId: user.id,
    targetId: userId,
    targetRoles,
    role,
    add,
    fallback,
  })
  if (problem) throw errors.forbidden(problem)
  if (add === targetRoles.includes(role)) return { roles: targetRoles }
  if (!add && role === 'super_admin') {
    const supers = await ctx.payload.count({
      collection: 'users',
      where: { role: { in: ['super_admin'] } },
      overrideAccess: true,
    })
    if (supers.totalDocs <= 1) throw errors.conflict('অন্তত একজন সুপার অ্যাডমিন থাকতে হবে।')
  }

  let next = add ? [...targetRoles, role] : targetRoles.filter((r) => r !== role)
  // "সদস্য" is the base role: everyone keeps it unless they hold another one
  if (!next.length) next = ['member']
  if (add && role !== 'member' && next.includes('member') && next.length > 1)
    next = next.filter((r) => r !== 'member')
  const ordered = ROLES.filter((r) => next.includes(r))
  await ctx.payload.update({
    collection: 'users',
    id: userId,
    data: { role: ordered } as never,
    depth: 0,
    overrideAccess: true,
    user,
    context: { roleChangeChecked: true },
  })
  return { roles: ordered }
}

/** A person's effective permissions, for the "এই সদস্য কী পারেন" view. */
export async function memberPermissions(ctx: ServiceContext, userId: number) {
  await mustEnter(ctx)
  const target = await ctx.payload
    .findByID({
      collection: 'users',
      id: userId,
      depth: 0,
      select: MEMBER_SELECT,
      overrideAccess: true,
    })
    .catch(() => null)
  if (!target) throw errors.notFound()
  const matrix = await getMatrix()
  const fallback = await workflowFallback()
  const r = rolesOf(target)
  return {
    member: toMember(target as never),
    levels: Object.fromEntries(MENUS.map((m) => [m.slug, levelFor(matrix, r, m.slug)])) as Record<
      string,
      Level
    >,
    abilities: Object.fromEntries(
      allAbilityKeys().map((k) => [k, abilityFor(matrix, r, k, fallback)]),
    ),
  }
}

export { defaultAbility, defaultLevel }
