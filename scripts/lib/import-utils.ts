import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import pg from 'pg'

/** Direct (non-pooled) connection for bulk imports, the same one migrations use. */
export function connect() {
  const connectionString = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL_DIRECT (or DATABASE_URL) is not set')
  return new pg.Pool({ connectionString, max: 4 })
}

const CACHE_DIR = path.resolve(process.cwd(), '.cache/datasets')

/** Fetch JSON with retries; responses are cached on disk so re-runs work offline. */
export async function fetchJson<T>(url: string, opts: { refresh?: boolean } = {}): Promise<T> {
  const file = path.join(CACHE_DIR, url.replace(/^https?:\/\//, '').replace(/[^a-z0-9.]+/gi, '_'))
  if (!opts.refresh) {
    try {
      return JSON.parse(await readFile(file, 'utf8')) as T
    } catch {
      /* not cached yet */
    }
  }
  let lastError: unknown
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120_000) })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const text = await res.text()
      await mkdir(CACHE_DIR, { recursive: true })
      await writeFile(file, text)
      return JSON.parse(text) as T
    } catch (err) {
      lastError = err
      console.warn(`  retry ${attempt}/4 for ${url}: ${(err as Error).message}`)
      await new Promise((r) => setTimeout(r, attempt * 1500))
    }
  }
  throw new Error(`could not download ${url}: ${(lastError as Error)?.message}`)
}

/**
 * Insert rows in batches with ON CONFLICT upsert. Only rows whose values actually
 * changed are rewritten, so a re-run on unchanged data is cheap.
 */
export async function upsertRows(
  pool: pg.Pool,
  table: string,
  conflict: string,
  columns: string[],
  rows: unknown[][],
  batchSize = 400,
): Promise<number> {
  const updates = columns.filter((c) => c !== conflict)
  let written = 0
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const values: unknown[] = []
    const tuples = batch.map(
      (row) =>
        `(${row.map((v) => (values.push(v), `$${values.length}`)).join(', ')}, now(), now())`,
    )
    const sql = `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(', ')}, "updated_at", "created_at")
      VALUES ${tuples.join(',\n')}
      ON CONFLICT ("${conflict}") DO UPDATE SET ${updates.map((c) => `"${c}" = EXCLUDED."${c}"`).join(', ')}, "updated_at" = now()
      WHERE (${updates.map((c) => `"${table}"."${c}"`).join(', ')}) IS DISTINCT FROM (${updates.map((c) => `EXCLUDED."${c}"`).join(', ')})`
    const res = await pool.query(sql, values)
    written += res.rowCount ?? 0
    process.stdout.write(`\r  ${table}: ${Math.min(i + batchSize, rows.length)}/${rows.length}`)
  }
  process.stdout.write('\n')
  return written
}
