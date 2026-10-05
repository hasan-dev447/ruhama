import type { CollectionConfig } from 'payload'

import { anyone, contentTeam, editorsOnly } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'মিডিয়া', plural: 'মিডিয়া' },
  admin: { group: 'কনটেন্ট', defaultColumns: ['filename', 'alt', 'updatedAt'] },
  access: {
    read: anyone,
    create: contentTeam,
    update: contentTeam,
    delete: editorsOnly,
  },
  upload: {
    mimeTypes: ['image/*', 'application/pdf', 'audio/mpeg', 'audio/mp4'],
    imageSizes: [
      { name: 'thumb', width: 480, height: 270, position: 'centre' },
      { name: 'card', width: 960, height: 540, position: 'centre' },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
    adminThumbnail: 'thumb',
    focalPoint: true,
  },
  fields: [
    { name: 'alt', label: 'বিকল্প লেখা (alt)', type: 'text', required: true },
    { name: 'credit', label: 'কৃতজ্ঞতা', type: 'text' },
  ],
}
