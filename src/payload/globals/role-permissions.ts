import type { GlobalConfig } from 'payload'

import { invalidatePermissions } from '@/server/permissions'

import { adminUser } from '../access/permissions'

/**
 * রোল ও অনুমতি: each role's permissions (lib/permissions.ts). Only the changes from the defaults are
 * stored here. The page is the role manager (RoleManager); its changes go through /api/v1/roles,
 * which checks who may change what and writes the audit log, so this global is never saved directly.
 */
export const RolePermissions: GlobalConfig = {
  slug: 'role-permissions',
  label: 'রোল ও অনুমতি',
  admin: {
    group: 'অ্যাকাউন্ট',
    description:
      'কোন রোল কোন মেনুতে কী করতে পারবেন, আর কার কোন রোল। সুপার অ্যাডমিনের সব অনুমতি থাকে; শূরার অনুমতি শুধু সুপার অ্যাডমিন বদলাতে পারেন।',
  },
  access: {
    read: adminUser,
    // saved only through the role endpoints (which check every change); never by raw REST
    update: () => false,
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        invalidatePermissions()
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'manager',
      type: 'ui',
      admin: { components: { Field: '@/payload/components/roles/role-manager#RoleManager' } },
    },
    { name: 'matrix', type: 'json', admin: { hidden: true } },
  ],
}
