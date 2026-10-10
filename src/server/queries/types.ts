/**
 * Lightweight view models handed from server queries to components.
 * Only the fields a page renders are selected from Payload.
 */

export type Id = number | string

export type PersonRef = {
  id: Id
  name: string
  slug: string
  tone: 'teal' | 'gold'
  title?: string | null
  kinds?: string[]
  verified?: boolean
}

export type CategoryRef = { id: Id; name: string; slug: string; icon?: string | null }

export type CategoryView = CategoryRef & {
  description?: string | null
  articleCount: number
  questionCount: number
  videoCount: number
}

export type ArticleCardView = {
  id: Id
  slug: string
  title: string
  excerpt: string
  category: CategoryRef | null
  level: string | null
  readingTime: number
  tint: 'sage' | 'gold' | 'teal'
  author: PersonRef | null
  reviewed: boolean
  publishedAt: string | null
}

export type DalilView = {
  type: string
  citation: string
  note?: string | null
  url?: string | null
}

export type EventCardView = {
  id: Id
  slug: string
  title: string
  summary: string
  startsAt: string
  endsAt: string | null
  timeLabel: string | null
  mode: 'online' | 'in_person'
  district: string | null
  venueName: string | null
  capacity: number
  seatsTaken: number
  category: CategoryRef | null
  /** over (lib/events.ts): no registration, shown with what happened instead */
  ended: boolean
  /** a published recap (text, photos, videos) exists */
  hasRecap: boolean
}

export type CourseCardView = {
  id: Id
  slug: string
  title: string
  description: string
  journeyStage: string
  level: string
  tint: 'sage' | 'gold' | 'teal'
  lessonCount: number
  durationMinutes: number | null
}

export type VideoCardView = {
  id: Id
  slug: string
  title: string
  shortTitle: string
  youtubeId: string
  durationSeconds: number
  tint: 'teal' | 'deep' | 'umber' | 'slate'
  category: CategoryRef | null
  speaker: PersonRef | null
  viewCount: number
  level: string | null
  publishedAt: string | null
}

export type PlaylistView = {
  id: Id
  slug: string
  title: string
  speakerLabel: string | null
  level: string | null
  tint: 'teal' | 'deep' | 'umber' | 'slate'
  videoCount: number
  firstVideoSlug: string | null
}

export type QuestionCardView = {
  id: Id
  slug: string
  title: string
  excerpt: string
  category: CategoryRef | null
  answeredBy: PersonRef | null
  publishedAt: string | null
}

export type CircleCardView = {
  id: Id
  slug: string
  name: string
  district: string
  type: 'brothers' | 'sisters' | 'family'
  focus: string
  frequency: string
  scheduleLabel: string
  memberCount: number
  memberUnit: 'people' | 'families'
  nextMeetup: { startsAt: string; topic: string } | null
}

export type IkhtilafCardView = {
  id: Id
  slug: string
  title: string
  lead: string
  category: CategoryRef | null
  subTopic: string | null
  level: string | null
  opinionCount: number
  readingTime: number
  opinions: { title: string; holders: string; citations: string[] }[]
  conduct: string | null
}
