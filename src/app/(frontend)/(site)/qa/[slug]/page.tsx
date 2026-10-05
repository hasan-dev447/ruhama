import { ChevronRight, Info, MessageCircleQuestion } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { BookmarkButton } from '@/components/actions/bookmark-button'
import { ShareButton } from '@/components/actions/share-button'
import { PersonRow, personHref } from '@/components/content/cards'
import { RichText } from '@/components/content/rich-text'
import { DalilBox, type DalilItem } from '@/components/content/scripture'
import { PreviewBar } from '@/components/preview/preview-bar'
import { AnswerFeedback } from '@/components/qa/answer-feedback'
import { JsonLd } from '@/components/seo/json-ld'
import { Badge, ReviewedBadge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/ui/primitives'
import { districtLabel } from '@/lib/districts'
import { formatDate } from '@/lib/format'
import { lexicalToPlainText, type LexicalState } from '@/lib/lexical'
import { breadcrumbLd, buildMetadata, qaPageLd } from '@/lib/seo'
import { data } from '@/server/data'
import { getPayloadClient } from '@/server/payload'
import { previewUser } from '@/server/preview'
import { toCategory, toPerson } from '@/server/queries/articles'
import { getQuestion } from '@/server/queries/learning'

export const revalidate = 86400

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  try {
    const recent = await data.questions({ limit: 20 })
    return recent.docs.map((q) => ({ slug: q.slug }))
  } catch {
    return []
  }
}

async function load(slug: string) {
  const user = await previewUser()
  if (user)
    return {
      doc: await getQuestion(await getPayloadClient(), slug, { draft: true, user }),
      preview: true,
    }
  return { doc: await data.question(slug), preview: false }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const doc = await data.question(slug)
  if (!doc)
    return buildMetadata({ title: 'প্রশ্নটি পাওয়া যায়নি', path: `/qa/${slug}`, noIndex: true })
  return buildMetadata({
    title: doc.meta?.title || doc.title,
    description: doc.meta?.description || doc.answerExcerpt || doc.body || doc.title,
    path: `/qa/${slug}`,
    type: 'article',
    publishedTime: doc.publishedAt,
    modifiedTime: doc.updatedAt,
  })
}

export default async function QuestionPage({ params }: Props) {
  const { slug } = await params
  const { doc, preview } = await load(slug)
  if (!doc) notFound()

  const category = toCategory(doc.category)
  const answeredBy = toPerson(doc.answeredBy)
  const reviewers = ((doc.reviewedBy ?? []) as unknown[])
    .map(toPerson)
    .filter((p): p is NonNullable<typeof p> => p !== null && p.id !== answeredBy?.id)
  const references = ((doc.references ?? []) as DalilItem[]).filter((r) => r.citation)
  const manualRelated = ((doc.relatedQuestions ?? []) as unknown[]).filter(
    (q): q is { id: number; title: string; slug: string } => Boolean(q && typeof q === 'object'),
  )
  const related = manualRelated.length
    ? manualRelated.slice(0, 3)
    : (await data.questions({ category: category?.slug ?? null, limit: 4 })).docs
        .filter((q) => q.id !== doc.id)
        .slice(0, 3)
  const path = `/qa/${doc.slug}`
  const asker = [
    doc.askerName ?? 'নাম প্রকাশে অনিচ্ছুক',
    doc.askerDistrict ? districtLabel(doc.askerDistrict) : null,
  ]
    .filter(Boolean)
    .join(' · ')
  const answerText = lexicalToPlainText(doc.answer as LexicalState)

  return (
    <>
      {preview ? <PreviewBar /> : null}
      <main id="main">
        <section className="section-sm" style={{ paddingTop: 40 }}>
          <div
            className="rh-container-narrow"
            style={{ display: 'flex', flexDirection: 'column', gap: 28 }}
          >
            <Breadcrumbs
              items={[
                { label: 'হোম', href: '/' },
                { label: 'প্রশ্নোত্তর', href: '/qa' },
                ...(category
                  ? [{ label: category.name, href: `/qa?category=${category.slug}` }]
                  : []),
              ]}
            />

            <section
              className="card card-pad pattern-host"
              aria-labelledby="q-title"
              style={{ background: 'var(--rh-sage)', borderColor: 'transparent' }}
            >
              <div className="rh-pattern" aria-hidden="true" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <Badge style={{ background: 'var(--rh-surface)' }}>প্রশ্ন</Badge>
                {category ? (
                  <Badge variant="cat">
                    {[category.name, doc.subTopic].filter(Boolean).join(' · ')}
                  </Badge>
                ) : null}
                {doc._status !== 'published' ? <Badge>খসড়া</Badge> : null}
                <span className="t-caption t-muted" style={{ marginLeft: 'auto' }}>
                  প্রশ্নকারী: {asker}
                </span>
              </div>
              <h1 id="q-title" className="t-h2" style={{ marginTop: 16 }}>
                {doc.title}
              </h1>
              {doc.body ? (
                <p className="t-muted" style={{ marginTop: 12, whiteSpace: 'pre-line' }}>
                  {doc.body}
                </p>
              ) : null}
            </section>

            <article
              aria-labelledby="a-title"
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  paddingBottom: 20,
                  borderBottom: '1px solid var(--rh-border)',
                }}
              >
                <h2 id="a-title" className="t-h3">
                  উত্তর
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                  {answeredBy ? (
                    <PersonRow
                      person={answeredBy}
                      caption="উত্তর দিয়েছেন"
                      href={personHref(answeredBy)}
                    />
                  ) : null}
                  {reviewers.slice(0, 2).map((r) => (
                    <PersonRow key={r.id} person={r} caption="রিভিউ করেছেন" href={personHref(r)} />
                  ))}
                  {doc._status === 'published' ? (
                    <ReviewedBadge style={{ alignSelf: 'center' }} />
                  ) : null}
                </div>
              </div>
              {doc.answer ? (
                <RichText data={doc.answer} className="prose-first" />
              ) : (
                <p className="t-muted">উত্তর এখনো লেখা হয়নি।</p>
              )}
              <DalilBox id="qa-dalil" items={references} />
              <div
                className="t-caption t-muted"
                style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}
              >
                <Info
                  className="ic ic-sm"
                  aria-hidden="true"
                  style={{ flex: 'none', marginTop: 3 }}
                />
                <span>
                  এই উত্তর সাধারণ দিকনির্দেশনা। ব্যক্তিগত বিশেষ পরিস্থিতিতে স্থানীয় আলিমের পরামর্শ
                  নিন।
                  {doc.publishedAt ? ` প্রকাশ: ${formatDate(doc.publishedAt)}` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <BookmarkButton target={{ collection: 'questions', id: doc.id }} variant="ghost" />
                <ShareButton title={doc.title} path={path} variant="ghost" label="শেয়ার" />
              </div>
              {doc._status === 'published' ? <AnswerFeedback questionId={doc.id} /> : null}
            </article>

            {related.length ? (
              <section aria-labelledby="rel-q" style={{ marginTop: 12 }}>
                <h2 id="rel-q" className="t-h4" style={{ marginBottom: 6 }}>
                  সম্পর্কিত প্রশ্ন
                </h2>
                <ul className="list-reset">
                  {related.map((q) => (
                    <li key={q.id}>
                      <Link href={`/qa/${q.slug}`} className="row-link">
                        <MessageCircleQuestion
                          className="ic"
                          aria-hidden="true"
                          style={{ color: 'var(--rh-primary)' }}
                        />
                        <span className="row-link__title" style={{ flex: 1 }}>
                          {q.title}
                        </span>
                        <ChevronRight
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
        </section>
      </main>
      {doc._status === 'published' && answerText ? (
        <JsonLd
          data={[
            qaPageLd({
              question: doc.title,
              body: doc.body,
              answer: answerText.slice(0, 5000),
              path,
              answeredBy: answeredBy?.name,
              publishedAt: doc.publishedAt,
              upvotes: doc.helpfulYes ?? 0,
            }),
            breadcrumbLd([
              { name: 'হোম', path: '/' },
              { name: 'প্রশ্নোত্তর', path: '/qa' },
              { name: doc.title, path },
            ]),
          ]}
        />
      ) : null}
    </>
  )
}
