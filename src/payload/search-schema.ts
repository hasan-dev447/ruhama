import { sql } from '@payloadcms/db-postgres/drizzle'
import { customType, index } from '@payloadcms/db-postgres/drizzle/pg-core'
import type { PostgresAdapterArgs } from '@payloadcms/db-postgres'

type PostgresSchemaHook = NonNullable<PostgresAdapterArgs['afterSchemaInit']>[number]

/**
 * Full-text search columns and indexes, added to the Drizzle schema so they
 * are part of Payload's generated migrations.
 *
 * Bangla has no Postgres dictionary, so tsvectors use the `simple` configuration
 * (exact tokens, prefix queries) and pg_trgm trigram indexes cover partial matches
 * on short fields such as titles and verse translations.
 */
const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector'
  },
})

type Spec = { table: string; tsv: string; trigram: string[] }

const SPECS: Spec[] = [
  {
    table: 'articles',
    tsv: `setweight(to_tsvector('simple', coalesce(title, '')), 'A') || setweight(to_tsvector('simple', coalesce(search_text, '')), 'B')`,
    trigram: ['title'],
  },
  {
    table: 'ikhtilaf_topics',
    tsv: `setweight(to_tsvector('simple', coalesce(title, '')), 'A') || setweight(to_tsvector('simple', coalesce(search_text, '')), 'B')`,
    trigram: ['title'],
  },
  {
    table: 'questions',
    tsv: `setweight(to_tsvector('simple', coalesce(title, '')), 'A') || setweight(to_tsvector('simple', coalesce(search_text, '')), 'B')`,
    trigram: ['title'],
  },
  {
    table: 'videos',
    tsv: `setweight(to_tsvector('simple', coalesce(title, '')), 'A') || setweight(to_tsvector('simple', coalesce(search_text, '')), 'B')`,
    trigram: ['title'],
  },
  {
    table: 'events',
    tsv: `setweight(to_tsvector('simple', coalesce(title, '')), 'A') || setweight(to_tsvector('simple', coalesce(search_text, '')), 'B')`,
    trigram: ['title'],
  },
  {
    table: 'courses',
    tsv: `setweight(to_tsvector('simple', coalesce(title, '')), 'A') || setweight(to_tsvector('simple', coalesce(search_text, '')), 'B')`,
    trigram: ['title'],
  },
  {
    table: 'people',
    tsv: `setweight(to_tsvector('simple', coalesce(name, '')), 'A') || setweight(to_tsvector('simple', coalesce(search_text, '')), 'B')`,
    trigram: ['name'],
  },
  {
    table: 'ayahs',
    tsv: `to_tsvector('simple', coalesce(translation, '') || ' ' || coalesce(arabic_plain, ''))`,
    trigram: ['translation'],
  },
  {
    table: 'hadiths',
    tsv: `to_tsvector('simple', coalesce(text, '') || ' ' || coalesce(narrator, '') || ' ' || coalesce(arabic_plain, ''))`,
    trigram: [],
  },
]

const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())

export const searchSchemaHook: PostgresSchemaHook = ({ schema, extendTable }) => {
  for (const spec of SPECS) {
    const table = schema.tables[spec.table]
    if (!table) continue
    extendTable({
      table,
      columns: {
        searchTsv: tsvector('search_tsv').generatedAlwaysAs(sql.raw(`(${spec.tsv})`)),
      },
      extraConfig: (t) => {
        const extra: Record<string, unknown> = {
          [`${spec.table}_search_tsv_idx`]: index(`${spec.table}_search_tsv_idx`).using(
            'gin',
            t.searchTsv,
          ),
        }
        for (const col of spec.trigram) {
          const column = t[toCamel(col)]
          if (column)
            extra[`${spec.table}_${col}_trgm_idx`] = index(`${spec.table}_${col}_trgm_idx`).using(
              'gin',
              sql`${column} gin_trgm_ops`,
            )
        }
        return extra
      },
    })
  }
  return schema
}
