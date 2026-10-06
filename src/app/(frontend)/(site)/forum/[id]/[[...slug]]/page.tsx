import { IconDelete, IconShield, IconSuccess, IconVerified } from '@/components/icons'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import {
  MyPendingPosts,
  PostActions,
  ReplyBox,
  ThreadActions,
  ThreadProvider,
} from '@/components/forum/thread-client'
import { JsonLd } from '@/components/seo/json-ld'
import { Badge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/ui/primitives'
import { UserAvatar } from '@/components/ui/user-avatar'
import { bn, bnCompact, formatRelative } from '@/lib/format'
import { absoluteUrl } from '@/lib/utils'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'
import { data } from '@/server/data'
import type { ForumAuthor } from '@/server/queries/forum'

export const revalidate = 21600

type Props = { params: Promise<{ id: string; slug?: string[] }> }

export function generateStaticParams() {
  return []
}

const parseId = (v: string) => (/^\d+$/.test(v) ? Number(v) : null)

function AuthorName({ author }: { author: ForumAuthor }) {
  if (author.hidden || !author.username) return <>{author.name}</>
  return (
    <Link
      href={`/members/${author.username}`}
      style={{ color: 'var(--rh-ink)', textDecoration: 'none' }}
    >
      {author.name}
    </Link>
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const n = parseId(id)
  const res = n ? await data.forumThread(n) : null
  if (!res)
    return buildMetadata({ title: 'আলোচনাটি পাওয়া যায়নি', path: `/forum/${id}`, noIndex: true })
  const t = res.thread
  return buildMetadata({
    title: t.title,
    description: t.body.slice(0, 160),
    path: `/forum/${t.id}${t.slug ? `/${t.slug}` : ''}`,
  })
}

export default async function ThreadPage({ params }: Props) {
  const { id, slug } = await params
  const n = parseId(id)
  const res = n ? await data.forumThread(n) : null
  if (!res) notFound()
  const { thread, posts } = res
  const canonical = `/forum/${thread.id}${thread.slug ? `/${thread.slug}` : ''}`
  if (thread.slug && slug?.[0] !== thread.slug) permanentRedirect(canonical)
  const replyCount = posts.filter((p) => !p.removed).length

  return (
    <main id="main">
      <ThreadProvider threadId={thread.id}>
        <section className="section-sm" style={{ paddingTop: 32 }}>
          <div
            className="rh-container"
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
          >
            <Breadcrumbs
              items={[
                { label: 'আলোচনা ফোরাম', href: '/forum' },
                ...(thread.category
                  ? [
                      {
                        label: thread.category.name,
                        href: `/forum?category=${thread.category.slug}`,
                      },
                    ]
                  : []),
              ]}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {thread.category ? <Badge variant="cat">{thread.category.name}</Badge> : null}
              {thread.helpfulPostId ? <Badge variant="reviewed">সহায়ক উত্তর আছে</Badge> : null}
              {thread.locked ? <Badge variant="neutral">উত্তর বন্ধ</Badge> : null}
            </div>
            <h1 className="t-h2">{thread.title}</h1>
            <div className="stat-line">
              <span>{bn(replyCount)}টি উত্তর</span>
              <span>{bnCompact(thread.viewCount)} বার দেখা</span>
              <span>শুরু: {formatRelative(thread.createdAt)}</span>
            </div>

            <article className="card post" aria-labelledby="op-name">
              <div className="post__head">
                <UserAvatar name={thread.author.name} tone={thread.author.tone} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong id="op-name" style={{ display: 'block', lineHeight: 1.4 }}>
                    <AuthorName author={thread.author} />
                  </strong>
                  <span className="t-caption t-muted">
                    মূল পোস্ট · {formatRelative(thread.createdAt)}
                  </span>
                </div>
                <Badge variant="neutral">আলোচনা শুরু করেছেন</Badge>
              </div>
              <div className="post__body">
                {thread.body.split(/\n{2,}/).map((para, i) => (
                  <p key={i} style={{ whiteSpace: 'pre-line' }}>
                    {para}
                  </p>
                ))}
              </div>
              <ThreadActions authorId={thread.authorId} />
            </article>

            {thread.modNote ? (
              <aside className="mod-note" aria-labelledby="mod-h">
                <IconShield
                  className="ic"
                  aria-hidden="true"
                  style={{ color: 'var(--rh-primary)', marginTop: 3 }}
                />
                <div>
                  <span id="mod-h" className="mod-note__label">
                    মডারেটর নোট
                  </span>
                  <p className="t-small" style={{ marginTop: 4 }}>
                    {thread.modNote.text}
                  </p>
                  {thread.modNote.at ? (
                    <span className="t-caption t-muted">
                      মডারেটর টিম · {formatRelative(thread.modNote.at)}
                    </span>
                  ) : null}
                </div>
              </aside>
            ) : null}

            <h2 className="t-h4" style={{ marginTop: 10 }}>
              {bn(replyCount)}টি উত্তর
            </h2>
            {posts.map((p) => (
              <div
                key={p.id}
                id={`post-${p.id}`}
                className={p.parentId ? 'reply-indent' : undefined}
                style={{ scrollMarginTop: 96 }}
              >
                {p.removed ? (
                  <div className="privacy-note">
                    <IconDelete className="ic" aria-hidden="true" />
                    <span>এই মন্তব্যটি আদব নীতিমালা ভঙ্গের কারণে মডারেটর সরিয়েছেন।</span>
                  </div>
                ) : (
                  <article
                    className={`card post${thread.helpfulPostId === p.id ? ' post--helpful' : ''}`}
                  >
                    {thread.helpfulPostId === p.id ? (
                      <Badge variant="reviewed" style={{ marginBottom: 12 }}>
                        <IconSuccess className="ic" aria-hidden="true" />
                        আলোচনা শুরুকারী এটিকে সহায়ক চিহ্নিত করেছেন
                      </Badge>
                    ) : null}
                    <div className="post__head">
                      <UserAvatar name={p.author.name} tone={p.author.tone} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ display: 'block', lineHeight: 1.4 }}>
                          <AuthorName author={p.author} />
                        </strong>
                        <span className="t-caption t-muted">{formatRelative(p.createdAt)}</span>
                      </div>
                      {p.author.scholar ? (
                        <Badge variant="verified">
                          <IconVerified className="ic" aria-hidden="true" />
                          আলিম প্যানেল
                        </Badge>
                      ) : p.author.staff ? (
                        <Badge variant="neutral">টিম Ruhama</Badge>
                      ) : null}
                    </div>
                    <div className="post__body">
                      {(p.body ?? '').split(/\n{2,}/).map((para, i) => (
                        <p key={i} style={{ whiteSpace: 'pre-line' }}>
                          {para}
                        </p>
                      ))}
                      {p.arabic ? (
                        <p
                          className="ar"
                          lang="ar"
                          dir="rtl"
                          style={{ fontSize: '1.5rem', lineHeight: 2 }}
                        >
                          {p.arabic}
                        </p>
                      ) : null}
                      {p.reference ? (
                        <span className="ref-badge" style={{ alignSelf: 'flex-start' }}>
                          {p.reference}
                        </span>
                      ) : null}
                    </div>
                    <PostActions
                      post={{
                        id: p.id,
                        authorId: p.authorId,
                        authorName: p.author.name,
                        helpfulCount: p.helpfulCount,
                      }}
                      threadAuthorId={thread.authorId}
                      helpfulPostId={thread.helpfulPostId}
                    />
                  </article>
                )}
              </div>
            ))}
            <MyPendingPosts />
            <ReplyBox locked={thread.locked} />
          </div>
        </section>
      </ThreadProvider>
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'DiscussionForumPosting',
            headline: thread.title,
            text: thread.body.slice(0, 500),
            url: absoluteUrl(canonical),
            datePublished: thread.createdAt,
            author: { '@type': 'Person', name: thread.author.name },
            interactionStatistic: {
              '@type': 'InteractionCounter',
              interactionType: 'https://schema.org/CommentAction',
              userInteractionCount: replyCount,
            },
            inLanguage: 'bn',
          },
          breadcrumbLd([
            { name: 'আলোচনা ফোরাম', path: '/forum' },
            { name: thread.title, path: canonical },
          ]),
        ]}
      />
    </main>
  )
}
