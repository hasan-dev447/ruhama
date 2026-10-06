import type { Metadata } from 'next'

import { SITE } from './site'
import { absoluteUrl } from './utils'

type MetaInput = {
  title?: string
  description?: string
  path: string
  image?: string | null
  type?: 'website' | 'article' | 'profile' | 'video.other'
  publishedTime?: string | null
  modifiedTime?: string | null
  authors?: string[]
  noIndex?: boolean
  /** when the page repeats another page's content: the address search engines should index */
  canonical?: string
}

/** Per-route metadata with canonical URL, Open Graph and Twitter cards. */
export function buildMetadata(input: MetaInput): Metadata {
  const url = absoluteUrl(input.path)
  const title = input.title ? `${input.title} · ${SITE.name}` : `${SITE.name} · ${SITE.tagline}`
  const description = input.description || SITE.description
  const image = input.image
    ? absoluteUrl(input.image)
    : absoluteUrl(`/og?title=${encodeURIComponent(input.title ?? SITE.tagline)}`)
  return {
    title,
    description,
    alternates: { canonical: input.canonical ? absoluteUrl(input.canonical) : url },
    robots: input.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: input.type === 'video.other' ? 'video.other' : (input.type ?? 'website'),
      url,
      title,
      description,
      siteName: SITE.name,
      locale: SITE.locale,
      images: [{ url: image, width: 1200, height: 630, alt: input.title ?? SITE.name }],
      ...(input.type === 'article'
        ? {
            publishedTime: input.publishedTime ?? undefined,
            modifiedTime: input.modifiedTime ?? undefined,
            authors: input.authors,
          }
        : {}),
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

/* ---------------- JSON-LD ---------------- */

export type JsonLd = Record<string, unknown>

export const organizationLd = (): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': absoluteUrl('/#organization'),
  name: SITE.name,
  url: absoluteUrl('/'),
  logo: absoluteUrl('/icon-512.png'),
  slogan: SITE.tagline,
  description: SITE.description,
})

export const websiteLd = (): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': absoluteUrl('/#website'),
  name: SITE.name,
  url: absoluteUrl('/'),
  inLanguage: 'bn',
  publisher: { '@id': absoluteUrl('/#organization') },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${absoluteUrl('/search')}?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
})

export const breadcrumbLd = (items: { name: string; path: string }[]): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
})

export const articleLd = (a: {
  title: string
  description: string
  path: string
  author: { name: string; path?: string | null }
  reviewers?: { name: string }[]
  publishedAt?: string | null
  updatedAt?: string | null
  section?: string
}): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: a.title,
  description: a.description,
  inLanguage: 'bn',
  mainEntityOfPage: absoluteUrl(a.path),
  datePublished: a.publishedAt ?? undefined,
  dateModified: a.updatedAt ?? a.publishedAt ?? undefined,
  articleSection: a.section,
  author: {
    '@type': 'Person',
    name: a.author.name,
    url: a.author.path ? absoluteUrl(a.author.path) : undefined,
  },
  ...(a.reviewers?.length
    ? { reviewedBy: a.reviewers.map((r) => ({ '@type': 'Person', name: r.name })) }
    : {}),
  publisher: { '@id': absoluteUrl('/#organization') },
  image: absoluteUrl(`/og?title=${encodeURIComponent(a.title)}`),
})

export const personLd = (p: {
  name: string
  path: string
  jobTitle?: string | null
  description?: string | null
  knowsAbout?: string[]
}): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: p.name,
  url: absoluteUrl(p.path),
  jobTitle: p.jobTitle ?? undefined,
  description: p.description ?? undefined,
  knowsAbout: p.knowsAbout?.length ? p.knowsAbout : undefined,
  affiliation: { '@id': absoluteUrl('/#organization') },
})

export const eventLd = (e: {
  title: string
  description: string
  path: string
  startsAt: string
  endsAt?: string | null
  online: boolean
  venueName?: string | null
  address?: string | null
  capacity: number
  remaining: number
  performers?: string[]
}): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: e.title,
  description: e.description,
  startDate: e.startsAt,
  endDate: e.endsAt ?? undefined,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: e.online
    ? 'https://schema.org/OnlineEventAttendanceMode'
    : 'https://schema.org/OfflineEventAttendanceMode',
  location: e.online
    ? { '@type': 'VirtualLocation', url: absoluteUrl(e.path) }
    : {
        '@type': 'Place',
        name: e.venueName ?? 'Ruhama মজলিস',
        address: {
          '@type': 'PostalAddress',
          streetAddress: e.address ?? undefined,
          addressCountry: 'BD',
        },
      },
  organizer: { '@id': absoluteUrl('/#organization') },
  isAccessibleForFree: true,
  maximumAttendeeCapacity: e.capacity,
  remainingAttendeeCapacity: Math.max(0, e.remaining),
  offers: {
    '@type': 'Offer',
    price: 0,
    priceCurrency: 'BDT',
    availability: e.remaining > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
    url: absoluteUrl(e.path),
  },
  performer: e.performers?.map((name) => ({ '@type': 'Person', name })),
  url: absoluteUrl(e.path),
})

export const courseLd = (c: {
  title: string
  description: string
  path: string
  lessons: number
  level: string
}): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: c.title,
  description: c.description,
  url: absoluteUrl(c.path),
  inLanguage: 'bn',
  educationalLevel: c.level,
  numberOfCredits: c.lessons,
  isAccessibleForFree: true,
  provider: { '@id': absoluteUrl('/#organization') },
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'online',
    courseWorkload: `${c.lessons} lessons`,
  },
  offers: { '@type': 'Offer', price: 0, priceCurrency: 'BDT', category: 'Free' },
})

export const videoLd = (v: {
  title: string
  description: string
  path: string
  youtubeId: string
  durationSeconds: number
  publishedAt?: string | null
  chapters?: { start: number; title: string }[]
}): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: v.title,
  description: v.description || v.title,
  thumbnailUrl: [`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`],
  uploadDate: v.publishedAt ?? undefined,
  duration: `PT${Math.floor(v.durationSeconds / 60)}M${v.durationSeconds % 60}S`,
  embedUrl: `https://www.youtube-nocookie.com/embed/${v.youtubeId}`,
  contentUrl: `https://www.youtube.com/watch?v=${v.youtubeId}`,
  url: absoluteUrl(v.path),
  inLanguage: 'bn',
  ...(v.chapters?.length
    ? {
        hasPart: v.chapters.map((c, i) => ({
          '@type': 'Clip',
          name: c.title,
          startOffset: c.start,
          endOffset: v.chapters![i + 1]?.start ?? v.durationSeconds,
          url: `${absoluteUrl(v.path)}?t=${c.start}`,
        })),
      }
    : {}),
})

export const qaPageLd = (q: {
  question: string
  body?: string | null
  answer: string
  path: string
  answeredBy?: string | null
  publishedAt?: string | null
  upvotes?: number
}): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'QAPage',
  mainEntity: {
    '@type': 'Question',
    name: q.question,
    text: q.body || q.question,
    answerCount: 1,
    dateCreated: q.publishedAt ?? undefined,
    acceptedAnswer: {
      '@type': 'Answer',
      text: q.answer,
      url: absoluteUrl(q.path),
      upvoteCount: q.upvotes ?? 0,
      author: q.answeredBy
        ? { '@type': 'Person', name: q.answeredBy }
        : { '@id': absoluteUrl('/#organization') },
    },
  },
})

export const faqLd = (items: { q: string; a: string }[]): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((i) => ({
    '@type': 'Question',
    name: i.q,
    acceptedAnswer: { '@type': 'Answer', text: i.a },
  })),
})
