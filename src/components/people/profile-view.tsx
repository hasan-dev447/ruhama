import {
  IconBook,
  IconChevronNext,
  IconInfo,
  IconQuestion,
  IconShield,
  IconSpeaker,
  IconVerified,
  IconWrite,
} from '@/components/icons'
import Link from 'next/link'

import { ShareButton } from '@/components/actions/share-button'
import { ProfileCover } from '@/components/profile/profile-cover'
import { ProfilePhoto } from '@/components/profile/profile-photo'
import { eventPlace, eventWhen } from '@/components/content/cards'
import { Badge } from '@/components/ui/badge'
import { ButtonLink, LinkArrow } from '@/components/ui/button'
import { Breadcrumbs, DateTile, IconTile } from '@/components/ui/primitives'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VideoThumb } from '@/components/videos/video-card'
import {
  bn,
  bnCompact,
  formatDay,
  formatDuration,
  formatMonth,
  readingTimeLabel,
} from '@/lib/format'
import type { Person, Series } from '@/payload-types'
import type { ProfileCover as ProfileCoverData } from '@/server/queries/profile-cover'
import type {
  ArticleCardView,
  EventCardView,
  QuestionCardView,
  VideoCardView,
} from '@/server/queries/types'

type Paged<T> = { docs: T[]; totalDocs: number }

export type PersonContent = {
  articles: Paged<ArticleCardView>
  reviewed: Paged<ArticleCardView>
  answers: Paged<QuestionCardView>
  videos: Paged<VideoCardView>
  events: EventCardView[]
  series: Series[]
}

const KIND_BADGE = {
  scholar: ['আলিম প্যানেল', 'verified'],
  author: ['লেখক', 'cat'],
  reviewer: ['রিভিউয়ার', 'reviewed'],
  speaker: ['বক্তা', 'level'],
} as const
const ROLE_ICON = { author: IconWrite, reviewer: IconShield, speaker: IconSpeaker } as const
const ROLE_LABEL = { author: 'লেখক', reviewer: 'রিভিউয়ার', speaker: 'বক্তা' } as const

function Row({
  href,
  title,
  meta,
  mark,
}: {
  href: string
  title: string
  meta: string
  mark?: React.ReactNode
}) {
  return (
    <li>
      <Link href={href} className="row-link" style={{ padding: '18px 0' }}>
        {mark ? (
          <IconTile teal size={42}>
            {mark}
          </IconTile>
        ) : null}
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="row-link__title" style={{ display: 'block' }}>
            {title}
          </span>
          <span className="t-small t-muted">{meta}</span>
        </span>
        <IconChevronNext className="ic" aria-hidden="true" style={{ color: 'var(--rh-muted)' }} />
      </Link>
    </li>
  )
}

const articleMeta = (a: ArticleCardView) =>
  [a.category?.name, readingTimeLabel(a.readingTime)].filter(Boolean).join(' · ')

function VideoGrid({ videos, min = 260 }: { videos: VideoCardView[]; min?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}px, 100%), 1fr))`,
        gap: 16,
        marginTop: 16,
      }}
    >
      {videos.map((v) => (
        <Link key={v.id} href={`/videos/${v.slug}`} className="card card-hover vcard">
          <VideoThumb
            tint={v.tint}
            title={v.shortTitle || v.title}
            duration={formatDuration(v.durationSeconds)}
          />
          <div className="vcard__body">
            <span className="t-small t-muted">
              {[v.category?.name, v.viewCount ? `${bnCompact(v.viewCount)} বার দেখা` : null]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}

/** Shared layout of the scholar (`ScholarProfile`) and speaker/author (`SpeakerProfile`) boards. */
export function ProfileView({
  person,
  content,
  variant,
  extras = { cover: null, photo: null },
}: {
  person: Person
  content: PersonContent
  variant: 'scholar' | 'speaker'
  /** the linked member's cover and photo, when they show them publicly */
  extras?: { cover: ProfileCoverData | null; photo: { src: string; large: string } | null }
}) {
  const isScholar = variant === 'scholar'
  const kinds = (person.kinds ?? []) as (keyof typeof KIND_BADGE)[]
  const path = isScholar ? `/scholars/${person.slug}` : `/speakers/${person.slug}`
  const education = person.education ?? []
  const expertise = person.expertise ?? []
  const roleNotes = person.roleNotes ?? []
  const tone = person.avatarTone === 'gold' ? 'gold' : 'teal'

  const stats = isScholar
    ? [
        [person.articleCount, 'প্রবন্ধ'],
        [person.answerCount, 'উত্তর'],
        [person.lectureCount, 'লেকচার'],
        [person.reviewedCount, 'রিভিউকৃত কনটেন্ট'],
      ]
    : [
        [person.articleCount, 'প্রবন্ধ'],
        [person.lectureCount, 'লেকচার'],
        [person.eventTalkCount, 'মজলিসে বক্তৃতা'],
        [person.seriesCount, 'ধারাবাহিক সিরিজ'],
      ]

  return (
    <main id="main">
      <ProfileCover cover={extras.cover} tone={isScholar ? 'teal' : 'gold'} />
      <div className="rh-container">
        <div className="profile-head">
          <ProfilePhoto name={person.name} photo={extras.photo} tone={tone} />
          <div
            className="profile-head__info"
            style={{
              flex: '1 1 420px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              paddingBottom: 4,
            }}
          >
            <Breadcrumbs
              items={[
                { label: 'হোম', href: '/' },
                { label: isScholar ? 'স্কলার' : 'লেখক ও বক্তা', href: '/scholars' },
                { label: person.name },
              ]}
            />
            <div
              style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 14px' }}
            >
              <h1 className="t-h1" style={{ fontSize: 'clamp(1.875rem, 1.5rem + 1.4vw, 2.5rem)' }}>
                {person.name}
              </h1>
              {isScholar && person.verified ? (
                <Badge variant="verified">
                  <IconVerified className="ic" aria-hidden="true" />
                  যাচাইকৃত আলিম
                </Badge>
              ) : null}
            </div>
            <p className="t-muted">
              {[person.title, person.specialty].filter(Boolean).join(' · ')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {kinds
                .filter((k) => k !== 'scholar')
                .map((k) => (
                  <Badge key={k} variant={KIND_BADGE[k][1]}>
                    {KIND_BADGE[k][0]}
                  </Badge>
                ))}
              {!isScholar && person.verified ? (
                <Badge variant="neutral">যাচাইকৃত পরিচয়</Badge>
              ) : null}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
            <ShareButton title={person.name} path={path} variant="secondary" label="শেয়ার" />
            {isScholar ? (
              <ButtonLink href="/qa#ask" size="sm">
                প্রশ্ন করুন
              </ButtonLink>
            ) : (
              <ButtonLink href={`/contact?topic=invite&person=${person.slug}`} size="sm">
                আমন্ত্রণ জানান
              </ButtonLink>
            )}
          </div>
        </div>

        <div className="stat-tiles" style={{ marginTop: 32 }}>
          {stats.map(([n, label]) => (
            <div key={label as string} className="stat-tile">
              <strong>{bn((n as number | null) ?? 0)}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="layout-side" style={{ marginTop: 40, paddingBottom: 96 }}>
          <aside className="layout-side__aside" aria-label="পরিচিতি" style={{ maxWidth: 340 }}>
            {person.bio ? (
              <section
                className="card card-pad"
                aria-labelledby="bio-h"
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <h2 id="bio-h" className="t-h4">
                  পরিচিতি
                </h2>
                <p className="t-small" style={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                  {person.bio}
                </p>
                {person.joinedLabel || person.location ? (
                  <p className="t-caption t-muted">
                    {[person.joinedLabel ? `যোগদান: ${person.joinedLabel}` : null, person.location]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                ) : null}
              </section>
            ) : null}
            {education.length ? (
              <section className="card card-pad" aria-labelledby="edu-h">
                <h2 id="edu-h" className="t-h4" style={{ marginBottom: 16 }}>
                  {isScholar ? 'শিক্ষা' : 'শিক্ষা ও প্রশিক্ষণ'}
                </h2>
                <ul className="edu-list">
                  {education.map((e, i) => (
                    <li key={e.id ?? i}>
                      <strong>{e.degree}</strong>
                      {e.institution ? <span>{e.institution}</span> : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {expertise.length ? (
              <section
                className="card card-pad"
                aria-labelledby="exp-h"
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <h2 id="exp-h" className="t-h4">
                  {isScholar ? 'বিশেষজ্ঞতা' : 'যে বিষয়ে বলেন'}
                </h2>
                <div className="tag-row">
                  {expertise.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}
            {isScholar && roleNotes.length ? (
              <section
                className="card card-pad"
                aria-labelledby="role-h"
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <h2 id="role-h" className="t-h4">
                  Ruhama-তে ভূমিকা
                </h2>
                <div className="info-list" style={{ gap: 10 }}>
                  {roleNotes.map((r, i) => {
                    const Icon = ROLE_ICON[r.role]
                    return (
                      <div key={r.id ?? i}>
                        <Icon className="ic" aria-hidden="true" />
                        <div>
                          <strong>{ROLE_LABEL[r.role]}</strong>
                          <span className="t-muted t-small">{r.note}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            ) : null}
            {!isScholar && person.disclaimer ? (
              <div className="privacy-note">
                <IconInfo className="ic" aria-hidden="true" />
                <span>{person.disclaimer}</span>
              </div>
            ) : null}
          </aside>

          {isScholar ? (
            <div className="layout-side__main">
              <Tabs
                defaultValue={
                  content.articles.docs.length
                    ? 'articles'
                    : content.answers.docs.length
                      ? 'answers'
                      : content.videos.docs.length
                        ? 'videos'
                        : 'reviewed'
                }
              >
                <TabsList label="কনটেন্ট">
                  <TabsTrigger value="articles">
                    প্রবন্ধ{' '}
                    <span className="t-caption t-muted">{bn(content.articles.totalDocs)}</span>
                  </TabsTrigger>
                  <TabsTrigger value="answers">
                    উত্তর <span className="t-caption t-muted">{bn(content.answers.totalDocs)}</span>
                  </TabsTrigger>
                  <TabsTrigger value="videos">
                    লেকচার <span className="t-caption t-muted">{bn(content.videos.totalDocs)}</span>
                  </TabsTrigger>
                  <TabsTrigger value="reviewed">
                    রিভিউ{' '}
                    <span className="t-caption t-muted">{bn(content.reviewed.totalDocs)}</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="articles" style={{ marginTop: 8 }}>
                  {content.articles.docs.length ? (
                    <ul className="list-reset">
                      {content.articles.docs.map((a) => (
                        <Row
                          key={a.id}
                          href={`/ilm/${a.slug}`}
                          title={a.title}
                          meta={articleMeta(a)}
                          mark={<IconBook className="ic" aria-hidden="true" />}
                        />
                      ))}
                    </ul>
                  ) : (
                    <p className="t-muted" style={{ padding: '24px 0' }}>
                      এখনো কোনো প্রবন্ধ প্রকাশিত হয়নি।
                    </p>
                  )}
                  {content.articles.totalDocs > content.articles.docs.length ? (
                    <ButtonLink
                      href={`/ilm?q=${encodeURIComponent(person.name)}`}
                      variant="ghost"
                      size="sm"
                      style={{ marginTop: 12 }}
                    >
                      আরও দেখুন
                    </ButtonLink>
                  ) : null}
                </TabsContent>
                <TabsContent value="answers" style={{ marginTop: 8 }}>
                  {content.answers.docs.length ? (
                    <ul className="list-reset">
                      {content.answers.docs.map((q) => (
                        <Row
                          key={q.id}
                          href={`/qa/${q.slug}`}
                          title={q.title}
                          meta={q.category?.name ?? 'প্রশ্নোত্তর'}
                          mark={<IconQuestion className="ic" aria-hidden="true" />}
                        />
                      ))}
                    </ul>
                  ) : (
                    <p className="t-muted" style={{ padding: '24px 0' }}>
                      এখনো কোনো উত্তর প্রকাশিত হয়নি।
                    </p>
                  )}
                </TabsContent>
                <TabsContent value="videos">
                  {content.videos.docs.length ? (
                    <VideoGrid videos={content.videos.docs} />
                  ) : (
                    <p className="t-muted" style={{ padding: '24px 0' }}>
                      এখনো কোনো লেকচার নেই।
                    </p>
                  )}
                  {content.videos.totalDocs > content.videos.docs.length ? (
                    <ButtonLink
                      href={`/videos?speaker=${person.slug}`}
                      variant="ghost"
                      size="sm"
                      style={{ marginTop: 12 }}
                    >
                      সব লেকচার
                    </ButtonLink>
                  ) : null}
                </TabsContent>
                <TabsContent value="reviewed" style={{ marginTop: 8 }}>
                  {content.reviewed.docs.length ? (
                    <ul className="list-reset">
                      {content.reviewed.docs.map((a) => (
                        <Row
                          key={a.id}
                          href={`/ilm/${a.slug}`}
                          title={a.title}
                          meta={[articleMeta(a), a.author ? `লেখক: ${a.author.name}` : null]
                            .filter(Boolean)
                            .join(' · ')}
                          mark={<IconShield className="ic" aria-hidden="true" />}
                        />
                      ))}
                    </ul>
                  ) : (
                    <p className="t-muted" style={{ padding: '24px 0' }}>
                      এখনো কোনো রিভিউ নেই।
                    </p>
                  )}
                </TabsContent>
              </Tabs>
              <div className="privacy-note" style={{ marginTop: 32 }}>
                <IconInfo className="ic" aria-hidden="true" />
                <span>
                  এই প্রোফাইলের উদ্দেশ্য স্বচ্ছতা: কে লিখছেন ও কে রিভিউ করছেন তা জানা। এখানে
                  ব্যক্তির প্রশংসা নয়, দলিলই মানদণ্ড।
                </span>
              </div>
            </div>
          ) : (
            <div
              className="layout-side__main"
              style={{ display: 'flex', flexDirection: 'column', gap: 48 }}
            >
              {content.events.length || content.videos.docs.length ? (
                <section aria-labelledby="as-speaker">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                    <IconTile size={40}>
                      <IconSpeaker className="ic" aria-hidden="true" />
                    </IconTile>
                    <h2 id="as-speaker" className="t-h3">
                      বক্তা হিসেবে
                    </h2>
                  </div>
                  {content.events.length ? (
                    <>
                      <h3 className="t-h4" style={{ fontSize: 17, marginBottom: 10 }}>
                        আসন্ন বক্তৃতা
                      </h3>
                      <div className="card" style={{ padding: '4px 20px' }}>
                        {content.events.map((e) => (
                          <div key={e.id} className="meetup-row">
                            <DateTile
                              size="sm"
                              day={formatDay(e.startsAt)}
                              month={formatMonth(e.startsAt)}
                            />
                            <div>
                              <strong style={{ display: 'block', lineHeight: 1.5 }}>
                                {e.title}
                              </strong>
                              <span className="t-small t-muted">
                                {eventWhen(e)} · {eventPlace(e)}
                              </span>
                            </div>
                            <ButtonLink
                              href={`/events/${e.slug}#register`}
                              variant="secondary"
                              size="sm"
                            >
                              রেজিস্টার
                            </ButtonLink>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                  {content.videos.docs.length ? (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          margin: '28px 0 0',
                        }}
                      >
                        <h3 className="t-h4" style={{ fontSize: 17 }}>
                          রেকর্ড করা লেকচার
                        </h3>
                        <LinkArrow href={`/videos?speaker=${person.slug}`}>সব লেকচার</LinkArrow>
                      </div>
                      <VideoGrid videos={content.videos.docs.slice(0, 3)} min={250} />
                    </>
                  ) : null}
                </section>
              ) : null}
              {content.series.length || content.articles.docs.length ? (
                <section aria-labelledby="as-writer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                    <IconTile teal size={40}>
                      <IconWrite className="ic" aria-hidden="true" />
                    </IconTile>
                    <h2 id="as-writer" className="t-h3">
                      লেখক হিসেবে
                    </h2>
                  </div>
                  {content.series.length ? (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
                        gap: 16,
                        marginBottom: 20,
                      }}
                    >
                      {content.series.map((s) => (
                        <div
                          key={s.id}
                          className="card card-pad"
                          style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 22 }}
                        >
                          <Badge variant="level" style={{ alignSelf: 'flex-start' }}>
                            ধারাবাহিক
                            {s.plannedParts || s.articleCount
                              ? ` · ${bn(s.plannedParts || s.articleCount || 0)} পর্ব`
                              : ''}
                          </Badge>
                          <strong
                            style={{
                              fontFamily: 'var(--rh-font-heading)',
                              fontSize: 18,
                              lineHeight: 1.5,
                            }}
                          >
                            {s.title}
                          </strong>
                          {s.description ? (
                            <p className="t-small t-muted">{s.description}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <ul className="list-reset">
                    {content.articles.docs.map((a) => (
                      <Row
                        key={a.id}
                        href={`/ilm/${a.slug}`}
                        title={a.title}
                        meta={articleMeta(a)}
                      />
                    ))}
                  </ul>
                </section>
              ) : null}
              {!content.events.length &&
              !content.videos.docs.length &&
              !content.articles.docs.length ? (
                <p className="t-muted">শিগগিরই এখানে লেখা ও লেকচার যুক্ত হবে, ইনশাআল্লাহ।</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
