import { APIError, type CollectionConfig, type Field } from 'payload'

import { DISTRICT_OPTIONS } from '@/lib/districts'
import { canHavePhoto, GENDERS } from '@/lib/gender'
import { MAX_ALLOWED_VIEWERS, VISIBILITY } from '@/lib/profile-privacy'
import { JOURNEY_STAGES } from '@/lib/journey'
import { INTEREST_OPTIONS } from '@/lib/options'
import { hasRole, ROLE_LABELS, ROLES, rolesOf } from '@/lib/roles'
import { roleAssignProblem } from '@/lib/permissions'
import { TAGS } from '@/server/cache/tags'
import { canEnterAdmin, getMatrix, workflowFallback } from '@/server/permissions'

import { fieldAbility, fieldAtLevel, menuAccess } from '../access/permissions'
import { safeRevalidate } from '../hooks/revalidate'
import { syncProfileForRoles } from '@/server/services/public-profile'

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
  name: {
    label: 'নাম',
    // photo or initials before the name in the list
    admin: { components: { Cell: '@/payload/components/avatar-cell#AvatarCell' } },
  },
  email: { label: 'ইমেইল' },
  role: {
    label: 'রোল',
    options: ROLES.map((r) => ({ label: ROLE_LABELS[r], value: r })),
    defaultValue: ['member'],
    access: { update: fieldAbility('users.roles'), create: fieldAbility('users.roles') },
    admin: {
      position: 'sidebar',
      description:
        'কার কোন রোল আর প্রতিটি রোল কী পারেন, “রোল ও অনুমতি” মেনু থেকে সহজে দেখা ও বদলানো যায়।',
    },
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
    label: 'অ্যাভাটার রং',
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
  gender: {
    label: 'ভাই / বোন',
    type: 'select',
    options: GENDERS.map((g) => ({ label: g.long, value: g.value })),
    index: true,
    saveToJWT: true,
    admin: {
      position: 'sidebar',
      description:
        'সদস্য একবারই বেছে নেন, পরে বদলানো যায় না। ভুল হলে শুধু সুপার অ্যাডমিন ঠিক করতে পারেন।',
    },
  },
  image: {
    label: 'ছবির URL',
    // the photo shows in the panel below; the address itself is internal
    admin: { readOnly: true, hidden: true },
  },
}

const EXTRA_FIELDS: Field[] = [
  { name: 'district', label: 'জেলা', type: 'select', options: DISTRICT_OPTIONS, index: true },
  { name: 'bio', label: 'বায়ো', type: 'textarea', maxLength: 160 },
  {
    name: 'interests',
    label: 'আগ্রহ',
    type: 'select',
    hasMany: true,
    options: INTEREST_OPTIONS.map((o) => ({ ...o })),
  },
  {
    name: 'person',
    label: 'পাবলিক প্রোফাইল (স্কলার/লেখক)',
    type: 'relationship',
    relationTo: 'people',
    admin: { position: 'sidebar', description: 'স্টাফের লেখা ও রিভিউ যে প্রোফাইলে দেখাবে।' },
    access: { update: fieldAtLevel('users', 'edit') },
  },
  {
    name: 'avatar',
    label: 'প্রোফাইল ছবি',
    type: 'upload',
    relationTo: 'avatars',
    // shown and removed through the panel below; picking another file here would make no sense
    admin: { hidden: true },
  },
  {
    name: 'contactsPanel',
    type: 'ui',
    admin: {
      position: 'sidebar',
      components: { Field: '@/payload/components/user-contacts-panel#UserContactsPanel' },
    },
  },
  {
    // every email and number on the account (primary and extra, numbers also as 01...), so the users
    // search and filters find a member by any of them; rebuilt on every save
    name: 'contactsIndex',
    label: 'সব ইমেইল ও মোবাইল',
    type: 'text',
    index: true,
    // not shown in the form, but offered in the list's filters
    admin: { readOnly: true, disableListColumn: true, condition: () => false },
  },
  {
    name: 'cover',
    label: 'কভার',
    type: 'group',
    admin: { description: 'প্রোফাইলের কভারে সদস্যের বেছে নেওয়া আয়াত, হাদিস বা লেখা।' },
    fields: [
      {
        name: 'kind',
        label: 'ধরন',
        type: 'select',
        defaultValue: 'none',
        options: [
          { label: 'কিছু না', value: 'none' },
          { label: 'কুরআনের আয়াত', value: 'ayah' },
          { label: 'হাদিস', value: 'hadith' },
          { label: 'নিজের লেখা', value: 'text' },
        ],
      },
      { name: 'ayahKey', label: 'আয়াত (সূরা:আয়াত)', type: 'text' },
      { name: 'hadithKey', label: 'হাদিস (গ্রন্থ:নম্বর)', type: 'text' },
      { name: 'text', label: 'লেখা', type: 'textarea', maxLength: 200 },
      { name: 'source', label: 'উৎস', type: 'text', maxLength: 80 },
    ],
  },
  {
    name: 'privacy',
    label: 'প্রাইভেসি',
    type: 'group',
    fields: [
      {
        name: 'visibility',
        label: 'প্রোফাইল ভিজিবিলিটি',
        type: 'select',
        defaultValue: 'public',
        options: VISIBILITY.map((v) => ({ label: v.label, value: v.value })),
      },
      {
        name: 'allowedViewers',
        label: 'যারা দেখতে পারবেন (Custom)',
        type: 'relationship',
        relationTo: 'users',
        hasMany: true,
        maxRows: MAX_ALLOWED_VIEWERS,
        admin: { condition: (_, sibling) => sibling?.visibility === 'custom' },
      },
      // older setting, replaced by `visibility` (read only for rows saved before it)
      { name: 'profilePublic', type: 'checkbox', defaultValue: true, admin: { hidden: true } },
      { name: 'showPhoto', label: 'ছবি দেখাবে', type: 'checkbox', defaultValue: true },
      { name: 'showCover', label: 'কভার দেখাবে', type: 'checkbox', defaultValue: true },
      { name: 'showBio', label: 'বায়ো দেখাবে', type: 'checkbox', defaultValue: true },
      { name: 'showDistrict', label: 'জেলা দেখাবে', type: 'checkbox', defaultValue: true },
      { name: 'showActivity', label: 'অ্যাক্টিভিটি দেখাবে', type: 'checkbox', defaultValue: true },
      { name: 'showJourney', label: 'যাত্রার ধাপ দেখাবে', type: 'checkbox', defaultValue: true },
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
    label: 'নোটিফিকেশন',
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

  // columns that add nothing in a list (the photo already shows beside the name); a group's own
  // columns go with it, and inside privacy the viewer list and the old setting
  const NO_COLUMN = new Set([
    'avatar',
    'image',
    'cover',
    'notificationPrefs',
    'account',
    'session',
    'allowedViewers',
    'profilePublic',
  ])
  const noColumn = (f: Field, all = false): Field => {
    const off = all || ('name' in f && NO_COLUMN.has(f.name))
    const next = (
      off ? { ...f, admin: { ...(f.admin ?? {}), disableListColumn: true } } : f
    ) as Field
    return 'fields' in next && Array.isArray(next.fields)
      ? ({ ...next, fields: next.fields.map((sub) => noColumn(sub, off)) } as Field)
      : next
  }
  const listFields = [...fields, ...EXTRA_FIELDS].map((f) => noColumn(f))

  return {
    ...collection,
    labels: { singular: 'ইউজার', plural: 'ইউজার' },
    admin: {
      ...collection.admin,
      components: {
        ...collection.admin?.components,
        // the plugin's "Invite User" flow needs sign-up pages this site does not use
        Description: undefined,
        views: {
          ...collection.admin?.components?.views,
          // Bangla ban / unban / sign-out-everywhere instead of the plugin's English buttons
          // (and no "impersonate": staff never need to sign in as someone else)
          edit: {
            ...collection.admin?.components?.views?.edit,
            adminButtons: {
              tab: { Component: '@/payload/components/user-admin-actions#UserAdminActions' },
            },
          } as NonNullable<
            NonNullable<NonNullable<CollectionConfig['admin']>['components']>['views']
          >['edit'],
        },
      },
      useAsTitle: 'name',
      defaultColumns: ['name', 'email', 'role', 'createdAt'],
      listSearchableFields: ['name', 'username', 'contactsIndex'],
      group: 'অ্যাকাউন্ট',
    },
    versions: { maxPerDoc: 25 },
    access: {
      ...collection.access,
      // staff reach /admin; members never do
      // who reaches /admin follows the রোল ও অনুমতি page (any menu or ability); members never do
      admin: async ({ req }) => canEnterAdmin(req.user),
      read: async ({ req }) => {
        if (!req.user) return false
        // staff see names (authors, reviewers, assignees); a member only themselves
        if (await canEnterAdmin(req.user)) return true
        return { id: { equals: req.user.id } }
      },
      // members change their profile through the profile service, never raw REST
      ...menuAccess('users'),
    },
    hooks: {
      ...collection.hooks,
      beforeChange: [
        ...(collection.hooks?.beforeChange ?? []),
        async ({ data, originalDoc, req, operation }) => {
          // search index: every email and number on the account
          const email = (data.email ?? originalDoc?.email ?? '') as string
          const phone = (data.phoneNumber ?? originalDoc?.phoneNumber ?? '') as string
          const extras =
            operation === 'update' && originalDoc?.id
              ? (
                  await req.payload.find({
                    collection: 'user-contacts',
                    where: { user: { equals: originalDoc.id } },
                    select: { value: true },
                    depth: 0,
                    limit: 50,
                    overrideAccess: true,
                    req,
                  })
                ).docs.map((d) => d.value)
              : []
          data.contactsIndex = [email, phone, ...extras]
            .filter(Boolean)
            .flatMap((v) => (v.startsWith('+88') ? [v, v.slice(3)] : [v]))
            .join(' ')
            .toLowerCase()

          const superAdmin = hasRole(req.user, 'super_admin')
          // ভাই / বোন is chosen once; only a super admin can correct a mistake
          if (
            operation === 'update' &&
            originalDoc?.gender &&
            data.gender !== undefined &&
            data.gender !== originalDoc.gender &&
            !superAdmin
          ) {
            throw new APIError(
              'পরিচয় (ভাই/বোন) একবার বেছে নিলে আর বদলানো যায় না।',
              403,
              null,
              true,
            )
          }
          const gender = data.gender ?? originalDoc?.gender
          // the photo comes only from the member's own upload (never a Google or Facebook picture),
          // and sisters have none
          if (data.image !== undefined && !req.context?.avatarUpdate) {
            data.image = originalDoc?.image ?? null
          }
          if (gender && !canHavePhoto(gender)) {
            data.image = null
            data.avatar = null
          }
          return data
        },
        // roles change by the রোল ও অনুমতি rules: only a super admin touches super admin and শূরা,
        // others need "রোল দেওয়া ও সরানো", nobody changes their own (lib/permissions.ts)
        async ({ data, originalDoc, req, operation, context }) => {
          if (!data.role || !req.user || context?.roleChangeChecked) return data
          const before = operation === 'create' ? [] : rolesOf(originalDoc)
          const after = rolesOf(data)
          const changed = [
            ...after.filter((r) => !before.includes(r)).map((r) => ({ role: r, add: true })),
            ...before.filter((r) => !after.includes(r)).map((r) => ({ role: r, add: false })),
          ].filter((c) => !(c.role === 'member' && operation === 'create'))
          if (!changed.length) return data
          const matrix = await getMatrix()
          const fallback = await workflowFallback()
          for (const c of changed) {
            const problem = roleAssignProblem({
              matrix,
              actorRoles: rolesOf(req.user),
              actorId: req.user.id,
              targetId: originalDoc?.id ?? 'new',
              targetRoles: before,
              role: c.role,
              add: c.add,
              fallback,
            })
            if (problem) throw new APIError(problem, 403, null, true)
          }
          return data
        },
      ],
      afterChange: [
        ...(collection.hooks?.afterChange ?? []),
        // an admin took "email verified" away: sign the member out everywhere, so the next sign-in
        // asks them to confirm the address again (ticking it, in turn, lets them in with no check)
        async ({ doc, previousDoc, req, operation }) => {
          if (operation !== 'update' || !previousDoc?.emailVerified || doc.emailVerified) return doc
          await req.payload.delete({
            collection: 'sessions',
            where: { user: { equals: doc.id } },
            overrideAccess: true,
            req,
          })
          return doc
        },
        // a profile role (people menu's rule) gives the member a public profile they fill in themselves
        async ({ doc, previousDoc, req, operation }) => {
          if (req.context?.skipProfileSync) return doc
          const before = operation === 'create' ? [] : rolesOf(previousDoc)
          if (before.sort().join() === rolesOf(doc).sort().join()) return doc
          await syncProfileForRoles(req.payload, doc as never, before, req).catch((err) =>
            req.payload.logger.error({ err, msg: 'public profile sync failed' }),
          )
          return doc
        },
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
    // the avatar cell needs the photo even when its column is off
    forceSelect: { image: true },
    fields: listFields,
  }
}
