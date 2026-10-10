import type { CollectionConfig } from 'payload'

import { anyone } from '../access'
import { menuAccess } from '../access/permissions'
import { slugField } from '../fields'
import { revalidateCollection } from '../hooks/revalidate'

const revalidate = revalidateCollection('tags')

export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: { singular: 'ট্যাগ', plural: 'ট্যাগ' },
  admin: { group: 'কনটেন্ট', useAsTitle: 'name' },
  access: { read: anyone, ...menuAccess('tags') },
  hooks: { afterChange: [revalidate.afterChange], afterDelete: [revalidate.afterDelete] },
  fields: [
    { name: 'name', label: 'নাম', type: 'text', required: true },
    slugField({ from: 'name', prefix: 'tag' }),
  ],
}
