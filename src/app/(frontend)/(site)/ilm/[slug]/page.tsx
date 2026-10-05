import { HeartHandshake } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { BookmarkButton } from '@/components/actions/bookmark-button'
import { ShareButton } from '@/components/actions/share-button'
import { ReadingProgress, TableOfContents } from '@/components/content/article-aids'
import { ArticleCard, PersonAvatar, PersonRow, personHref } from '@/components/content/cards'
import { RichText } from '@/components/content/rich-text'
import { DalilBox, type DalilItem } from '@/components/content/scripture'
import { PreviewBar } from '@/components/preview/preview-bar'
import { JsonLd } from '@/components/seo/json-ld'
import { Badge, LevelBadge, ReviewedBadge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { Breadcrumbs } from '@/components/ui/primitives'
import { bn, formatDate, readingTimeLabel } from '@/lib/format'
import { extractHeadings, type LexicalState } from '@/lib/lexical'
import { articleLd, breadcrumbLd, buildMetadata } from '@/lib/seo'
import { data } from '@/server/data'
import { getPayloadClient } from '@/server/payload'
import { previewUser } from '@/server/preview'
import { getArticle, toCategory, toPerson } from '@/server/queries/articles'

export const revalidate = 86400

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  try {
    const recent = await data.articles({ limit: 24 })
    return recent.docs.map((a) => ({ slug: a.slug }))
  } catch {
    // the database may be unreachable during some builds; pages then render on first request
    return []
  }
}

async function load(slug: string) {
  const user = await previewUser()
  if (user)
    return {
      doc: await getArticle(await getPayloadClient(), slug, { draft: true, user }),
      preview: true,
    }
  return { doc: await data.article(slug), preview: false }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const doc = await data.article(slug)
  if (!doc)
    return buildMetadata({ title: 'প্রবন্ধ পাওয়া যায়নি', path: `/ilm/${slug}`, noIndex: true })
  const author = toPerson(doc.author)
  return buildMetadata({
    title: doc.meta?.title || doc.title,
    description: doc.meta?.description || doc.excerpt,
    path: `/ilm/${slug}`,
    type: 'article',
    publishedTime: doc.publishedAt,
    modifiedTime: doc.updatedAt,
    authors: author ? [author.name] : undefined,
  })
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const { doc, preview } = await load(slug)
  if (!doc) notFound()

  const category = toCategory(doc.category)
  const author = toPerson(doc.author)
  const reviewers = ((doc.reviewedBy ?? []) as unknown[]).map(toPerson).filter((p) => p !== null)
  const headings = extractHeadings(doc.content as LexicalState)
  const references = ((doc.references ?? []) as DalilItem[]).filter((r) => r.citation)
  const tags = ((doc.tags ?? []) as unknown[]).filter(
    (t): t is { id: number; name: string; slug: string } => Boolean(t && typeof t === 'object'),
  )
  const series = doc.series && typeof doc.series === 'object' ? doc.series : null
  const related = await data.relatedArticles(
    doc.id,
    category ? Number(category.id) : null,
    ((doc.relatedArticles ?? []) as unknown[])
      .map((r) => (r && typeof r === 'object' ? (r as { id: number }).id : (r as number)))
      .filter(Boolean),
  )
  const authorDoc = doc.author && typeof doc.author === 'object' ? doc.author : null
  const path = `/ilm/${doc.slug}`
  const crumbs = [
    { label: 'হোম', href: '/' },
    { label: 'ইলম কেন্দ্র', href: '/ilm' },
    ...(category ? [{ label: category.name, href: `/ilm?category=${category.slug}` }] : []),
  ]

  return (
    <>
      {preview ? <PreviewBar /> : null}
      <ReadingProgress targetId="rh-article" />
      <main id="main">
        <header className="page-hero" style={{ paddingBottom: 40 }}>
          <div className="rh-pattern" aria-hidden="true" />
          <div className="rh-container-narrow">
            <Breadcrumbs items={crumbs} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
              {category ? <Badge variant="cat">{category.name}</Badge> : null}
              <LevelBadge level={doc.level} />
              {doc._status === 'published' ? <ReviewedBadge /> : <Badge>খসড়া</Badge>}
              {series ? (
                <Badge>
                  ধারাবাহিক: {series.title}
                  {doc.seriesOrder ? ` · পর্ব ${bn(doc.seriesOrder)}` : ''}
                </Badge>
              ) : null}
            </div>
            <h1 className="t-h1" style={{ marginTop: 16 }}>
              {doc.title}
            </h1>
            <p className="lead">{doc.excerpt}</p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                marginTop: 28,
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px 32px' }}>
                {author ? (
                  <PersonRow person={author} caption="লিখেছেন" href={personHref(author)} />
                ) : null}
                {reviewers.slice(0, 2).map((r) => (
                  <PersonRow key={r.id} person={r} caption="রিভিউ করেছেন" href={personHref(r)} />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="t-small t-muted" style={{ marginRight: 10 }}>
                  {doc.publishedAt ? `${formatDate(doc.publishedAt)} · ` : ''}
                  {readingTimeLabel(doc.readingTime ?? 5)}
                </span>
                <BookmarkButton target={{ collection: 'articles', id: doc.id }} variant="outline" />
                <ShareButton title={doc.title} path={path} variant="outline" />
              </div>
            </div>
          </div>
        </header>

        <section className="section" style={{ paddingTop: 56 }}>
          <div className="rh-container">
            <div className="layout-side" style={{ justifyContent: 'center' }}>
              {headings.length > 1 ? (
                <aside
                  className="layout-side__aside sticky-col"
                  aria-label="সূচিপত্র"
                  style={{ maxWidth: 260 }}
                >
                  <TableOfContents headings={headings} />
                </aside>
              ) : null}

              <article className="layout-side__main" id="rh-article" style={{ maxWidth: 760 }}>
                <RichText data={doc.content} className="prose-first" />
                {references.length ? (
                  <div className="prose">
                    <DalilBox id="art-dalil" items={references} />
                  </div>
                ) : null}

                {tags.length || category ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 40 }}>
                    <span
                      className="t-small t-muted"
                      style={{ marginRight: 4, alignSelf: 'center' }}
                    >
                      বিষয়:
                    </span>
                    {category ? (
                      <Link
                        href={`/ilm?category=${category.slug}`}
                        className="chip"
                        style={{ minHeight: 36, textDecoration: 'none' }}
                      >
                        {category.name}
                      </Link>
                    ) : null}
                    {tags.map((t) => (
                      <Link
                        key={t.id}
                        href={`/search?q=${encodeURIComponent(t.name)}`}
                        className="chip"
                        style={{ minHeight: 36, textDecoration: 'none' }}
                      >
                        {t.name}
                      </Link>
                    ))}
                  </div>
                ) : null}

                {author ? (
                  <div
                    className="card card-pad"
                    style={{
                      marginTop: 32,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
                      gap: 24,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 14 }}>
                      <PersonAvatar person={author} size="lg" />
                      <div>
                        <span className="t-caption t-muted">লেখক</span>
                        <Link
                          href={personHref(author)}
                          style={{
                            display: 'block',
                            lineHeight: 1.5,
                            fontWeight: 700,
                            color: 'var(--rh-ink)',
                            textDecoration: 'none',
                          }}
                        >
                          {author.name}
                        </Link>
                        {authorDoc?.specialty || authorDoc?.bio ? (
                          <p className="t-small t-muted clamp-3" style={{ marginTop: 4 }}>
                            {authorDoc.specialty || authorDoc.bio}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {reviewers.map((r) => {
                      const raw = ((doc.reviewedBy ?? []) as unknown[]).find(
                        (x) => x && typeof x === 'object' && (x as { id: number }).id === r.id,
                      ) as { specialty?: string | null } | undefined
                      return (
                        <div key={r.id} style={{ display: 'flex', gap: 14 }}>
                          <PersonAvatar person={r} size="lg" />
                          <div>
                            <span className="t-caption t-muted">রিভিউয়ার</span>
                            <Link
                              href={personHref(r)}
                              style={{
                                display: 'block',
                                lineHeight: 1.5,
                                fontWeight: 700,
                                color: 'var(--rh-ink)',
                                textDecoration: 'none',
                              }}
                            >
                              {r.name}
                            </Link>
                            <p className="t-small t-muted" style={{ marginTop: 4 }}>
                              {raw?.specialty ? `${raw.specialty}। ` : ''}প্রতিটি দলিলের উৎস ও মান
                              যাচাই করেছেন।
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : null}

                <div
                  className="adab-strip"
                  style={{ marginTop: 20, alignItems: 'center', flexWrap: 'wrap' }}
                >
                  <HeartHandshake
                    className="ic"
                    aria-hidden="true"
                    style={{ color: 'var(--rh-primary)' }}
                  />
                  <p className="t-small" style={{ flex: '1 1 240px' }}>
                    এই লেখা নিয়ে কোনো প্রশ্ন বা দ্বিমত আছে? আদবের সাথে জানান।
                  </p>
                  <ButtonLink href="/qa#ask" variant="secondary" size="sm">
                    প্রশ্ন করুন
                  </ButtonLink>
                </div>
              </article>
            </div>
          </div>
        </section>

        {related.length ? (
          <section
            className="section section-alt"
            aria-labelledby="related-title"
            style={{ paddingBlock: 80 }}
          >
            <div className="rh-container">
              <h2 id="related-title" className="t-h3" style={{ marginBottom: 28 }}>
                সম্পর্কিত প্রবন্ধ
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
                  gap: 20,
                }}
              >
                {related.map((a) => (
                  <ArticleCard key={a.id} article={a} compact />
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <JsonLd
        data={[
          articleLd({
            title: doc.title,
            description: doc.excerpt,
            path,
            author: { name: author?.name ?? 'Ruhama', path: author ? personHref(author) : null },
            reviewers: reviewers.map((r) => ({ name: r.name })),
            publishedAt: doc.publishedAt,
            updatedAt: doc.updatedAt,
            section: category?.name,
          }),
          breadcrumbLd([
            ...crumbs.map((c) => ({ name: c.label, path: c.href })),
            { name: doc.title, path },
          ]),
        ]}
      />
    </>
  )
}
