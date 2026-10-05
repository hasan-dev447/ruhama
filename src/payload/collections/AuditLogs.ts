import type { CollectionConfig } from 'payload'

import { hasRole } from '@/lib/roles'

import { nobody } from '../access'

/**
 * Append-only audit trail: who changed roles, who moved content through review,
 * who published or removed what. Content history itself lives in Payload versions.
 */
export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  labels: { singular: 'অডিট লগ', plural: 'অডিট লগ' },
  admin: {
    group: 'অ্যাকাউন্ট',
    useAsTitle: 'summary',
    defaultColumns: ['action', 'actor', 'targetCollection', 'targetId', 'summary', 'createdAt'],
    hidden: ({ user }) => !hasRole(user, 'super_admin', 'shura'),
  },
  defaultSort: '-createdAt',
  access: {
    read: ({ req }) => hasRole(req.user, 'super_admin', 'shura'),
    create: nobody,
    update: nobody,
    delete: nobody,
  },
  fields: [
    {
      name: 'action',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'ভূমিকা পরিবর্তন', value: 'role_change' },
        { label: 'রিভিউর জন্য পাঠানো', value: 'submit' },
        { label: 'অনুমোদন', value: 'approve' },
        { label: 'পরিবর্তনের অনুরোধ', value: 'request_changes' },
        { label: 'প্রকাশ', value: 'publish' },
        { label: 'প্রকাশ বাতিল', value: 'unpublish' },
        { label: 'ফেরত নেওয়া', value: 'withdraw' },
        { label: 'মডারেশন', value: 'moderation' },
        { label: 'অ্যাকাউন্ট মুছে ফেলা', value: 'account_deletion' },
      ],
    },
    { name: 'actor', type: 'relationship', relationTo: 'users', index: true },
    { name: 'targetCollection', type: 'text', index: true },
    { name: 'targetId', type: 'text', index: true },
    { name: 'summary', type: 'text' },
  ],
}
