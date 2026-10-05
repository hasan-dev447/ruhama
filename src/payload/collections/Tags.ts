import type { CollectionConfig } from 'payload'

import { anyone, contentTeam, editorsOnly } from '../access'
import { slugField } from '../fields'
import { revalidateCollection } from '../hooks/revalidate'

const revalidate = revalidateCollection('tags')

export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: { singular: 'ট্যাগ', plural: 'ট্যাগ' },
  admin: { group: 'কনটেন্ট', useAsTitle: 'name' },
  access: { read: anyone, create: contentTeam, update: editorsOnly, delete: editorsOnly },
  hooks: { afterChange: [revalidate.afterChange], afterDelete: [revalidate.afterDelete] },
  fields: [
    { name: 'name', label: 'নাম', type: 'text', required: true },
    slugField({ from: 'name', prefix: 'tag' }),
  ],
}
