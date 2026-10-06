import type { CollectionConfig } from 'payload'

import { ADMIN_ROLES, hasRole } from '@/lib/roles'

import { adminsOnly, anyone } from '../access'

/**
 * Members' profile photos (brothers only), one per member, kept in R2 under `avatars/`.
 * They are written only through the profile service, which checks the member and replaces the old
 * photo; the admin can view and remove them.
 */
export const Avatars: CollectionConfig = {
  slug: 'avatars',
  labels: { singular: 'প্রোফাইল ছবি', plural: 'প্রোফাইল ছবি' },
  admin: {
    group: 'অ্যাকাউন্ট',
    defaultColumns: ['filename', 'user', 'updatedAt'],
    hidden: ({ user }) => !hasRole(user, ...ADMIN_ROLES),
  },
  access: { read: anyone, create: () => false, update: () => false, delete: adminsOnly },
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    imageSizes: [
      { name: 'sm', width: 96, height: 96, position: 'centre' },
      { name: 'md', width: 320, height: 320, position: 'centre' },
      { name: 'lg', width: 1080, height: 1080, fit: 'inside', withoutEnlargement: true },
    ],
    adminThumbnail: 'sm',
    formatOptions: { format: 'webp', options: { quality: 86 } },
  },
  fields: [
    {
      name: 'user',
      label: 'সদস্য',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true },
    },
  ],
  hooks: {
    afterDelete: [
      // removing a photo in the admin also clears it from the member's profile
      async ({ doc, req }) => {
        // replacing a photo sets the new one right after
        if (req.context?.keepUserPhoto) return
        const userId = typeof doc.user === 'object' ? doc.user?.id : doc.user
        if (!userId) return
        await req.payload.update({
          collection: 'users',
          id: userId,
          data: { avatar: null, image: null },
          overrideAccess: true,
          context: { avatarUpdate: true },
          req,
        })
      },
    ],
  },
}
