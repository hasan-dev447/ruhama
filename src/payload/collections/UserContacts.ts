import type { CollectionConfig } from 'payload'

import type { PayloadRequest } from 'payload'

import { adminsOnly } from '../access'

async function refreshContactIndex(req: PayloadRequest, user: unknown) {
  const id =
    user && typeof user === 'object' ? (user as { id: number }).id : (user as number | null)
  if (!id) return
  // an empty update runs the users hook that rebuilds the index
  await req.payload
    .update({ collection: 'users', id, data: {}, overrideAccess: true, depth: 0, req })
    .catch(() => null)
}

/**
 * Extra emails and mobile numbers on a member's account. The primary ones stay on the user
 * (email, phoneNumber, which Better Auth signs in with); these are the others. Each is confirmed with
 * a code sent to it, and a confirmed one can sign in or be made primary. Written only by the contacts
 * service.
 */
export const UserContacts: CollectionConfig = {
  slug: 'user-contacts',
  labels: { singular: 'অতিরিক্ত ইমেইল/মোবাইল', plural: 'অতিরিক্ত ইমেইল ও মোবাইল' },
  admin: {
    group: 'অ্যাকাউন্ট',
    useAsTitle: 'value',
    defaultColumns: ['value', 'kind', 'user', 'verified'],
    // managed from each user's panel (users list > a user), not as a menu of its own
    hidden: true,
  },
  access: { read: adminsOnly, create: () => false, update: () => false, delete: adminsOnly },
  hooks: {
    // keep the owner's search index (all emails and numbers) current
    afterChange: [({ doc, req }) => refreshContactIndex(req, doc.user)],
    afterDelete: [({ doc, req }) => refreshContactIndex(req, doc.user)],
  },
  fields: [
    {
      name: 'user',
      label: 'সদস্য',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'kind',
      label: 'ধরন',
      type: 'select',
      required: true,
      options: [
        { label: 'ইমেইল', value: 'email' },
        { label: 'মোবাইল', value: 'phone' },
      ],
      admin: { readOnly: true },
    },
    {
      // lower-case email or +8801XXXXXXXXX; never the same as any account's primary one
      name: 'value',
      label: 'ঠিকানা / নম্বর',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true },
    },
    { name: 'verified', label: 'যাচাই হয়েছে', type: 'checkbox', defaultValue: false, index: true },
    { name: 'verifiedAt', label: 'যাচাইয়ের সময়', type: 'date', admin: { readOnly: true } },
    { name: 'codeHash', type: 'text', hidden: true },
    { name: 'codeExpiresAt', type: 'date', hidden: true },
    { name: 'attempts', type: 'number', defaultValue: 0, hidden: true },
  ],
}
