/**
 * Seed the database with the realistic Bangla content from the design boards.
 *
 *   npm run seed
 *
 * Safe to run repeatedly: every record is upserted by its slug, email or key.
 * Accounts get the password from SEED_PASSWORD (default printed at the end).
 */
import 'dotenv/config'

import config from '@payload-config'
import { hashPassword } from 'better-auth/crypto'
import { getPayload, type CollectionSlug, type Payload, type Where } from 'payload'

import { WORKFLOW_HASH_FIELDS } from '@/payload/workflow/hash-fields'
import { computeContentHash } from '@/payload/workflow/logic'
import {
  recountCategory,
  recountCircle,
  recountCourse,
  recountEvent,
  recountForumCategory,
  recountMeetup,
  recountPerson,
  recountPlaylist,
  recountPostHelpful,
  recountSeries,
  recountThread,
} from '@/server/services/counters'

import { ARTICLES, SERIES } from './seed-data/articles'
import { CIRCLE_FORMAT, CIRCLE_RULES, CIRCLES } from './seed-data/circles'
import { COURSES } from './seed-data/courses'
import { EVENTS } from './seed-data/events'
import { FORUM_MEMBERS, THREADS } from './seed-data/forum'
import { IKHTILAF } from './seed-data/ikhtilaf'
import { PEOPLE } from './seed-data/people'
import { QUESTIONS } from './seed-data/questions'
import {
  ABOUT_PAGE,
  ADAB_POLICY,
  DAILY_AYAHS,
  DAILY_HADITHS,
  DEMO_NOTIFICATIONS,
  HOME_PAGE,
  PAGES,
  SITE_SETTINGS,
} from './seed-data/site'
import { CATEGORIES, FORUM_CATEGORIES, TAGS } from './seed-data/taxonomy'
import { PLAYLISTS, VIDEOS } from './seed-data/videos'

const SEED_PASSWORD = process.env.SEED_PASSWORD || 'Ruhama@2026'
const CTX = { skipWorkflow: true, disableRevalidate: true, skipCounters: true }

type Id = number

const NOW = Date.now()
const ago = (hours: number) => new Date(NOW - hours * 3600 * 1000).toISOString()

let payload: Payload

async function upsert(
  collection: CollectionSlug,
  where: Where,
  data: Record<string, unknown>,
  opts: { draft?: boolean } = {},
): Promise<Id> {
  const found = await payload.find({
    collection,
    where,
    limit: 1,
    depth: 0,
    overrideAccess: true,
    pagination: false,
    draft: opts.draft,
  })
  const existing = found.docs[0] as { id: Id } | undefined
  if (existing) {
    const doc = await payload.update({
      collection,
      id: existing.id,
      data: data as never,
      depth: 0,
      overrideAccess: true,
      context: CTX,
      draft: false,
    })
    return (doc as { id: Id }).id
  }
  const doc = await payload.create({
    collection,
    data: data as never,
    depth: 0,
    overrideAccess: true,
    context: CTX,
    draft: false,
  })
  return (doc as { id: Id }).id
}

const bySlug = (slug: string): Where => ({ slug: { equals: slug } })

function log(step: string, n?: number) {
  console.info(`  ✓ ${step}${n !== undefined ? ` (${n})` : ''}`)
}

/* ---------------- accounts ---------------- */

/** Demo personas written as sisters; every other demo account is a brother (ভাই / বোন is required). */
const SISTERS = new Set(['fatima@ruhama.local', 'nusrat@ruhama.local', 'sumaiya@ruhama.local'])

async function ensureUser(input: {
  email: string
  name: string
  roles: string[]
  username: string
  extra?: Record<string, unknown>
}): Promise<Id> {
  const id = await upsert(
    'users',
    { email: { equals: input.email } },
    {
      email: input.email,
      name: input.name,
      emailVerified: true,
      role: input.roles,
      username: input.username,
      journeyStage: 'kalema',
      avatarColor: 'gold',
      gender: SISTERS.has(input.email) ? 'female' : 'male',
      ...input.extra,
    },
  )
  const accounts = await payload.find({
    collection: 'accounts',
    where: { and: [{ user: { equals: id } }, { providerId: { equals: 'credential' } }] },
    limit: 1,
    overrideAccess: true,
  })
  if (accounts.docs.length === 0) {
    await payload.create({
      collection: 'accounts',
      data: {
        accountId: String(id),
        providerId: 'credential',
        user: id,
        password: await hashPassword(SEED_PASSWORD),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as never,
      overrideAccess: true,
    })
  }
  return id
}

/* ---------------- main ---------------- */

async function main() {
  payload = await getPayload({ config })
  console.info('\nSeeding Ruhama…')

  // taxonomy
  const cat: Record<string, Id> = {}
  for (const c of CATEGORIES)
    cat[c.slug] = await upsert('categories', bySlug(c.slug), { ...c, usedFor: [...c.usedFor] })
  const tag: Record<string, Id> = {}
  for (const t of TAGS) tag[t.slug] = await upsert('tags', bySlug(t.slug), t)
  const fcat: Record<string, Id> = {}
  for (const c of FORUM_CATEGORIES)
    fcat[c.slug] = await upsert('forum-categories', bySlug(c.slug), c)
  log('categories, tags, forum sections', CATEGORIES.length + TAGS.length + FORUM_CATEGORIES.length)

  // staff + demo accounts
  const userOf: Record<string, Id> = {}
  const superAdmin = await ensureUser({
    email: 'admin@ruhama.local',
    name: 'Ruhama অ্যাডমিন',
    roles: ['super_admin'],
    username: 'ruhama-admin',
  })
  const moderator = await ensureUser({
    email: 'moderator@ruhama.local',
    name: 'মডারেটর টিম',
    roles: ['moderator'],
    username: 'moderator-team',
  })
  for (const person of PEOPLE) {
    if (!person.account) continue
    userOf[person.slug] = await ensureUser({
      email: person.account.email,
      name: person.name,
      roles: person.account.roles,
      username: person.slug,
      extra: {
        avatarColor: person.avatarTone,
        district: person.location === 'ঢাকা' ? 'dhaka' : 'khulna',
      },
    })
  }
  const demo = await ensureUser({
    email: 'abdullah@ruhama.local',
    name: 'আব্দুল্লাহ আল মামুন',
    roles: ['member'],
    username: 'abdullah-al-mamun',
    extra: {
      district: 'khulna',
      journeyStage: 'tazkiyah',
      avatarColor: 'gold',
      interests: ['writing', 'tech'],
      phoneNumber: '+8801712345678',
      phoneNumberVerified: true,
      bio: 'খুলনা থেকে। সফটওয়্যার নিয়ে কাজ করি, লেখা ও টেক টিমে সাহায্য করতে চাই।',
      privacy: { visibility: 'public', showActivity: true, showJourney: true, discoverable: false },
      forumStats: { approvedPosts: 12, trusted: true },
    },
  })
  const member: Record<string, Id> = {
    demo,
    modteam: moderator,
    tanvir: userOf['tanvir-islam']!,
    sumaiya: userOf['sumaiya-kabir']!,
  }
  for (const m of FORUM_MEMBERS) {
    if (member[m.key] || !m.email) continue
    member[m.key] = await ensureUser({
      email: m.email,
      name: m.name,
      roles: ['member'],
      username: m.email.split('@')[0]!,
      extra: {
        avatarColor: m.gold ? 'gold' : 'teal',
        forumStats: { approvedPosts: 5, trusted: false },
        journeyStage: 'ilm',
      },
    })
  }
  log('accounts', Object.keys(userOf).length + Object.keys(member).length + 2)

  // people
  const person: Record<string, Id> = {}
  for (const p of PEOPLE) {
    const { account, ...rest } = p
    person[p.slug] = await upsert('people', bySlug(p.slug), {
      ...rest,
      active: true,
      user: userOf[p.slug] ?? null,
    })
    if (userOf[p.slug])
      await payload.update({
        collection: 'users',
        id: userOf[p.slug]!,
        data: { person: person[p.slug] } as never,
        overrideAccess: true,
        context: CTX,
      })
  }
  log('people', PEOPLE.length)

  const reviewerUser = (slug: string) => userOf[slug] ?? superAdmin
  const approvalsFor = (reviewers: string[], hash: string, at: string) =>
    reviewers.slice(0, 2).map((r, i) => ({
      reviewer:
        reviewerUser(r) === superAdmin
          ? i === 0
            ? userOf['mahmudul-hasan']!
            : userOf['imran-khalil']!
          : reviewerUser(r),
      decision: 'approved',
      note: 'দলিল ও উপস্থাপনা যাচাই করা হয়েছে।',
      contentHash: hash,
      at,
    }))

  // series
  const series: Record<string, Id> = {}
  for (const s of SERIES)
    series[s.slug] = await upsert('series', bySlug(s.slug), { ...s, author: person[s.author] })

  // articles
  const article: Record<string, Id> = {}
  for (const a of ARTICLES) {
    const data: Record<string, unknown> = {
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      category: cat[a.category],
      tags: (a.tags ?? []).map((t) => tag[t]),
      level: a.level,
      author: person[a.author],
      series: a.series ? series[a.series] : null,
      seriesOrder: a.seriesOrder ?? null,
      content: a.content,
      references: a.references,
      tint: a.tint,
      publishedAt: a.publishedAt,
    }
    const hash = computeContentHash(data, WORKFLOW_HASH_FIELDS.articles)
    article[a.slug] = await upsert('articles', bySlug(a.slug), {
      ...data,
      _status: 'published',
      reviewStatus: 'published',
      createdBy: userOf[a.author] ?? userOf['abdur-rahman'],
      publishedBy: superAdmin,
      approvals: approvalsFor(a.reviewers, hash, a.publishedAt),
      reviewedBy: a.reviewers.map((r) => person[r]),
    })
  }
  log('articles', ARTICLES.length)
  // a couple of related articles for the featured piece
  await payload.update({
    collection: 'articles',
    id: article['sunnah-of-speaking-with-a-disagreeing-brother']!,
    data: {
      relatedArticles: [article['why-madhhabs-differ'], article['riya-the-hidden-shirk']],
    } as never,
    overrideAccess: true,
    context: CTX,
    draft: false,
  })

  // ikhtilaf
  const ikh: Record<string, Id> = {}
  for (const t of IKHTILAF) {
    const data: Record<string, unknown> = {
      title: t.title,
      slug: t.slug,
      lead: t.lead,
      category: cat[t.category],
      subTopic: t.subTopic,
      level: t.level,
      consensus: t.consensus.map((point) => ({ point })),
      opinions: t.opinions,
      conduct: t.conduct.map((point) => ({ point })),
      references: t.references,
    }
    const hash = computeContentHash(
      { ...data, readFirst: undefined },
      WORKFLOW_HASH_FIELDS['ikhtilaf-topics'],
    )
    ikh[t.slug] = await upsert('ikhtilaf-topics', bySlug(t.slug), {
      ...data,
      reviewNote: t.reviewNote,
      publishedAt: t.publishedAt,
      _status: 'published',
      reviewStatus: 'published',
      createdBy: userOf[t.author] ?? superAdmin,
      publishedBy: superAdmin,
      approvals: approvalsFor(t.reviewers, hash, t.publishedAt),
      reviewedBy: t.reviewers.map((r) => person[r]),
    })
  }
  const ikhSlugs = Object.keys(ikh)
  for (const slug of ikhSlugs) {
    await payload.update({
      collection: 'ikhtilaf-topics',
      id: ikh[slug]!,
      data: { relatedTopics: ikhSlugs.filter((s) => s !== slug).map((s) => ikh[s]) } as never,
      overrideAccess: true,
      context: CTX,
      draft: false,
    })
  }
  log('ikhtilaf topics', IKHTILAF.length)

  // questions
  const question: Record<string, Id> = {}
  for (const q of QUESTIONS) {
    const published = q.status === 'published'
    const data: Record<string, unknown> = {
      title: q.title,
      slug: q.slug,
      body: q.body,
      category: cat[q.category],
      subTopic: q.subTopic ?? null,
      answer: q.answer ?? null,
      answeredBy: q.answeredBy ? person[q.answeredBy] : null,
      references: q.references ?? [],
    }
    const hash = computeContentHash(data, WORKFLOW_HASH_FIELDS.questions)
    question[q.slug] = await upsert('questions', bySlug(q.slug), {
      ...data,
      askedBy: q.askedByDemo ? demo : null,
      anonymous: q.anonymous ?? true,
      askerDistrict: q.askerDistrict ?? null,
      moderation: 'accepted',
      assignedTo: q.answeredBy ? (userOf[q.answeredBy] ?? null) : null,
      createdBy: q.answeredBy ? (userOf[q.answeredBy] ?? null) : null,
      publishedAt: q.publishedAt ?? null,
      _status: published ? 'published' : 'draft',
      reviewStatus: published ? 'published' : 'in_review',
      publishedBy: published ? superAdmin : null,
      approvals: published
        ? approvalsFor(q.reviewers ?? ['mahmudul-hasan', 'imran-khalil'], hash, q.publishedAt!)
        : [],
      reviewedBy: (q.reviewers ?? []).map((r) => person[r]),
      helpfulYes: q.helpfulYes ?? 0,
      createdAt: q.createdAt,
    })
  }
  const related = [
    'ruling-on-reciting-fatiha-behind-the-imam',
    'no-congregation-at-the-office',
    'is-following-a-madhhab-obligatory',
  ]
  await payload.update({
    collection: 'questions',
    id: question['praying-behind-an-imam-of-another-madhhab']!,
    data: { relatedQuestions: related.map((s) => question[s]) } as never,
    overrideAccess: true,
    context: CTX,
    draft: false,
  })
  log('questions', QUESTIONS.length)

  // courses + lessons
  const course: Record<string, Id> = {}
  const lessonIds: Record<string, Id[]> = {}
  for (const c of COURSES) {
    course[c.slug] = await upsert('courses', bySlug(c.slug), {
      title: c.title,
      slug: c.slug,
      description: c.description,
      journeyStage: c.journeyStage,
      level: c.level,
      tint: c.tint,
      instructor: person[c.instructor],
      reviewedBy: c.reviewers.map((r) => person[r]),
      durationMinutes: c.durationMinutes,
      order: c.order,
      modules: c.modules.map((title) => ({ title })),
      status: 'published',
    })
    lessonIds[c.slug] = []
    for (const [i, l] of c.lessons.entries()) {
      const id = await upsert(
        'lessons',
        { and: [{ course: { equals: course[c.slug] } }, { slug: { equals: l.slug } }] },
        {
          title: l.title,
          slug: l.slug,
          course: course[c.slug],
          module: l.module,
          order: i + 1,
          durationMinutes: l.minutes,
          content: l.content,
          media: l.media
            ? {
                kind: 'youtube',
                youtubeId: l.media.youtubeId,
                durationSeconds: l.media.durationSeconds,
              }
            : { kind: 'none' },
          quiz: (l.quiz ?? []).map((q) => ({
            question: q.question,
            options: q.options.map((text) => ({ text })),
            correctIndex: q.correctIndex,
            explanation: q.explanation,
          })),
          status: 'published',
        },
      )
      lessonIds[c.slug]!.push(id)
    }
  }
  log(
    'courses & lessons',
    COURSES.reduce((n, c) => n + c.lessons.length, COURSES.length),
  )

  // demo learning progress: 7/12 and 2/8
  const progress: [string, number][] = [
    ['six-pillars-of-iman', 7],
    ['salah-step-by-step', 2],
  ]
  for (const [slug, done] of progress) {
    const lessons = lessonIds[slug]!
    for (const [i, lessonId] of lessons.slice(0, done).entries()) {
      await upsert(
        'lesson-progress',
        { and: [{ user: { equals: demo } }, { lesson: { equals: lessonId } }] },
        {
          user: demo,
          lesson: lessonId,
          course: course[slug],
          completedAt: ago(24 * (done - i) * 2),
        },
      )
    }
    await upsert(
      'enrollments',
      { and: [{ user: { equals: demo } }, { course: { equals: course[slug] } }] },
      {
        user: demo,
        course: course[slug],
        completedLessons: done,
        progress: Math.round((done / lessons.length) * 100),
        lastLesson: lessons[done] ?? lessons[done - 1],
        lastActivityAt: ago(20),
      },
    )
  }
  // completed courses for the public profile
  log('demo enrollments')

  // events
  const event: Record<string, Id> = {}
  for (const e of EVENTS) {
    event[e.slug] = await upsert('events', bySlug(e.slug), {
      title: e.title,
      slug: e.slug,
      summary: e.summary,
      startsAt: e.startsAt,
      endsAt: e.endsAt ?? null,
      timeLabel: e.timeLabel ?? null,
      mode: e.mode,
      district: e.district ?? null,
      venueName: e.venueName ?? null,
      venueAddress: e.venueAddress ?? null,
      category: e.category ? cat[e.category] : null,
      audience: e.audience,
      separateSeating: e.separateSeating ?? false,
      capacity: e.capacity,
      reservedSeats: e.reservedSeats,
      description: e.description,
      agenda: e.agenda,
      speakers: e.speakers.map((s) => person[s]),
      speakerNotes: (e.speakerNotes ?? []).map((note) => ({ note })),
      onlineUrl: e.onlineUrl ?? null,
      status: 'published',
    })
  }
  const demoRegs: [string, string, 'brothers' | null][] = [
    ['etiquette-of-disagreement-from-the-companions', 'RH-1010-312', null],
    ['tazkiyah-majlis-diseases-of-the-heart', 'RH-1610-088', 'brothers'],
  ]
  for (const [slug, code, seating] of demoRegs) {
    await upsert(
      'event-registrations',
      { code: { equals: code } },
      {
        event: event[slug],
        user: demo,
        code,
        name: 'আব্দুল্লাহ আল মামুন',
        phone: '+8801712345678',
        email: 'abdullah@ruhama.local',
        seating,
        guests: 0,
        status: 'confirmed',
      },
    )
  }
  log('events', EVENTS.length)

  // circles
  const circle: Record<string, Id> = {}
  const meetupIds: Id[] = []
  for (const c of CIRCLES) {
    circle[c.slug] = await upsert('circles', bySlug(c.slug), {
      name: c.name,
      slug: c.slug,
      district: c.district,
      type: c.type,
      area: c.area ?? null,
      focus: c.focus,
      frequency: c.frequency,
      scheduleLabel: c.scheduleLabel,
      description: c.description,
      venue: c.venue ?? null,
      sinceLabel: c.sinceLabel ?? null,
      memberUnit: c.memberUnit ?? 'people',
      offlineMembers: c.offlineMembers,
      format: CIRCLE_FORMAT,
      rules: CIRCLE_RULES.map((rule) => ({ rule })),
      team: (c.team ?? []).map((t) => ({
        ...t,
        user: t.name === 'তানভীর ইসলাম' ? userOf['tanvir-islam'] : null,
      })),
      coordinator: c.slug === 'khulna-sadar-circle' ? userOf['tanvir-islam'] : null,
      status: 'published',
    })
    for (const m of c.meetups) {
      meetupIds.push(
        await upsert(
          'circle-meetups',
          { and: [{ circle: { equals: circle[c.slug] } }, { startsAt: { equals: m.startsAt } }] },
          { circle: circle[c.slug], ...m },
        ),
      )
    }
  }
  await upsert(
    'circle-memberships',
    { and: [{ circle: { equals: circle['khulna-sadar-circle'] } }, { user: { equals: demo } }] },
    {
      circle: circle['khulna-sadar-circle'],
      user: demo,
      status: 'approved',
      message: 'আমি সোনাডাঙ্গায় থাকি, শুক্রবার সন্ধ্যায় আসতে পারব।',
    },
  )
  await upsert(
    'meetup-rsvps',
    { and: [{ meetup: { equals: meetupIds[0] } }, { user: { equals: demo } }] },
    { meetup: meetupIds[0], user: demo },
  )
  log('circles', CIRCLES.length)

  // videos
  const playlist: Record<string, Id> = {}
  for (const pl of PLAYLISTS)
    playlist[pl.slug] = await upsert('playlists', bySlug(pl.slug), { ...pl })
  for (const [i, v] of VIDEOS.entries()) {
    await upsert('videos', bySlug(v.slug), {
      title: v.title,
      shortTitle: v.shortTitle,
      slug: v.slug,
      youtubeId: `RHdemo${String(i + 1).padStart(5, '0')}`,
      speaker: person[v.speaker],
      category: cat[v.category],
      playlist: v.playlist ? playlist[v.playlist] : null,
      episode: v.episode ?? null,
      durationSeconds: v.durationSeconds,
      description: v.description ?? null,
      chapters: v.chapters ?? [],
      references: v.references ?? [],
      level: v.level ?? 'beginner',
      tint: v.tint,
      viewCount: v.viewCount,
      publishedAt: v.publishedAt,
      reviewed: true,
      status: 'published',
    })
  }
  log('videos & playlists', VIDEOS.length + PLAYLISTS.length)

  // forum
  const threadIds: Id[] = []
  const postIds: Id[] = []
  for (const t of THREADS) {
    const lastPost = t.posts.reduce((min, p) => Math.min(min, p.hoursAgo), t.hoursAgo)
    const threadId = await upsert('forum-threads', bySlug(t.slug), {
      title: t.title,
      slug: t.slug,
      category: fcat[t.category],
      author: member[t.author],
      anonymous: t.anonymous ?? false,
      body: t.body,
      status: 'published',
      pinned: t.pinned ?? false,
      viewCount: t.viewCount,
      lastActivityAt: ago(lastPost),
      modNote: t.modNote ? { text: t.modNote, by: moderator, at: ago(48) } : {},
      createdAt: ago(t.hoursAgo),
    })
    threadIds.push(threadId)
    const keyToId: Record<string, Id> = {}
    let helpful: Id | null = null
    for (const p of t.posts) {
      const existing = await payload.find({
        collection: 'forum-posts',
        where: { and: [{ thread: { equals: threadId } }, { body: { equals: p.body } }] },
        limit: 1,
        overrideAccess: true,
      })
      const data = {
        thread: threadId,
        parent: p.parentKey ? keyToId[p.parentKey] : null,
        author: member[p.author],
        body: p.body,
        arabic: p.arabic ?? null,
        reference: p.reference ?? null,
        status: p.removed ? 'removed' : 'published',
        removedReason: p.removed ? 'আদব নীতিমালা ভঙ্গ' : null,
        markedHelpful: p.markedHelpful ?? false,
        createdAt: ago(p.hoursAgo),
      }
      const id = existing.docs[0]
        ? (
            await payload.update({
              collection: 'forum-posts',
              id: existing.docs[0].id,
              data: data as never,
              overrideAccess: true,
              context: CTX,
            })
          ).id
        : (
            await payload.create({
              collection: 'forum-posts',
              data: data as never,
              overrideAccess: true,
              context: CTX,
            })
          ).id
      keyToId[p.key] = id as Id
      postIds.push(id as Id)
      if (p.markedHelpful) helpful = id as Id
      for (const by of p.helpfulBy ?? []) {
        await upsert(
          'forum-reactions',
          { and: [{ post: { equals: id } }, { user: { equals: member[by] } }] },
          { post: id, thread: threadId, user: member[by] },
        )
      }
    }
    await payload.update({
      collection: 'forum-threads',
      id: threadId,
      data: { helpfulPost: helpful } as never,
      overrideAccess: true,
      context: CTX,
    })
  }
  log('forum threads & replies', THREADS.length)

  // globals and pages
  await payload.updateGlobal({ slug: 'site-settings', data: SITE_SETTINGS as never, context: CTX })
  await payload.updateGlobal({
    slug: 'home-page',
    data: { ...HOME_PAGE, featuredIkhtilaf: ikh['raising-hands-in-ruku'] } as never,
    context: CTX,
  })
  await payload.updateGlobal({ slug: 'about-page', data: ABOUT_PAGE as never, context: CTX })
  await payload.updateGlobal({ slug: 'adab-policy', data: ADAB_POLICY as never, context: CTX })
  await payload.updateGlobal({
    slug: 'moderation-settings',
    data: {
      firstPostsModerated: 3,
      reportThreshold: 3,
      maxLinks: 2,
      postsPerHour: 10,
      blockedTerms: ['কাফির বলুন', 'মুরতাদ', 'বিদআতি দল'],
    } as never,
    context: CTX,
  })
  for (const page of PAGES)
    await upsert('pages', bySlug(page.slug), { ...page, status: 'published' })
  log('globals & pages', PAGES.length + 5)

  // daily reminders (linked to imported verses when available)
  for (const a of DAILY_AYAHS) {
    const ayahDoc = await payload.find({
      collection: 'ayahs',
      where: { key: { equals: `${a.surah}:${a.ayah}` } },
      limit: 1,
      depth: 0,
    })
    await upsert(
      'daily-reminders',
      { and: [{ kind: { equals: 'ayah' } }, { 'custom.reference': { equals: a.reference } }] },
      {
        kind: 'ayah',
        ayah: ayahDoc.docs[0]?.id ?? null,
        date: 'date' in a && a.date ? `${a.date}T00:00:00.000Z` : null,
        custom: { arabic: a.arabic, translation: a.translation, reference: a.reference },
        active: true,
      },
    )
  }
  for (const h of DAILY_HADITHS) {
    const hadithDoc = await payload.find({
      collection: 'hadiths',
      where: { key: { equals: h.key } },
      limit: 1,
      depth: 0,
    })
    await upsert(
      'daily-reminders',
      { and: [{ kind: { equals: 'hadith' } }, { 'custom.reference': { equals: h.reference } }] },
      {
        kind: 'hadith',
        hadith: hadithDoc.docs[0]?.id ?? null,
        date: 'date' in h && h.date ? `${h.date}T00:00:00.000Z` : null,
        custom: {
          arabic: h.arabic,
          translation: h.translation,
          reference: h.reference,
          narrator: h.narrator,
          grade: h.grade,
        },
        active: true,
      },
    )
  }
  log('daily reminders', DAILY_AYAHS.length + DAILY_HADITHS.length)

  // demo member: notifications and bookmarks
  await payload.delete({
    collection: 'notifications',
    where: { recipient: { equals: demo } },
    overrideAccess: true,
  })
  for (const n of DEMO_NOTIFICATIONS) {
    await payload.create({
      collection: 'notifications',
      data: {
        recipient: demo,
        kind: n.kind,
        text: n.text,
        link: n.link,
        read: n.read,
        createdAt: ago(n.minutesAgo / 60),
      } as never,
      overrideAccess: true,
      context: CTX,
    })
  }
  const bookmarks: ['articles' | 'ikhtilaf-topics', Id][] = [
    ['articles', article['sunnah-of-speaking-with-a-disagreeing-brother']!],
    ['articles', article['riya-the-hidden-shirk']!],
    ['ikhtilaf-topics', ikh['raising-hands-in-ruku']!],
    ['articles', article['khushu-in-salah']!],
  ]
  for (const [relationTo, value] of bookmarks) {
    const targetKey = `${relationTo}:${value}`
    await upsert(
      'bookmarks',
      { and: [{ user: { equals: demo } }, { targetKey: { equals: targetKey } }] },
      { user: demo, target: { relationTo, value }, targetKey },
    )
  }
  log('demo notifications & bookmarks', DEMO_NOTIFICATIONS.length + bookmarks.length)

  // cached counters
  for (const id of Object.values(cat)) await recountCategory(payload, id)
  for (const id of Object.values(person)) await recountPerson(payload, id)
  for (const id of Object.values(series)) await recountSeries(payload, id)
  for (const id of Object.values(course)) await recountCourse(payload, id)
  for (const id of Object.values(event)) await recountEvent(payload, id)
  for (const id of Object.values(circle)) await recountCircle(payload, id)
  for (const id of meetupIds) await recountMeetup(payload, id)
  for (const id of Object.values(playlist)) await recountPlaylist(payload, id)
  for (const id of postIds) await recountPostHelpful(payload, id)
  for (const id of threadIds) await recountThread(payload, id)
  for (const id of Object.values(fcat)) await recountForumCategory(payload, id)
  log('counters recomputed')

  console.info(`\nDone. Sign in with any seeded account, password: ${SEED_PASSWORD}`)
  console.info('  super admin   admin@ruhama.local')
  console.info('  shura         hakim@ruhama.local')
  console.info('  reviewers     mahmudul@ruhama.local, imran@ruhama.local')
  console.info('  authors       abdurrahman@ruhama.local, sumaiya@ruhama.local')
  console.info('  editor/mod    tanvir@ruhama.local, moderator@ruhama.local')
  console.info('  member        abdullah@ruhama.local\n')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
