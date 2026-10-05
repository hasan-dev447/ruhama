import type { Payload, Where } from 'payload'

import { CATEGORY_POPULATE, PERSON_POPULATE } from './articles'
import { toPlaylist, toVideoCard } from './mappers'
import type { PlaylistView, VideoCardView } from './types'

const VIDEO_SELECT = {
  title: true,
  shortTitle: true,
  slug: true,
  youtubeId: true,
  durationSeconds: true,
  tint: true,
  category: true,
  speaker: true,
  viewCount: true,
  level: true,
  publishedAt: true,
} as const

const populate = { categories: CATEGORY_POPULATE, people: PERSON_POPULATE }

export type VideoListParams = {
  category?: string | null
  duration?: 'short' | 'medium' | 'long' | null
  speaker?: string | null
  q?: string | null
  page?: number
  limit?: number
  speakerId?: number | string
  excludeId?: number | string
}

export async function listVideos(payload: Payload, params: VideoListParams = {}) {
  const and: Where[] = [{ status: { equals: 'published' } }]
  if (params.category && params.category !== 'all')
    and.push({ 'category.slug': { equals: params.category } })
  if (params.speaker && params.speaker !== 'all')
    and.push({ 'speaker.slug': { equals: params.speaker } })
  if (params.speakerId) and.push({ speaker: { equals: params.speakerId } })
  if (params.excludeId) and.push({ id: { not_equals: params.excludeId } })
  if (params.duration === 'short') and.push({ durationSeconds: { less_than: 600 } })
  if (params.duration === 'medium')
    and.push(
      { durationSeconds: { greater_than_equal: 600 } },
      { durationSeconds: { less_than_equal: 1800 } },
    )
  if (params.duration === 'long') and.push({ durationSeconds: { greater_than: 1800 } })
  const q = params.q?.trim()
  if (q) and.push({ or: [{ title: { like: q } }, { 'speaker.name': { like: q } }] })
  const res = await payload.find({
    collection: 'videos',
    where: { and },
    select: VIDEO_SELECT,
    populate,
    depth: 1,
    sort: '-publishedAt',
    page: params.page ?? 1,
    limit: params.limit ?? 12,
  })
  return {
    docs: res.docs.map((d) => toVideoCard(d as never)) as VideoCardView[],
    totalDocs: res.totalDocs,
    totalPages: res.totalPages,
    page: res.page ?? 1,
    hasNextPage: res.hasNextPage,
  }
}

export async function listPlaylists(payload: Payload): Promise<PlaylistView[]> {
  const res = await payload.find({ collection: 'playlists', depth: 0, sort: 'order', limit: 30 })
  const ids = res.docs.map((d) => d.id)
  const first = new Map<number, { slug: string; episode: number }>()
  if (ids.length) {
    const videos = await payload.find({
      collection: 'videos',
      where: { and: [{ status: { equals: 'published' } }, { playlist: { in: ids } }] },
      select: { slug: true, playlist: true, episode: true },
      depth: 0,
      limit: 500,
      pagination: false,
    })
    for (const v of videos.docs) {
      const pid = v.playlist as number
      const ep = v.episode ?? 9999
      const cur = first.get(pid)
      if (!cur || ep < cur.episode) first.set(pid, { slug: v.slug ?? '', episode: ep })
    }
  }
  return res.docs
    .filter((d) => (d.videoCount ?? 0) > 0)
    .map((d) => toPlaylist(d as never, first.get(d.id)?.slug ?? null))
}

export async function getVideo(payload: Payload, slug: string) {
  const res = await payload.find({
    collection: 'videos',
    where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
    depth: 1,
    limit: 1,
    populate: {
      ...populate,
      playlists: { title: true, slug: true, videoCount: true },
      articles: { title: true, slug: true },
    },
  })
  const video = res.docs[0]
  if (!video) return null
  const playlistId = (video.playlist as { id?: number } | null)?.id
  const [playlistVideos, related] = await Promise.all([
    playlistId
      ? payload.find({
          collection: 'videos',
          where: {
            and: [{ status: { equals: 'published' } }, { playlist: { equals: playlistId } }],
          },
          select: {
            title: true,
            shortTitle: true,
            slug: true,
            durationSeconds: true,
            episode: true,
            tint: true,
          },
          depth: 0,
          sort: 'episode',
          limit: 100,
          pagination: false,
        })
      : null,
    listVideos(payload, {
      category: (video.category as { slug?: string } | null)?.slug ?? null,
      excludeId: video.id,
      limit: 3,
    }),
  ])
  return { video, playlistVideos: playlistVideos?.docs ?? [], related: related.docs }
}

/** Speakers with at least one published lecture (video filter). */
export async function videoSpeakers(payload: Payload) {
  const res = await payload.find({
    collection: 'people',
    where: { and: [{ active: { equals: true } }, { lectureCount: { greater_than: 0 } }] },
    select: { name: true, slug: true },
    depth: 0,
    sort: '-lectureCount',
    limit: 50,
    pagination: false,
  })
  return res.docs.map((p) => ({ slug: p.slug ?? '', name: p.name }))
}
