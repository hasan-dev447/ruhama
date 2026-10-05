/**
 * Search is accessed only through this interface, so the Postgres implementation
 * can be replaced (for example by Meilisearch) without touching pages or the API.
 */
export const SEARCH_TYPES = [
  'articles',
  'ayahs',
  'hadiths',
  'questions',
  'ikhtilaf',
  'videos',
  'courses',
  'events',
  'people',
] as const
export type SearchType = (typeof SEARCH_TYPES)[number]

export const SEARCH_TYPE_LABELS: Record<SearchType, string> = {
  articles: 'প্রবন্ধ',
  ayahs: 'আয়াত',
  hadiths: 'হাদিস',
  questions: 'প্রশ্নোত্তর',
  ikhtilaf: 'মতপার্থক্য',
  videos: 'ভিডিও',
  courses: 'কোর্স',
  events: 'মজলিস',
  people: 'স্কলার ও বক্তা',
}

/** A piece of text with matched words flagged, for <mark> highlighting. */
export type Highlighted = { text: string; hit: boolean }[]

export type SearchHit = {
  type: SearchType
  id: number
  href: string
  title: Highlighted
  snippet: Highlighted | null
  /** Short context line: reference, author, duration, date */
  meta: string | null
  /** Shown as a reference badge (ayah and hadith citations) */
  reference: boolean
}

export type SearchQuery = {
  q: string
  type?: SearchType | null
  page?: number
  limit?: number
  perGroup?: number
}

export type SearchResults = {
  q: string
  total: number
  counts: Record<SearchType, number>
  /** Grouped top hits when no single type is selected */
  groups: { type: SearchType; hits: SearchHit[] }[]
  /** Paginated hits when one type is selected */
  hits: SearchHit[]
  page: number
  totalPages: number
}

export interface SearchService {
  search(query: SearchQuery): Promise<SearchResults>
}
