import 'server-only'

import { TAGS } from './cache/tags'
import { getPayloadClient } from './payload'
import {
  countPublishedArticles,
  getArticle,
  getIkhtilaf,
  listArticles,
  listCategories,
  listIkhtilaf,
  relatedArticles,
  type ArticleListParams,
} from './queries/articles'
import { cached } from './queries/cached'
import { eventDistricts, getCircle, getEvent, listCircles, listEvents } from './queries/events'
import { bdToday, getDaily, getHomeData } from './queries/home'
import { getCourse, getLesson, getQuestion, listCourses, listQuestions } from './queries/learning'
import {
  getPerson,
  listScholars,
  listSeriesByAuthor,
  listShura,
  scholarFields,
} from './queries/people'
import { getThread, listForumCategories, listThreads } from './queries/forum'
import { getMemberProfile } from './queries/members'
import { getPersonExtras } from './queries/profile-cover'
import {
  getHadith,
  getHadithBook,
  getSurah,
  listHadithBooks,
  listHadiths,
  listSurahs,
} from './queries/scripture'
import {
  getVideo,
  listPlaylists,
  listVideos,
  videoSpeakers,
  type VideoListParams,
} from './queries/videos'

/**
 * Cached readers for public pages. Every entry is tagged so Payload hooks can
 * revalidate it within seconds of a change; the `revalidate` value is a fallback.
 */
const c = TAGS.collection
const d = TAGS.doc
const p = () => getPayloadClient()

export const data = {
  home: cached(['home'], async () => getHomeData(await p()), {
    tags: [
      TAGS.home,
      c('articles'),
      c('categories'),
      c('events'),
      c('ikhtilaf-topics'),
      TAGS.global('home-page'),
    ],
    revalidate: 86400,
  }),
  daily: cached(['daily'], async (day: string) => getDaily(await p(), day), {
    tags: [TAGS.daily],
    revalidate: 86400,
  }),
  today: () => bdToday(),

  articles: cached(
    ['articles'],
    async (params: ArticleListParams) => listArticles(await p(), params),
    { tags: [c('articles')], revalidate: 86400 },
  ),
  articleCount: cached(['article-count'], async () => countPublishedArticles(await p()), {
    tags: [c('articles')],
    revalidate: 86400,
  }),
  article: cached(['article'], async (slug: string) => getArticle(await p(), slug), {
    tags: (slug) => [d('articles', slug)],
    revalidate: 86400,
  }),
  relatedArticles: cached(
    ['related-articles'],
    async (id: number, categoryId: number | null, manualIds: number[]) => {
      const payload = await p()
      const manual = manualIds.length
        ? (
            await payload.find({
              collection: 'articles',
              where: { and: [{ id: { in: manualIds } }, { _status: { equals: 'published' } }] },
              depth: 1,
              limit: manualIds.length,
            })
          ).docs
        : []
      return relatedArticles(payload, { id, category: categoryId, relatedArticles: manual })
    },
    { tags: [c('articles')], revalidate: 86400 },
  ),
  categories: cached(
    ['categories'],
    async (usedFor: 'articles' | 'questions' | 'videos' | 'events' | 'ikhtilaf') =>
      listCategories(await p(), usedFor),
    {
      tags: [c('categories')],
      revalidate: 86400,
    },
  ),

  ikhtilafList: cached(
    ['ikhtilaf-list'],
    async (limit: number) => listIkhtilaf(await p(), { limit }),
    { tags: [c('ikhtilaf-topics')], revalidate: 86400 },
  ),
  ikhtilaf: cached(['ikhtilaf'], async (slug: string) => getIkhtilaf(await p(), slug), {
    tags: (slug) => [d('ikhtilaf-topics', slug)],
    revalidate: 86400,
  }),

  questions: cached(
    ['questions'],
    async (params: Parameters<typeof listQuestions>[1]) => listQuestions(await p(), params),
    { tags: [c('questions')], revalidate: 86400 },
  ),
  question: cached(['question'], async (slug: string) => getQuestion(await p(), slug), {
    tags: (slug) => [d('questions', slug)],
    revalidate: 86400,
  }),

  courses: cached(['courses'], async (level: string | null) => listCourses(await p(), { level }), {
    tags: [c('courses')],
    revalidate: 86400,
  }),
  course: cached(['course'], async (slug: string) => getCourse(await p(), slug), {
    tags: (slug) => [d('courses', slug), c('lessons')],
    revalidate: 86400,
  }),
  lesson: cached(
    ['lesson'],
    async (courseId: number, slug: string) => getLesson(await p(), courseId, slug),
    {
      tags: (courseId) => [d('courses', courseId), c('lessons')],
      revalidate: 86400,
    },
  ),

  events: cached(
    ['events'],
    async (params: Parameters<typeof listEvents>[1]) => listEvents(await p(), params),
    { tags: [c('events')], revalidate: 21600 },
  ),
  eventDistricts: cached(['event-districts'], async () => eventDistricts(await p()), {
    tags: [c('events')],
    revalidate: 86400,
  }),
  event: cached(['event'], async (slug: string) => getEvent(await p(), slug), {
    tags: (slug) => [d('events', slug), c('events')],
    revalidate: 21600,
  }),

  circles: cached(
    ['circles'],
    async (params: Parameters<typeof listCircles>[1]) => listCircles(await p(), params),
    { tags: [c('circles')], revalidate: 21600 },
  ),
  circle: cached(['circle'], async (slug: string) => getCircle(await p(), slug), {
    tags: (slug) => [d('circles', slug), c('circles')],
    revalidate: 21600,
  }),

  videos: cached(['videos'], async (params: VideoListParams) => listVideos(await p(), params), {
    tags: [c('videos')],
    revalidate: 86400,
  }),
  playlists: cached(['playlists'], async () => listPlaylists(await p()), {
    tags: [c('playlists'), c('videos')],
    revalidate: 86400,
  }),
  videoSpeakers: cached(['video-speakers'], async () => videoSpeakers(await p()), {
    tags: [c('people'), c('videos')],
    revalidate: 86400,
  }),
  video: cached(['video'], async (slug: string) => getVideo(await p(), slug), {
    tags: (slug) => [d('videos', slug), c('videos')],
    revalidate: 86400,
  }),

  scholars: cached(
    ['scholars'],
    async (params: Parameters<typeof listScholars>[1]) => listScholars(await p(), params),
    { tags: [c('people')], revalidate: 86400 },
  ),
  scholarFields: cached(['scholar-fields'], async () => scholarFields(await p()), {
    tags: [c('people')],
    revalidate: 86400,
  }),
  person: cached(['person'], async (slug: string) => getPerson(await p(), slug), {
    tags: (slug) => [d('people', slug), c('people')],
    revalidate: 86400,
  }),
  personExtras: cached(
    ['person-extras'],
    async (slug: string) => {
      const payload = await p()
      const person = await getPerson(payload, slug)
      return person ? getPersonExtras(payload, person) : { cover: null, photo: null }
    },
    { tags: (slug) => [d('people', slug), c('people'), c('users')], revalidate: 86400 },
  ),
  personContent: cached(
    ['person-content'],
    async (personId: number) => {
      const payload = await p()
      const [articles, reviewed, answers, videos, events, series] = await Promise.all([
        listArticles(payload, { authorId: personId, limit: 6 }),
        listArticles(payload, { reviewerId: personId, limit: 6 }),
        listQuestions(payload, { answeredById: personId, limit: 6 }),
        listVideos(payload, { speakerId: personId, limit: 6 }),
        listEvents(payload, { speakerId: personId, limit: 4 }),
        listSeriesByAuthor(payload, personId),
      ])
      return { articles, reviewed, answers, videos, events: events.docs, series }
    },
    {
      tags: (personId) => [
        d('people', personId),
        c('articles'),
        c('questions'),
        c('videos'),
        c('events'),
        c('series'),
      ],
      revalidate: 86400,
    },
  ),
  shura: cached(['shura'], async () => listShura(await p()), {
    tags: [c('people')],
    revalidate: 86400,
  }),
  seriesBy: cached(
    ['series-by'],
    async (personId: number) => listSeriesByAuthor(await p(), personId),
    { tags: [c('series')], revalidate: 86400 },
  ),
  surahs: cached(['surahs'], async () => listSurahs(await p()), {
    tags: [c('surahs')],
    revalidate: 86400,
  }),
  surah: cached(['surah'], async (n: number) => getSurah(await p(), n), {
    tags: (n) => [c('ayahs'), d('surahs', n)],
    revalidate: 86400,
  }),
  hadithBooks: cached(['hadith-books'], async () => listHadithBooks(await p()), {
    tags: [c('hadith-collections')],
    revalidate: 86400,
  }),
  hadithBook: cached(['hadith-book'], async (slug: string) => getHadithBook(await p(), slug), {
    tags: [c('hadith-collections')],
    revalidate: 86400,
  }),
  hadiths: cached(
    ['hadiths'],
    async (params: Parameters<typeof listHadiths>[1]) => listHadiths(await p(), params),
    { tags: [c('hadiths')], revalidate: 86400 },
  ),
  hadith: cached(['hadith'], async (book: string, n: number) => getHadith(await p(), book, n), {
    tags: (book, n) => [d('hadiths', `${book}:${n}`), c('hadiths')],
    revalidate: 86400,
  }),
  forumCategories: cached(['forum-categories'], async () => listForumCategories(await p()), {
    tags: [c('forum-categories'), c('forum-threads')],
    revalidate: 21600,
  }),
  forumThreads: cached(
    ['forum-threads'],
    async (params: Parameters<typeof listThreads>[1]) => listThreads(await p(), params),
    { tags: [c('forum-threads')], revalidate: 21600 },
  ),
  forumThread: cached(['forum-thread'], async (id: number) => getThread(await p(), id), {
    tags: (id) => [d('forum-threads', id)],
    revalidate: 21600,
  }),
  member: cached(['member'], async (username: string) => getMemberProfile(await p(), username), {
    tags: (u) => [`member:${u}`, c('users')],
    revalidate: 3600,
  }),
  page: cached(
    ['page'],
    async (slug: string) => {
      const res = await (
        await p()
      ).find({
        collection: 'pages',
        where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
        depth: 1,
        limit: 1,
      })
      return res.docs[0] ?? null
    },
    { tags: (slug) => [d('pages', slug)], revalidate: 86400 },
  ),
}
