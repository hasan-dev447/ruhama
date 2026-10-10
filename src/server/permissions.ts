import {
  abilityFor,
  atLeast,
  entersAdmin,
  levelFor,
  rolesWithAbility,
  rolesWithLevel,
  WORKFLOW_MENUS,
  type Level,
  type PermissionMatrix,
  type WorkflowFallback,
} from '@/lib/permissions'
import { rolesOf, type Role } from '@/lib/roles'

import { getRules, peekRules } from './rules'

/**
 * The saved role permissions (the "role-permissions" global, see lib/permissions.ts), cached for a
 * minute per server instance like the menu rules. Saving clears the cache of the instance that
 * saved; others follow within the minute.
 */

const TTL_MS = 60_000
let cache: { value: PermissionMatrix; at: number } | null = null
let inflight: Promise<PermissionMatrix> | null = null

async function readStored(): Promise<PermissionMatrix> {
  try {
    const { getPayloadClient } = await import('./payload')
    const payload = await getPayloadClient()
    const doc = (await payload.findGlobal({
      slug: 'role-permissions',
      depth: 0,
      overrideAccess: true,
      select: { matrix: true },
    })) as { matrix?: unknown }
    return doc.matrix && typeof doc.matrix === 'object' ? (doc.matrix as PermissionMatrix) : {}
  } catch {
    // not migrated yet or the database is unreachable: the defaults (today's behaviour) apply
    return {}
  }
}

export async function getMatrix(force = false): Promise<PermissionMatrix> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.value
  inflight ??= readStored()
    .then((value) => {
      cache = { value, at: Date.now() }
      return value
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

/** Without waiting (for synchronous checks such as which menus show): cached, else defaults. */
export function peekMatrix(): PermissionMatrix {
  if (!cache || Date.now() - cache.at >= TTL_MS) void getMatrix().catch(() => null)
  return cache?.value ?? {}
}

export function invalidatePermissions() {
  cache = null
}

/** Reviewers and publishers saved in the workflow menus' rules: the defaults for those abilities. */
export async function workflowFallback(): Promise<WorkflowFallback> {
  const out: WorkflowFallback = {}
  for (const slug of WORKFLOW_MENUS) {
    const r = (await getRules(slug)) as { reviewerRoles?: Role[]; publisherRoles?: Role[] }
    out[slug] = {
      reviewerRoles: r.reviewerRoles ?? ['super_admin', 'shura', 'reviewer'],
      publisherRoles: r.publisherRoles ?? ['super_admin', 'shura'],
    }
  }
  return out
}

export function peekWorkflowFallback(): WorkflowFallback {
  const out: WorkflowFallback = {}
  for (const slug of WORKFLOW_MENUS) {
    const r = peekRules(slug) as { reviewerRoles?: Role[]; publisherRoles?: Role[] }
    out[slug] = {
      reviewerRoles: r.reviewerRoles ?? ['super_admin', 'shura', 'reviewer'],
      publisherRoles: r.publisherRoles ?? ['super_admin', 'shura'],
    }
  }
  return out
}

type WithRoles = unknown

/** The user's level in an admin menu (the highest of their roles). */
export async function levelOf(user: WithRoles, slug: string): Promise<Level> {
  if (!user) return 'none'
  return levelFor(await getMatrix(), rolesOf(user), slug)
}

export async function hasLevel(user: WithRoles, slug: string, min: Level): Promise<boolean> {
  return atLeast(await levelOf(user, slug), min)
}

/** An ability that is not one menu (forum.moderate, users.roles, roles.manage, review:…, publish:…). */
export async function can(user: WithRoles, key: string): Promise<boolean> {
  if (!user) return false
  return abilityFor(await getMatrix(), rolesOf(user), key, await workflowFallback())
}

/** May this user open the admin panel? (any menu at "দেখা" or more, or any ability) */
export async function canEnterAdmin(user: WithRoles): Promise<boolean> {
  if (!user) return false
  return entersAdmin(await getMatrix(), rolesOf(user), await workflowFallback())
}

/** Roles reaching a level in a menu, e.g. who to notify about a pending profile. */
export async function rolesAt(slug: string, min: Level): Promise<Role[]> {
  return rolesWithLevel(await getMatrix(), slug, min)
}

export async function rolesWhoCan(key: string): Promise<Role[]> {
  return rolesWithAbility(await getMatrix(), key, await workflowFallback())
}

/** What the site header and forum need to know about the signed-in user. */
export async function myAbilities(user: WithRoles) {
  return {
    admin: await canEnterAdmin(user),
    moderate: await can(user, 'forum.moderate'),
  }
}
