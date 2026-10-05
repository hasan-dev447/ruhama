/** Cache tag names shared by data queries (unstable_cache) and Payload revalidation hooks. */
export const TAGS = {
  collection: (slug: string) => `c:${slug}`,
  doc: (slug: string, key: string | number) => `d:${slug}:${key}`,
  global: (slug: string) => `g:${slug}`,
  home: 'home',
  daily: 'daily',
  stats: 'stats',
  sitemap: 'sitemap',
} as const
