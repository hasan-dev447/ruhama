import type { Access, FieldAccess, Where } from 'payload'

import { atLeast, type Level } from '@/lib/permissions'
import { can, canEnterAdmin, levelOf } from '@/server/permissions'

/**
 * Access rules from the রোল ও অনুমতি page (lib/permissions.ts). Each menu's create, update and delete
 * follow the user's level there; "নিজের" (own) narrows edits to the user's own rows.
 */

type Own = (userId: number | string) => Where

const userIdOf = (req: { user?: unknown }) => (req.user as { id?: number | string } | null)?.id

/** create, update and delete of a collection menu by the user's level. */
export function menuAccess(
  slug: string,
  opts: { ownUpdate?: Own; ownDelete?: Own } = {},
): { create: Access; update: Access; delete: Access } {
  return {
    create: async ({ req }) => {
      const l = await levelOf(req.user, slug)
      return l === 'own' || l === 'add' || l === 'edit' || l === 'full'
    },
    update: async ({ req }) => {
      const l = await levelOf(req.user, slug)
      if (l === 'edit' || l === 'full') return true
      const id = userIdOf(req)
      if (l === 'own' && opts.ownUpdate && id !== undefined) return opts.ownUpdate(id)
      return false
    },
    delete: async ({ req }) => {
      const l = await levelOf(req.user, slug)
      if (l === 'full') return true
      const id = userIdOf(req)
      if (l === 'own' && opts.ownDelete && id !== undefined) return opts.ownDelete(id)
      return false
    },
  }
}

/**
 * Reading a menu: with "দেখা" or more everything (drafts and private rows too); with "নিজের" the
 * public rows plus the user's own; otherwise only the public rows (`publicWhere`, or nothing), and
 * rows owned by the user through `ownField` (their notifications, registrations…).
 */
export function menuRead(
  slug: string,
  opts: { publicWhere?: Where | true; ownField?: string; ownWhere?: Own } = {},
): Access {
  return async ({ req }) => {
    const l = await levelOf(req.user, slug)
    const id = userIdOf(req)
    if (atLeast(l, 'view') && l !== 'own') return true
    const or: Where[] = []
    if (opts.publicWhere === true) return true
    if (opts.publicWhere) or.push(opts.publicWhere)
    if (id !== undefined) {
      if (l === 'own' && opts.ownWhere) or.push(opts.ownWhere(id))
      else if (l === 'own') return true
      if (opts.ownField) or.push({ [opts.ownField]: { equals: id } })
    }
    if (!or.length) return false
    return or.length === 1 ? or[0] : { or }
  }
}

/** A global: read by `read` (default: everyone), changed with "এডিট". */
export function globalAccess(
  slug: string,
  read: Access = () => true,
): { read: Access; update: Access } {
  return {
    read,
    update: async ({ req }) => atLeast(await levelOf(req.user, slug), 'edit'),
  }
}

/** At least this level in a menu (for any access function). */
export const atLevel =
  (slug: string, min: Level): Access =>
  async ({ req }) =>
    atLeast(await levelOf(req.user, slug), min)

export const fieldAtLevel =
  (slug: string, min: Level): FieldAccess =>
  async ({ req }) =>
    atLeast(await levelOf(req.user, slug), min)

/** An ability (forum.moderate, users.roles…). */
export const ability =
  (key: string): Access =>
  async ({ req }) =>
    can(req.user, key)

export const fieldAbility =
  (key: string): FieldAccess =>
  async ({ req }) =>
    can(req.user, key)

/** Anyone allowed into the admin panel (staff, by the role page). */
export const adminUser: Access = async ({ req }) => canEnterAdmin(req.user)
export const fieldAdminUser: FieldAccess = async ({ req }) => canEnterAdmin(req.user)
