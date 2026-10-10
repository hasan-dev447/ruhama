import type { CollectionConfig, Config, GlobalConfig } from 'payload'

import {
  abilityFor,
  atLeast,
  levelFor,
  MENU_BY_SLUG,
  publishKey,
  reviewKey,
} from '@/lib/permissions'
import { rolesOf } from '@/lib/roles'
import { peekMatrix, peekWorkflowFallback } from '@/server/permissions'

/**
 * A role sees an admin menu when the রোল ও অনুমতি page gives it "দেখা" or more there, or (in the
 * workflow menus) review or publish. This decides the sidebar, the dashboard and the command
 * palette; the access rules themselves come from the same page (payload/access/permissions.ts).
 * Menus marked `hidden: true` stay hidden (system tables, or managed inside another page).
 */

type WithUser = { user?: unknown }
type Hidden = boolean | ((args: WithUser) => boolean) | undefined

export function menuVisible(slug: string, user: unknown): boolean {
  const roles = rolesOf(user)
  if (roles.includes('super_admin')) return true
  const matrix = peekMatrix()
  const fallback = peekWorkflowFallback()
  if (slug === 'role-permissions')
    return (
      abilityFor(matrix, roles, 'users.roles', fallback) ||
      abilityFor(matrix, roles, 'roles.manage', fallback)
    )
  const menu = MENU_BY_SLUG[slug]
  // a menu outside the role page is for the super admin only
  if (!menu) return false
  if (atLeast(levelFor(matrix, roles, slug), 'view')) return true
  return (
    !!menu.workflow &&
    (abilityFor(matrix, roles, reviewKey(slug), fallback) ||
      abilityFor(matrix, roles, publishKey(slug), fallback))
  )
}

const wrap = (slug: string, original: Hidden): Hidden =>
  // the old role-based functions are replaced; only a fixed `true` is kept
  original === true ? true : ({ user }: WithUser) => !menuVisible(slug, user)

export function menuVisibility(config: Config): Config {
  return {
    ...config,
    collections: (config.collections ?? []).map((c: CollectionConfig) => ({
      ...c,
      admin: { ...c.admin, hidden: wrap(c.slug, c.admin?.hidden as Hidden) },
    })),
    globals: (config.globals ?? []).map((g: GlobalConfig) => ({
      ...g,
      admin: { ...g.admin, hidden: wrap(g.slug, g.admin?.hidden as Hidden) },
    })),
  }
}
