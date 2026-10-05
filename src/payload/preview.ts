const site = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

type Doc = { slug?: string | null; id?: number | string } | null | undefined

/** Public path of a document, used for preview and live preview. */
export function publicPath(collection: string, doc: Doc): string {
  const slug = doc?.slug ?? ''
  switch (collection) {
    case 'articles':
      return `/ilm/${slug}`
    case 'ikhtilaf-topics':
      return `/ikhtilaf/${slug}`
    case 'questions':
      return `/qa/${slug}`
    case 'courses':
      return `/courses/${slug}`
    case 'events':
      return `/events/${slug}`
    case 'videos':
      return `/videos/${slug}`
    case 'circles':
      return `/circles/${slug}`
    case 'pages':
      return `/${slug}`
    default:
      return '/'
  }
}

function previewHref(collection: string, doc: Doc) {
  const params = new URLSearchParams({ collection, path: publicPath(collection, doc) })
  return `${site()}/api/preview?${params.toString()}`
}

export const livePreviewUrl =
  (collection: string) =>
  ({ data }: { data: Doc }) =>
    previewHref(collection, data)

export const previewUrl = (collection: string) => (doc: Doc) => previewHref(collection, doc)
