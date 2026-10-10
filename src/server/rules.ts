import {
  COLLECTION_RULES,
  DEFAULT_WORKFLOW_RULES,
  resolveRules,
  type RulesFor,
  type WorkflowRules,
} from '@/lib/collection-rules'
import type { Role } from '@/lib/roles'

/**
 * The saved rules of every admin menu (lib/collection-rules.ts), read from the "collection-rules"
 * global. Cached for a minute per server instance; saving clears the cache of the instance that
 * saved, others follow within the minute.
 */

const TTL_MS = 60_000
let cache: { value: Record<string, unknown>; at: number } | null = null
let inflight: Promise<Record<string, unknown>> | null = null

async function readStored(): Promise<Record<string, unknown>> {
  try {
    const { getPayloadClient } = await import('./payload')
    const payload = await getPayloadClient()
    const doc = (await payload.findGlobal({
      slug: 'collection-rules',
      depth: 0,
      overrideAccess: true,
    })) as { rules?: unknown }
    return doc.rules && typeof doc.rules === 'object' ? (doc.rules as Record<string, unknown>) : {}
  } catch {
    // not migrated yet or the database is unreachable: the defaults (the old fixed values) apply
    return {}
  }
}

async function loadAll(force = false) {
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

export function invalidateRules() {
  cache = null
}

/** One menu's rules: saved values where set, defaults for the rest. */
export async function getRules(slug: string): Promise<RulesFor> {
  if (!COLLECTION_RULES[slug]) return {}
  return resolveRules(slug, (await loadAll())[slug])
}

/**
 * One menu's rules without waiting, for synchronous checks such as which admin menus a role sees:
 * the cached values when loaded, the defaults until then (the load starts in the background).
 */
export function peekRules(slug: string): RulesFor {
  if (!COLLECTION_RULES[slug]) return {}
  if (!cache || Date.now() - cache.at >= TTL_MS) void loadAll().catch(() => null)
  return resolveRules(slug, cache?.value[slug])
}

/**
 * A workflow menu's rules. Who reviews and who publishes are set on the রোল ও অনুমতি page (the
 * menu's own saved lists are only the starting point for roles nobody has changed there).
 */
export async function getWorkflowRules(slug: string): Promise<WorkflowRules> {
  if (!COLLECTION_RULES[slug]) return DEFAULT_WORKFLOW_RULES
  const base = (await getRules(slug)) as unknown as WorkflowRules
  const { getMatrix } = await import('./permissions')
  const { rolesWithAbility, reviewKey, publishKey } = await import('@/lib/permissions')
  const matrix = await getMatrix()
  const fallback = {
    [slug]: { reviewerRoles: base.reviewerRoles, publisherRoles: base.publisherRoles },
  }
  return {
    ...base,
    reviewerRoles: rolesWithAbility(matrix, reviewKey(slug), fallback),
    publisherRoles: rolesWithAbility(matrix, publishKey(slug), fallback),
  }
}

/** Typed helpers for the other menus. */
export const eventRules = async () =>
  (await getRules('events')) as {
    defaultCapacity: number
    defaultMaxGuests: number
    closeRegistrationHoursBefore: number
  }

export const recapRules = async () =>
  (await getRules('event-recaps')) as { notifyRegistrants: boolean }

export const peopleRules = async () =>
  (await getRules('people')) as { profileRoles: Role[]; requireApproval: boolean }

export const userRules = async () =>
  (await getRules('users')) as {
    profilePhotoMaxMB: number
    maxExtraContacts: number
    contactCodeMinutes: number
  }
