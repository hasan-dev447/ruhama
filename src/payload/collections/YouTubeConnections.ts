import type { Access, CollectionConfig } from 'payload'

import { ADMIN_ROLES, hasRole } from '@/lib/roles'

/** Your own connections; admins see everyone's (to disconnect, never to read their videos). */
const ownOrAdmin: Access = ({ req }) => {
  if (!req.user) return false
  if (hasRole(req.user, ...ADMIN_ROLES)) return true
  return { user: { equals: req.user.id } }
}

/**
 * A YouTube channel a user connected through Google (server/youtube.ts). Created and updated only by
 * the server after Google's consent; the refresh token is encrypted and never leaves the server.
 */
export const YouTubeConnections: CollectionConfig = {
  slug: 'youtube-connections',
  labels: { singular: 'YouTube চ্যানেল', plural: 'YouTube চ্যানেল' },
  admin: {
    useAsTitle: 'channelTitle',
    // managed from Integrations > YouTube and from each video field's picker
    hidden: true,
  },
  access: {
    read: ownOrAdmin,
    create: () => false,
    update: () => false,
    delete: ownOrAdmin,
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'channelId', type: 'text', required: true, index: true },
    { name: 'channelTitle', type: 'text' },
    { name: 'channelHandle', type: 'text' },
    { name: 'channelThumb', type: 'text' },
    { name: 'uploadsPlaylistId', type: 'text' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'সক্রিয়', value: 'active' },
        { label: 'আবার যুক্ত করতে হবে', value: 'revoked' },
      ],
    },
    { name: 'scope', type: 'text' },
    { name: 'refreshTokenEnc', type: 'text', hidden: true },
    { name: 'connectedAt', type: 'date' },
    { name: 'lastUsedAt', type: 'date' },
  ],
  indexes: [{ fields: ['user', 'channelId'], unique: true }],
}
