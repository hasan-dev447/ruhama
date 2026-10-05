import 'server-only'

import type { Pool } from 'pg'

import { getPayloadClient } from '../payload'
import { PostgresSearchService } from './postgres'
import type { SearchService } from './types'

let service: SearchService | null = null

/**
 * The active search backend. Postgres full-text search today; set SEARCH_PROVIDER
 * and add an adapter implementing SearchService to switch (e.g. Meilisearch).
 */
export async function getSearchService(): Promise<SearchService> {
  if (service) return service
  const payload = await getPayloadClient()
  const pool = (payload.db as unknown as { pool: Pool }).pool
  service = new PostgresSearchService(pool)
  return service
}

export * from './types'
