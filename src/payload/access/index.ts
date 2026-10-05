import type { Access, FieldAccess, PayloadRequest, Where } from 'payload'

import {
  ADMIN_ROLES,
  CONTENT_ROLES,
  EDITOR_ROLES,
  MODERATOR_ROLES,
  STAFF_ROLES,
  hasRole,
  type Role,
} from '@/lib/roles'

/* ---------------- collection-level ---------------- */

export const anyone: Access = () => true
export const nobody: Access = () => false
export const authenticated: Access = ({ req }) => Boolean(req.user)

export const roles =
  (...allowed: Role[]): Access =>
  ({ req }) =>
    hasRole(req.user, ...allowed)

export const staffOnly: Access = roles(...STAFF_ROLES)
export const adminsOnly: Access = roles(...ADMIN_ROLES)
export const editorsOnly: Access = roles(...EDITOR_ROLES)
export const moderatorsOnly: Access = roles(...MODERATOR_ROLES)
export const contentTeam: Access = roles(...CONTENT_ROLES)

/** Members may read/write only rows they own (by a `user` relationship); staff in `staff` roles see all. */
export const ownOrRoles =
  (field: string, ...staff: Role[]): Access =>
  ({ req }) => {
    if (!req.user) return false
    if (staff.length && hasRole(req.user, ...staff)) return true
    return { [field]: { equals: req.user.id } } as Where
  }

/** Public read of published versions; content staff read everything (including drafts). */
export const publishedOrStaff: Access = ({ req }) => {
  if (hasRole(req.user, ...STAFF_ROLES)) return true
  return { _status: { equals: 'published' } }
}

/** Public read of rows whose `status` field is `published`; staff read everything. */
export const statusPublishedOrStaff =
  (field = 'status', value = 'published'): Access =>
  ({ req }) => {
    if (hasRole(req.user, ...STAFF_ROLES)) return true
    return { [field]: { equals: value } }
  }

/** Admin panel access: staff only, never members. */
export const adminPanel = ({ req }: { req: PayloadRequest }) => hasRole(req.user, ...STAFF_ROLES)

/* ---------------- field-level ---------------- */

export const fieldRoles =
  (...allowed: Role[]): FieldAccess =>
  ({ req }) =>
    hasRole(req.user, ...allowed)

export const fieldNobody: FieldAccess = () => false
export const fieldStaff: FieldAccess = ({ req }) => hasRole(req.user, ...STAFF_ROLES)
export const fieldAdmins: FieldAccess = ({ req }) => hasRole(req.user, ...ADMIN_ROLES)
