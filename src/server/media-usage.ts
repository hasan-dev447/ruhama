import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

/**
 * Where a media file is used: every upload column that points at `media` (found from the database's
 * foreign keys, so new image fields are picked up automatically) plus images placed inside rich text.
 * Drafts count: the latest version of a document is checked as well as its published row, so an image
 * that only a draft uses is still "in use". Older versions do not count.
 */

export type MediaUse = {
  /** collection or global slug */
  slug: string
  kind: 'collection' | 'global'
  /** the collection's or global's name as the admin shows it */
  label: string
  /** document id (collections only) */
  docId?: number | string
  /** used only by the unpublished latest draft */
  draftOnly: boolean
}

type Source = { table: string; column: string; versioned: boolean; richText: boolean }

/** Tables that reference media without "using" it. */
const IGNORED = new Set([
  'payload_locked_documents_rels',
  'payload_preferences_rels',
  'lesson_progress',
])

let sourcesCache: Promise<Source[]> | null = null

type Db = { execute: (q: unknown) => Promise<{ rows: Record<string, unknown>[] }> }
const dbOf = (payload: Payload) => (payload.db as unknown as { drizzle: Db }).drizzle

function sources(payload: Payload): Promise<Source[]> {
  sourcesCache ??= (async () => {
    const db = dbOf(payload)
    const fks = await db.execute(sql`
      SELECT kcu.table_name, kcu.column_name
      FROM information_schema.referential_constraints rc
      JOIN information_schema.key_column_usage kcu
        ON kcu.constraint_name = rc.constraint_name AND kcu.constraint_schema = rc.constraint_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = rc.unique_constraint_name AND ccu.constraint_schema = rc.unique_constraint_schema
      WHERE ccu.table_name = 'media' AND kcu.table_schema = 'public'`)
    const json = await db.execute(sql`
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND data_type = 'jsonb' AND table_name NOT LIKE 'payload\\_%'`)
    const versionTables = new Set(
      (
        await db.execute(sql`
          SELECT table_name FROM information_schema.columns
          WHERE table_schema = 'public' AND column_name = 'latest'`)
      ).rows.map((r) => String(r.table_name)),
    )
    const toSource = (richText: boolean) => (r: Record<string, unknown>) => ({
      table: String(r.table_name),
      column: String(r.column_name),
      versioned: versionTables.has(String(r.table_name)),
      richText,
    })
    return [...fks.rows.map(toSource(false)), ...json.rows.map(toSource(true))].filter(
      (s) => !IGNORED.has(s.table),
    )
  })().catch((err) => {
    sourcesCache = null
    throw err
  })
  return sourcesCache
}

const ident = (name: string) => sql.raw(`"${name.replace(/"/g, '""')}"`)

/** `articles` -> `articles`, `_ikhtilaf_topics_v` -> `ikhtilaf-topics` */
function slugFor(
  payload: Payload,
  table: string,
): { slug: string; kind: 'collection' | 'global'; label: string } | null {
  const base = table.replace(/^_/, '').replace(/_v$/, '')
  const slug = base.replace(/_/g, '-')
  const text = (label: unknown) =>
    typeof label === 'string'
      ? label
      : label && typeof label === 'object'
        ? String(Object.values(label)[0] ?? slug)
        : slug
  const collection = payload.collections[slug as keyof typeof payload.collections]
  if (collection)
    return { slug, kind: 'collection', label: text(collection.config.labels?.singular) }
  const global = payload.config.globals.find((g) => g.slug === slug)
  if (global) return { slug, kind: 'global', label: text(global.label) }
  return null
}

/** Usage of each of the given media ids (ids with no usage are absent from the map). */
export async function mediaUsage(
  payload: Payload,
  ids: number[],
): Promise<Map<number, MediaUse[]>> {
  const result = new Map<number, MediaUse[]>()
  if (!ids.length) return result
  const db = dbOf(payload)
  const idList = sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `,
  )
  for (const source of await sources(payload)) {
    const owner = slugFor(payload, source.table)
    if (!owner) continue
    const table = ident(source.table)
    const column = ident(source.column)
    const docColumn = source.versioned ? ident('parent_id') : ident('id')
    const latest = source.versioned ? sql` AND latest = true` : sql``
    const query = source.richText
      ? sql`SELECT m.id AS media_id, t.${docColumn} AS doc_id FROM ${table} t
            JOIN media m ON m.id IN (${idList})
            WHERE t.${column} IS NOT NULL ${latest}
              AND jsonb_path_exists(t.${column}, '$.** ? (@.type == "upload" && @.relationTo == "media" && @.value == $id)', jsonb_build_object('id', m.id))`
      : sql`SELECT t.${column} AS media_id, t.${docColumn} AS doc_id FROM ${table} t
            WHERE t.${column} IN (${idList}) ${latest}`
    const { rows } = await db.execute(query)
    for (const row of rows) {
      const mediaId = Number(row.media_id)
      const list = result.get(mediaId) ?? []
      const docId = owner.kind === 'collection' ? (row.doc_id as number | string) : undefined
      const existing = list.find((u) => u.slug === owner.slug && String(u.docId) === String(docId))
      if (existing) {
        if (!source.versioned) existing.draftOnly = false
      } else {
        list.push({ ...owner, docId, draftOnly: source.versioned })
      }
      result.set(mediaId, list)
    }
  }
  return result
}

/** Ids of media that nothing uses, not even a draft. */
export async function unusedMediaIds(payload: Payload): Promise<number[]> {
  const { rows } = await dbOf(payload).execute(sql`SELECT id FROM media ORDER BY id`)
  const ids = rows.map((r) => Number(r.id))
  const used = new Map<number, MediaUse[]>()
  for (let i = 0; i < ids.length; i += 500) {
    for (const [id, uses] of await mediaUsage(payload, ids.slice(i, i + 500))) used.set(id, uses)
  }
  return ids.filter((id) => !used.has(id))
}
