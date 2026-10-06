import { IconExternal, IconNext } from '@/components/icons'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { BookmarkButton } from '@/components/actions/bookmark-button'
import { ShareButton } from '@/components/actions/share-button'
import { PersonAvatar, personHref } from '@/components/content/cards'
import { DalilBox, type DalilItem } from '@/components/content/scripture'
import { JsonLd } from '@/components/seo/json-ld'
import { Badge, LevelBadge, ReviewedBadge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/ui/primitives'
import { VideoThumb } from '@/components/videos/video-card'
import { ChapterList, VideoPlayer, VideoProvider } from '@/components/videos/video-player'
import { bn, bnCompact, formatDate, formatDuration } from '@/lib/format'
import { cn } from '@/lib/utils'
import { breadcrumbLd, buildMetadata, videoLd } from '@/lib/seo'
import { data } from '@/server/data'
import { toCategory, toPerson } from '@/server/queries/articles'

export const revalidate = 86400

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  try {
    const list = await data.videos({ limit: 24 })
    return list.docs.map((v) => ({ slug: v.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const res = await data.video(slug)
  if (!res)
    return buildMetadata({ title: 'ভিডিওটি পাওয়া যায়নি', path: `/videos/${slug}`, noIndex: true })
  const v = res.video
  return buildMetadata({
    title: v.title,
    description: v.description || v.title,
    path: `/videos/${slug}`,
    type: 'video.other',
    image: `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`,
  })
}

export default async function VideoPage({ params }: Props) {
  const { slug } = await params
  const res = await data.video(slug)
  if (!res) notFound()
  const { video, playlistVideos, related } = res

  const category = toCategory(video.category)
  const speaker = toPerson(video.speaker)
  const speakerDoc = video.speaker && typeof video.speaker === 'object' ? video.speaker : null
  const playlist = video.playlist && typeof video.playlist === 'object' ? video.playlist : null
  const chapters = (video.chapters ?? []).map((c) => ({ start: c.start, title: c.title }))
  const references = ((video.references ?? []) as DalilItem[]).filter((r) => r.citation)
  const articles = ((video.relatedArticles ?? []) as unknown[]).filter(
    (a): a is { id: number; title: string; slug: string } => Boolean(a && typeof a === 'object'),
  )
  const position = playlistVideos.findIndex((p) => p.id === video.id)
  const eyebrow = playlist
    ? `${playlist.title}${video.episode ? ` · পর্ব ${bn(video.episode)}` : ''}`
    : (category?.name ?? null)
  const path = `/videos/${video.slug}`

  return (
    <main id="main">
      <section className="section-sm" style={{ paddingTop: 28 }}>
        <div className="rh-container">
          <div style={{ marginBottom: 18 }}>
            <Breadcrumbs
              items={[
                { label: 'ভিডিও লাইব্রেরি', href: '/videos' },
                ...(playlist
                  ? [
                      {
                        label: playlist.title,
                        href: playlistVideos[0] ? `/videos/${playlistVideos[0].slug}` : '/videos',
                      },
                    ]
                  : []),
                {
                  label: video.episode
                    ? `পর্ব ${bn(video.episode)}`
                    : video.shortTitle || video.title,
                },
              ]}
            />
          </div>
          <VideoProvider chapters={chapters}>
            <div className="layout-side" style={{ gap: 32 }}>
              <div
                className="layout-side__main"
                style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
              >
                <VideoPlayer
                  videoId={video.youtubeId}
                  title={video.shortTitle || video.title}
                  eyebrow={eyebrow}
                  durationSeconds={video.durationSeconds}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {category ? <Badge variant="cat">{category.name}</Badge> : null}
                    <LevelBadge level={video.level} />
                    {video.reviewed ? <ReviewedBadge /> : null}
                  </div>
                  <h1 className="t-h2">{video.title}</h1>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <span className="t-small t-muted">
                      {[
                        video.viewCount ? `${bnCompact(video.viewCount)} বার দেখা` : null,
                        video.publishedAt ? `প্রকাশ: ${formatDate(video.publishedAt)}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <BookmarkButton
                        target={{ collection: 'videos', id: video.id }}
                        variant="ghost"
                      />
                      <ShareButton title={video.title} path={path} variant="ghost" label="শেয়ার" />
                      <a
                        href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                        className="btn btn-ghost btn-sm"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <IconExternal className="ic" aria-hidden="true" />
                        YouTube-এ দেখুন
                      </a>
                    </div>
                  </div>
                </div>

                {speaker ? (
                  <Link
                    href={personHref(speaker)}
                    className="card card-hover"
                    style={{
                      padding: '18px 20px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 14,
                      textDecoration: 'none',
                      color: 'var(--rh-ink)',
                    }}
                  >
                    <PersonAvatar person={speaker} size="lg" />
                    <span style={{ flex: '1 1 220px' }}>
                      <strong
                        style={{ display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.5 }}
                      >
                        {speaker.name}
                        {speaker.verified ? (
                          <Badge variant="verified" style={{ height: 24 }}>
                            যাচাইকৃত
                          </Badge>
                        ) : null}
                      </strong>
                      <span className="t-small t-muted">
                        {[
                          speakerDoc?.specialty || speaker.title,
                          speakerDoc?.lectureCount
                            ? `${bn(speakerDoc.lectureCount)}টি লেকচার`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                    <span className="link-arrow">
                      প্রোফাইল দেখুন <IconNext className="ic" aria-hidden="true" />
                    </span>
                  </Link>
                ) : null}

                {video.description ? (
                  <section aria-labelledby="vd-desc">
                    <h2 id="vd-desc" className="t-h4">
                      বিবরণ
                    </h2>
                    <p style={{ marginTop: 10, lineHeight: 1.85, whiteSpace: 'pre-line' }}>
                      {video.description}
                    </p>
                  </section>
                ) : null}

                <ChapterList />
                <DalilBox id="vd-dalil" title="লেকচারে উল্লিখিত দলিল" items={references} />

                {articles.length ? (
                  <section aria-labelledby="vd-art">
                    <h2 id="vd-art" className="t-h4" style={{ marginBottom: 6 }}>
                      আরও পড়ুন
                    </h2>
                    <ul className="list-reset">
                      {articles.map((a) => (
                        <li key={a.id}>
                          <Link href={`/ilm/${a.slug}`} className="row-link">
                            <span className="row-link__title" style={{ flex: 1 }}>
                              {a.title}
                            </span>
                            <IconNext
                              className="ic"
                              aria-hidden="true"
                              style={{ color: 'var(--rh-muted)' }}
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>

              <aside
                className="layout-side__aside layout-side__aside--right"
                aria-label="প্লেলিস্ট ও সম্পর্কিত ভিডিও"
                style={{ maxWidth: 400 }}
              >
                {playlist && playlistVideos.length ? (
                  <section className="card" aria-labelledby="vd-pl" style={{ padding: 16 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        padding: '4px 8px 12px',
                        gap: 8,
                      }}
                    >
                      <h2 id="vd-pl" className="t-h4" style={{ fontSize: 17 }}>
                        {playlist.title}
                      </h2>
                      <span className="t-caption t-muted" style={{ whiteSpace: 'nowrap' }}>
                        {bn(position + 1)} / {bn(playlistVideos.length)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        maxHeight: 520,
                        overflowY: 'auto',
                      }}
                    >
                      {playlistVideos.map((p, i) => {
                        const current = p.id === video.id
                        return (
                          <Link
                            key={p.id}
                            href={`/videos/${p.slug}`}
                            className={cn('pl-item', current && 'is-current')}
                            aria-current={current ? 'page' : undefined}
                          >
                            <span className="pl-thumb">
                              <span className="rh-pattern" aria-hidden="true" />
                              <span style={{ fontSize: 12, color: '#F6F1E6' }}>
                                {bn(p.episode ?? i + 1)}
                              </span>
                            </span>
                            <span style={{ minWidth: 0 }}>
                              <span style={{ display: 'block', fontWeight: 600 }}>
                                {p.shortTitle || p.title}
                              </span>
                              <span className="t-caption t-muted">
                                {formatDuration(p.durationSeconds)}
                              </span>
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  </section>
                ) : null}
                {related.length ? (
                  <section aria-labelledby="vd-rel">
                    <h2 id="vd-rel" className="t-h4" style={{ fontSize: 17, marginBottom: 12 }}>
                      সম্পর্কিত ভিডিও
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {related.map((r) => (
                        <Link
                          key={r.id}
                          href={`/videos/${r.slug}`}
                          className="card card-hover vcard"
                        >
                          <VideoThumb
                            tint={r.tint}
                            title={r.shortTitle || r.title}
                            duration={formatDuration(r.durationSeconds)}
                            play={false}
                            style={{ aspectRatio: '16 / 7' }}
                            titleStyle={{ fontSize: 15 }}
                          />
                          <div className="vcard__body" style={{ padding: '12px 14px' }}>
                            <span className="t-small">{r.speaker?.name}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : null}
              </aside>
            </div>
          </VideoProvider>
        </div>
      </section>
      <JsonLd
        data={[
          videoLd({
            title: video.title,
            description: video.description ?? '',
            path,
            youtubeId: video.youtubeId,
            durationSeconds: video.durationSeconds,
            publishedAt: video.publishedAt,
            chapters,
          }),
          breadcrumbLd([
            { name: 'ভিডিও লাইব্রেরি', path: '/videos' },
            { name: video.title, path },
          ]),
        ]}
      />
    </main>
  )
}
