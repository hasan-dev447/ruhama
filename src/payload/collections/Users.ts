import { APIError, type CollectionConfig, type Field } from 'payload'

import { DISTRICT_OPTIONS } from '@/lib/districts'
import { JOURNEY_STAGES } from '@/lib/journey'
import { INTEREST_OPTIONS } from '@/lib/options'
import { ADMIN_ROLES, hasRole, ROLE_LABELS, ROLES, rolesOf, STAFF_ROLES } from '@/lib/roles'
import { TAGS } from '@/server/cache/tags'

import { fieldAdmins } from '../access'
import { safeRevalidate } from '../hooks/revalidate'

const pref = (name: string, label: string, email: boolean, site: boolean): Field => ({
  name,
  label,
  type: 'group',
  fields: [
    { name: 'email', type: 'checkbox', defaultValue: email },
    { name: 'site', type: 'checkbox', defaultValue: site },
  ],
})

/** Field settings merged onto fields that payload-auth generates from the Better Auth schema. */
const GENERATED_FIELD_TWEAKS: Record<string, Partial<Field> & Record<string, unknown>> = {
  name: { label: 'নাম' },
  email: { label: 'ইমেইল' },
  role: {
    label: 'ভূমিকা',
    options: ROLES.map((r) => ({ label: ROLE_LABELS[r], value: r })),
    defaultValue: ['member'],
    access: { update: fieldAdmins, create: fieldAdmins },
    admin: { position: 'sidebar', description: 'শুধু শূরা ও সুপার অ্যাডমিন ভূমিকা বদলাতে পারেন।' },
  },
  username: {
    label: 'ইউজারনেম',
    unique: true,
    index: true,
    saveToJWT: true,
    admin: { position: 'sidebar' },
  },
  journeyStage: {
    label: 'যাত্রার ধাপ',
    type: 'select',
    options: JOURNEY_STAGES.map((s) => ({ label: s.label, value: s.value })),
    saveToJWT: true,
  },
  avatarColor: {
    label: 'অ্যাভাটারের রং',
    type: 'select',
    options: [
      { label: 'টিল', value: 'teal' },
      { label: 'গোল্ড', value: 'gold' },
      { label: 'সেজ', value: 'sage' },
      { label: 'গাঢ় টিল', value: 'deep' },
    ],
    saveToJWT: true,
  },
  deletionRequestedAt: {
    label: 'মুছে ফেলার অনুরোধ',
    admin: { readOnly: true, position: 'sidebar' },
  },
  phoneNumber: { label: 'মোবাইল', index: true },
}

const EXTRA_FIELDS: Field[] = [
  { name: 'district', label: 'জেলা', type: 'select', options: DISTRICT_OPTIONS, index: true },
  { name: 'bio', label: 'সংক্ষিপ্ত পরিচিতি', type: 'textarea', maxLength: 160 },
  {
    name: 'interests',
    label: 'আগ্রহ',
    type: 'select',
    hasMany: true,
    options: INTEREST_OPTIONS.map((o) => ({ ...o })),
  },
  {
    name: 'person',
    label: 'পাবলিক প্রোফাইল (আলিম/লেখক)',
    type: 'relationship',
    relationTo: 'people',
    admin: { position: 'sidebar', description: 'স্টাফের লেখা ও রিভিউ যে প্রোফাইলে দেখাবে।' },
    access: { update: fieldAdmins },
  },
  {
    name: 'privacy',
    label: 'গোপনীয়তা',
    type: 'group',
    fields: [
      { name: 'profilePublic', label: 'প্রোফাইল পাবলিক', type: 'checkbox', defaultValue: true },
      { name: 'showActivity', label: 'কার্যক্রম দেখানো', type: 'checkbox', defaultValue: true },
      { name: 'showJourney', label: 'যাত্রার ধাপ দেখানো', type: 'checkbox', defaultValue: true },
      {
        name: 'discoverable',
        label: 'স্থানীয় সার্কেলে খুঁজে পাওয়া যাবে',
        type: 'checkbox',
        defaultValue: false,
      },
    ],
  },
  {
    name: 'notificationPrefs',
    label: 'নোটিফিকেশন পছন্দ',
    type: 'group',
    fields: [
      pref('answer', 'প্রশ্নের উত্তর প্রকাশিত হলে', true, true),
      pref('event', 'মজলিসের রিমাইন্ডার', true, true),
      pref('forum', 'ফোরামে আমার আলোচনায় উত্তর', false, true),
      pref('weekly', 'সাপ্তাহিক চিঠি', true, false),
      pref('course', 'নতুন পাঠ ও কোর্স', false, true),
    ],
  },
  {
    name: 'forumStats',
    label: 'ফোরাম',
    type: 'group',
    admin: { position: 'sidebar' },
    fields: [
      {
        name: 'approvedPosts',
        label: 'অনুমোদিত পোস্ট',
        type: 'number',
        defaultValue: 0,
        admin: { readOnly: true },
      },
      {
        name: 'trusted',
        label: 'বিশ্বস্ত (মডারেশন ছাড়া পোস্ট)',
        type: 'checkbox',
        defaultValue: false,
      },
      { name: 'mutedUntil', label: 'পোস্ট বন্ধ থাকবে যতদিন', type: 'date' },
    ],
  },
  { name: 'lastActiveAt', type: 'date', admin: { readOnly: true, position: 'sidebar' } },
]

/**
 * Overrides for the users collection that payload-auth builds.
 * One users table serves the admin panel and the public site.
 */
export function usersCollectionOverride({
  collection,
}: {
  collection: CollectionConfig
}): CollectionConfig {
  const fields = collection.fields.map((f) => {
    if ('name' in f && f.name && GENERATED_FIELD_TWEAKS[f.name]) {
      const tweak = GENERATED_FIELD_TWEAKS[f.name]!
      return {
        ...f,
        ...tweak,
        admin: { ...(f.admin ?? {}), ...((tweak.admin as object) ?? {}) },
      } as Field
    }
    return f
  })

  return {
    ...collection,
    labels: { singular: 'ব্যবহারকারী', plural: 'ব্যবহারকারী' },
    admin: {
      ...collection.admin,
      useAsTitle: 'name',
      defaultColumns: ['name', 'email', 'role', 'createdAt'],
      listSearchableFields: ['name', 'email', 'username', 'phoneNumber'],
      group: 'অ্যাকাউন্ট',
      hidden: ({ user }) => !hasRole(user, ...ADMIN_ROLES, 'moderator'),
    },
    versions: { maxPerDoc: 25 },
    access: {
      ...collection.access,
      // staff reach /admin; members never do
      admin: ({ req }) => hasRole(req.user, ...STAFF_ROLES),
      read: ({ req }) => {
        if (!req.user) return false
        if (hasRole(req.user, ...STAFF_ROLES)) return true
        return { id: { equals: req.user.id } }
      },
      create: ({ req }) => hasRole(req.user, ...ADMIN_ROLES),
      // members change their profile through the profile service, never raw REST
      update: ({ req }) => hasRole(req.user, ...ADMIN_ROLES),
      delete: ({ req }) => hasRole(req.user, 'super_admin'),
    },
    hooks: {
      ...collection.hooks,
      beforeChange: [
        ...(collection.hooks?.beforeChange ?? []),
        ({ data, originalDoc, req }) => {
          // only a super admin can grant or remove the super admin role
          if (data.role && req.user) {
            const before = rolesOf(originalDoc)
            const after = rolesOf(data)
            const touchesSuper = before.includes('super_admin') !== after.includes('super_admin')
            if (touchesSuper && !hasRole(req.user, 'super_admin')) {
              throw new APIError(
                'শুধু সুপার অ্যাডমিন এই ভূমিকা দিতে বা সরাতে পারেন।',
                403,
                null,
                true,
              )
            }
          }
          return data
        },
      ],
      afterChange: [
        ...(collection.hooks?.afterChange ?? []),
        async ({ doc, previousDoc, req, operation }) => {
          const before = rolesOf(previousDoc).sort().join(',')
          const after = rolesOf(doc).sort().join(',')
          if (operation === 'update' && before !== after) {
            await req.payload.create({
              collection: 'audit-logs',
              data: {
                action: 'role_change',
                actor: req.user?.id ?? null,
                targetCollection: 'users',
                targetId: String(doc.id),
                summary: `${before || 'নেই'} → ${after || 'নেই'}`,
              },
              overrideAccess: true,
              req,
            })
          }
          if (doc.username) safeRevalidate([TAGS.doc('members', doc.username)])
          return doc
        },
      ],
    },
    fields: [...fields, ...EXTRA_FIELDS],
  }
}
