import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

import { TAGS } from '@/server/cache/tags'

type Doc = Record<string, unknown> & { id: number | string }

/** revalidateTag only works inside the Next.js runtime; scripts and the CLI skip it. */
export function safeRevalidate(tags: string[], paths: string[] = []) {
  for (const tag of new Set(tags)) {
    try {
      revalidateTag(tag, { expire: 0 })
    } catch {
      /* outside Next.js (seed, migrations) */
    }
  }
  for (const path of new Set(paths)) {
    try {
      revalidatePath(path)
    } catch {
      /* outside Next.js */
    }
  }
}

type Options = {
  /** Field used in public URLs and doc tags */
  keyField?: string
  /** Extra tags derived from the document (categories, people, home…) */
  extraTags?: (doc: Doc) => string[]
  /** Paths to revalidate in addition to tags (rarely needed) */
  paths?: (doc: Doc) => string[]
  /** For collections without drafts: is this document publicly visible? */
  isPublic?: (doc: Doc) => boolean
}

const visible = (doc: Doc | undefined, isPublic?: (d: Doc) => boolean) => {
  if (!doc) return false
  if ('_status' in doc) return doc._status === 'published'
  return isPublic ? isPublic(doc) : true
}

export function revalidateCollection(slug: string, opts: Options = {}) {
  const keyField = opts.keyField ?? 'slug'
  const tagsFor = (doc: Doc) => {
    const key = (doc[keyField] as string | number | undefined) ?? doc.id
    return [
      TAGS.collection(slug),
      TAGS.doc(slug, key),
      TAGS.doc(slug, doc.id),
      TAGS.sitemap,
      ...(opts.extraTags?.(doc) ?? []),
    ]
  }

  const afterChange: CollectionAfterChangeHook = ({ doc, previousDoc, context }) => {
    if (context.disableRevalidate) return doc
    const now = visible(doc as Doc, opts.isPublic)
    const before = visible(previousDoc as Doc, opts.isPublic)
    if (!now && !before) return doc
    const tags = [...tagsFor(doc as Doc), ...(previousDoc ? tagsFor(previousDoc as Doc) : [])]
    safeRevalidate(tags, opts.paths?.(doc as Doc) ?? [])
    return doc
  }

  const afterDelete: CollectionAfterDeleteHook = ({ doc, context }) => {
    if (context.disableRevalidate) return doc
    safeRevalidate(tagsFor(doc as Doc), opts.paths?.(doc as Doc) ?? [])
    return doc
  }

  return { afterChange, afterDelete }
}

export function revalidateGlobal(slug: string, extra: string[] = []): GlobalAfterChangeHook {
  return ({ doc, context }) => {
    if (!context.disableRevalidate) safeRevalidate([TAGS.global(slug), ...extra])
    return doc
  }
}
