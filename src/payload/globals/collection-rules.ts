import type { GlobalConfig } from 'payload'

import { cleanAllRules, resolveRules } from '@/lib/collection-rules'
import { invalidateRules } from '@/server/rules'

import { adminUser, globalAccess } from '../access/permissions'

/**
 * Every admin menu's adjustable rules in one place (lib/collection-rules.ts). Each menu also shows
 * its own part in a panel at the top of its list. Staff can read them; only শূরা and super admin
 * change them, and every change is written to the audit log.
 */
export const CollectionRules: GlobalConfig = {
  slug: 'collection-rules',
  label: 'নিয়মাবলি',
  admin: {
    group: 'সাইট',
    description:
      'প্রতিটি মেনুর নিয়ম, যেমন প্রবন্ধ প্রকাশের আগে কতজন রিভিউয়ারের অনুমোদন লাগবে। প্রতিটি মেনুর তালিকার উপরেও “এই মেনুর নিয়ম” থেকে বদলানো যায়।',
  },
  access: {
    // staff read them (each menu shows its rules above its list); changed with "এডিট" here
    ...globalAccess('collection-rules', adminUser),
  },
  hooks: {
    beforeChange: [
      // only known rules, each inside its limits; super admin always keeps review and publish rights
      async ({ data, req, originalDoc, context }) => {
        const before = cleanAllRules(originalDoc?.rules)
        const after = { ...before, ...cleanAllRules(data.rules) }
        data.rules = after
        const changed = Object.keys(after).filter(
          (slug) =>
            JSON.stringify(resolveRules(slug, before[slug])) !== JSON.stringify(after[slug]),
        )
        // the role page writes its own audit entry when it updates the reviewer lists
        if (changed.length && req.user && !context?.skipRulesAudit)
          await req.payload.create({
            collection: 'audit-logs',
            data: {
              action: 'rules_change',
              actor: req.user.id,
              targetCollection: 'collection-rules',
              targetId: changed.join(','),
              summary: `নিয়ম বদলানো হয়েছে: ${changed.join(', ')}`,
            },
            overrideAccess: true,
            req,
          })
        return data
      },
    ],
    afterChange: [
      ({ doc }) => {
        invalidateRules()
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'overview',
      type: 'ui',
      admin: {
        components: { Field: '@/payload/components/rules/all-rules#AllRules' },
      },
    },
    // the values, cleaned by the hook above; edited through the panels, never typed as JSON
    { name: 'rules', type: 'json', admin: { hidden: true } },
  ],
}
