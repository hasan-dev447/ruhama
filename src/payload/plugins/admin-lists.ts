import type { CollectionConfig, Config, Field } from 'payload'

import { COLLECTION_RULES } from '@/lib/collection-rules'

const INLINE_CELL = '@/payload/components/inline-cell#InlineCell'
const RULES_PANEL = '@/payload/components/rules/rules-panel#RulesPanel'

/** Account and system records change only through their own flows (bans, sign-in, audit). */
const NO_INLINE = new Set([
  'users',
  'sessions',
  'accounts',
  'verifications',
  'audit-logs',
  'user-contacts',
  'avatars',
  'youtube-connections',
])

function inlineEditable(field: Field): boolean {
  if (!('name' in field) || (field as { hidden?: boolean }).hidden) return false
  const admin = (field.admin ?? {}) as {
    readOnly?: boolean
    hidden?: boolean
    components?: { Cell?: unknown }
  }
  if (admin.readOnly || admin.hidden || admin.components?.Cell) return false
  return field.type === 'checkbox' || (field.type === 'select' && !field.hasMany)
}

/** Top-level data fields (unnamed rows, collapsibles and tabs pass through; named groups do not). */
function withInlineCells(fields: Field[]): Field[] {
  return fields.map((field) => {
    if (field.type === 'row' || field.type === 'collapsible')
      return { ...field, fields: withInlineCells(field.fields) }
    if (field.type === 'tabs')
      return {
        ...field,
        tabs: field.tabs.map((tab) =>
          'name' in tab && tab.name ? tab : { ...tab, fields: withInlineCells(tab.fields) },
        ),
      }
    if (!inlineEditable(field)) return field
    const admin = (field.admin ?? {}) as Record<string, unknown>
    return {
      ...field,
      admin: { ...admin, components: { ...(admin.components as object), Cell: INLINE_CELL } },
    } as Field
  })
}

/**
 * Admin list behaviour for every collection:
 * - yes/no and single-choice fields can be changed right in the list (InlineCell);
 * - lists load only the columns on screen (Payload's Select API), not whole documents.
 * - menus with adjustable rules show their "নিয়ম" panel above the list.
 *   Upload collections keep full rows, their thumbnails need the file fields.
 */
export function adminLists(config: Config): Config {
  return {
    ...config,
    collections: (config.collections ?? []).map((collection: CollectionConfig) => ({
      ...collection,
      admin: {
        ...collection.admin,
        ...(collection.upload ? {} : { enableListViewSelectAPI: true }),
        // a menu with adjustable rules (lib/collection-rules.ts) shows them above its list
        ...(COLLECTION_RULES[collection.slug]
          ? {
              components: {
                ...collection.admin?.components,
                beforeList: [
                  { path: RULES_PANEL, clientProps: { slug: collection.slug } },
                  ...(collection.admin?.components?.beforeList ?? []),
                ],
              },
            }
          : {}),
      },
      fields: NO_INLINE.has(collection.slug)
        ? collection.fields
        : withInlineCells(collection.fields),
    })),
  }
}
