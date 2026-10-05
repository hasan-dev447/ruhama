import type {
  ArticleCardView,
  CategoryRef,
  CircleCardView,
  CourseCardView,
  EventCardView,
  IkhtilafCardView,
  PersonRef,
  PlaylistView,
  QuestionCardView,
  VideoCardView,
} from './types'

/* Payload docs arrive with relationships populated to depth 1 (or as ids). */
type Doc = Record<string, unknown>
const obj = (v: unknown): Doc | null => (v && typeof v === 'object' ? (v as Doc) : null)
const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d)
const num = (v: unknown, d = 0): number => (typeof v === 'number' ? v : d)

export function toPerson(v: unknown): PersonRef | null {
  const p = obj(v)
  if (!p || !p.name) return null
  return {
    id: p.id as number,
    name: str(p.name),
    slug: str(p.slug),
    tone: p.avatarTone === 'gold' ? 'gold' : 'teal',
    title: (p.title as string) ?? null,
    kinds: (p.kinds as string[]) ?? [],
    verified: Boolean(p.verified),
  }
}

export function toCategory(v: unknown): CategoryRef | null {
  const c = obj(v)
  if (!c || !c.name) return null
  return {
    id: c.id as number,
    name: str(c.name),
    slug: str(c.slug),
    icon: (c.icon as string) ?? null,
  }
}

export function toArticleCard(d: Doc): ArticleCardView {
  return {
    id: d.id as number,
    slug: str(d.slug),
    title: str(d.title),
    excerpt: str(d.excerpt),
    category: toCategory(d.category),
    level: (d.level as string) ?? null,
    readingTime: num(d.readingTime, 5),
    tint: (['sage', 'gold', 'teal'].includes(d.tint as string)
      ? d.tint
      : 'sage') as ArticleCardView['tint'],
    author: toPerson(d.author),
    reviewed: d.reviewStatus === 'published' || d._status === 'published',
    publishedAt: (d.publishedAt as string) ?? null,
  }
}

export function toEventCard(d: Doc): EventCardView {
  return {
    id: d.id as number,
    slug: str(d.slug),
    title: str(d.title),
    summary: str(d.summary),
    startsAt: str(d.startsAt),
    endsAt: (d.endsAt as string) ?? null,
    timeLabel: (d.timeLabel as string) ?? null,
    mode: d.mode === 'online' ? 'online' : 'in_person',
    district: (d.district as string) ?? null,
    venueName: (d.venueName as string) ?? null,
    capacity: num(d.capacity, 1),
    seatsTaken: num(d.seatsTaken),
    category: toCategory(d.category),
  }
}

export function toCourseCard(d: Doc): CourseCardView {
  return {
    id: d.id as number,
    slug: str(d.slug),
    title: str(d.title),
    description: str(d.description),
    journeyStage: str(d.journeyStage, 'iman'),
    level: str(d.level, 'beginner'),
    tint: (['sage', 'gold', 'teal'].includes(d.tint as string)
      ? d.tint
      : 'sage') as CourseCardView['tint'],
    lessonCount: num(d.lessonCount),
    durationMinutes: (d.durationMinutes as number) ?? null,
  }
}

const TINTS = ['teal', 'deep', 'umber', 'slate'] as const
const tint = (v: unknown) =>
  TINTS.includes(v as (typeof TINTS)[number]) ? (v as (typeof TINTS)[number]) : 'teal'

export function toVideoCard(d: Doc): VideoCardView {
  return {
    id: d.id as number,
    slug: str(d.slug),
    title: str(d.title),
    shortTitle: str(d.shortTitle) || str(d.title),
    youtubeId: str(d.youtubeId),
    durationSeconds: num(d.durationSeconds),
    tint: tint(d.tint),
    category: toCategory(d.category),
    speaker: toPerson(d.speaker),
    viewCount: num(d.viewCount),
    level: (d.level as string) ?? null,
    publishedAt: (d.publishedAt as string) ?? null,
  }
}

export function toPlaylist(d: Doc, firstVideoSlug: string | null = null): PlaylistView {
  return {
    id: d.id as number,
    slug: str(d.slug),
    title: str(d.title),
    speakerLabel: (d.speakerLabel as string) ?? null,
    level: (d.level as string) ?? null,
    tint: tint(d.tint),
    videoCount: num(d.videoCount),
    firstVideoSlug,
  }
}

export function toQuestionCard(d: Doc): QuestionCardView {
  const body = str(d.body)
  return {
    id: d.id as number,
    slug: str(d.slug),
    title: str(d.title),
    excerpt: body.length > 200 ? `${body.slice(0, 200)}…` : body,
    category: toCategory(d.category),
    answeredBy: toPerson(d.answeredBy),
    publishedAt: (d.publishedAt as string) ?? null,
  }
}

export function toCircleCard(
  d: Doc,
  nextMeetup: CircleCardView['nextMeetup'] = null,
): CircleCardView {
  return {
    id: d.id as number,
    slug: str(d.slug),
    name: str(d.name),
    district: str(d.district),
    type: (['brothers', 'sisters', 'family'].includes(d.type as string)
      ? d.type
      : 'brothers') as CircleCardView['type'],
    focus: str(d.focus),
    frequency: str(d.frequency, 'weekly'),
    scheduleLabel: str(d.scheduleLabel),
    memberCount: num(d.memberCount),
    memberUnit: d.memberUnit === 'families' ? 'families' : 'people',
    nextMeetup,
  }
}

export function toIkhtilafCard(d: Doc): IkhtilafCardView {
  const opinions = ((d.opinions as Doc[]) ?? []).map((o) => ({
    title: str(o.title),
    holders: str(o.holders),
    citations: ((o.citations as string[]) ?? []).filter(Boolean),
  }))
  const conduct = ((d.conduct as Doc[]) ?? [])[0]
  return {
    id: d.id as number,
    slug: str(d.slug),
    title: str(d.title),
    lead: str(d.lead),
    category: toCategory(d.category),
    subTopic: (d.subTopic as string) ?? null,
    level: (d.level as string) ?? null,
    opinionCount: opinions.length,
    readingTime: num(d.readingTime, 5),
    opinions,
    conduct: conduct ? str(conduct.point) : null,
  }
}
