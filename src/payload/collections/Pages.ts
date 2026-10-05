import type { CollectionConfig } from 'payload'

import { hasRole, STAFF_ROLES } from '@/lib/roles'

import { editorsOnly, statusPublishedOrStaff } from '../access'
import { slugField } from '../fields'
import { revalidateCollection } from '../hooks/revalidate'
import { previewUrl } from '../preview'
import { PUBLISH_STATUS } from './Courses'

const revalidate = revalidateCollection('pages', { isPublic: (d) => d.status === 'published' })

/** Simple pages such as the privacy policy, terms of use and data sources. */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'পাতা', plural: 'সাধারণ পাতা' },
  admin: {
    group: 'সাইট',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    hidden: ({ user }) => !hasRole(user, ...STAFF_ROLES),
    preview: previewUrl('pages'),
  },
  versions: { maxPerDoc: 20 },
  access: {
    read: statusPublishedOrStaff(),
    create: editorsOnly,
    update: editorsOnly,
    delete: editorsOnly,
  },
  hooks: { afterChange: [revalidate.afterChange], afterDelete: [revalidate.afterDelete] },
  fields: [
    { name: 'title', label: 'শিরোনাম', type: 'text', required: true },
    { name: 'lead', label: 'ভূমিকা', type: 'textarea' },
    { name: 'content', label: 'লেখা', type: 'richText', required: true },
    slugField({ prefix: 'page' }),
    {
      name: 'status',
      label: 'অবস্থা',
      type: 'select',
      defaultValue: 'draft',
      index: true,
      options: PUBLISH_STATUS,
      admin: { position: 'sidebar' },
    },
  ],
}
