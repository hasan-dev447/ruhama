import type { Endpoint } from 'payload'
import { z } from 'zod'

import {
  assignRole,
  memberPermissions,
  roleMembers,
  rolesOverview,
  saveRolePermissions,
  searchUsersForRoles,
} from '@/server/services/roles'
import { myAbilities } from '@/server/permissions'

import { param, query, readBody, v1 } from './helpers'

/** /api/v1/roles: the রোল ও অনুমতি page (server/services/roles.ts checks every change). */
export const rolesEndpoints: Endpoint[] = [
  v1('get', '/roles', async (_req, ctx) => rolesOverview(ctx)),
  v1('get', '/roles/users', async (req, ctx) =>
    searchUsersForRoles(ctx, query(req).get('q') ?? ''),
  ),
  v1('get', '/roles/users/:id', async (req, ctx) =>
    memberPermissions(ctx, Number(param(req, 'id'))),
  ),
  v1('post', '/roles/assign', async (req, ctx) =>
    assignRole(
      ctx,
      (await readBody(
        req,
        z.object({ userId: z.coerce.number(), role: z.string(), add: z.boolean() }),
      )) as never,
    ),
  ),
  v1('get', '/roles/:role/members', async (req, ctx) =>
    roleMembers(ctx, param(req, 'role'), Number(query(req).get('page') ?? 1) || 1),
  ),
  v1('put', '/roles/:role', async (req, ctx) =>
    saveRolePermissions(
      ctx,
      param(req, 'role'),
      await readBody(
        req,
        z.object({
          menus: z.record(z.string(), z.string()).optional(),
          abilities: z.record(z.string(), z.boolean()).optional(),
        }),
      ),
    ),
  ),
  // what the site header and the forum show the signed-in member (admin link, moderation tools)
  v1('get', '/me/abilities', async (_req, ctx) =>
    ctx.user ? myAbilities(ctx.user) : { admin: false, moderate: false },
  ),
]
