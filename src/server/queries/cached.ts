import { unstable_cache } from 'next/cache'

/**
 * Wrap a data loader in the Next.js data cache with tags for on-demand revalidation
 * and a time-based fallback (seconds). Arguments become part of the cache key.
 */
export function cached<A extends unknown[], R>(
  keyParts: string[],
  fn: (...args: A) => Promise<R>,
  opts: { tags: string[] | ((...args: A) => string[]); revalidate?: number },
) {
  return (...args: A): Promise<R> => {
    const tags = typeof opts.tags === 'function' ? opts.tags(...args) : opts.tags
    return unstable_cache(fn, [...keyParts, JSON.stringify(args)], {
      tags,
      revalidate: opts.revalidate ?? 3600,
    })(...args)
  }
}
