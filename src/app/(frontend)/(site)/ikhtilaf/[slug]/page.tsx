import { CircleCheck, Clock, Columns2, HeartHandshake, Info, Users } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BookmarkButton } from '@/components/actions/bookmark-button'
import { ShareButton } from '@/components/actions/share-button'
import { PersonRow, personHref } from '@/components/content/cards'
import { IkhtilafRow, OPINION_ORDINALS } from '@/components/content/ikhtilaf'
import { OpinionLayout } from '@/components/content/opinion-layout'
import {
  AyahCard,
  DalilBox,
  DalilTag,
  HadithCard,
  type DalilItem,
} from '@/components/content/scripture'
import { PreviewBar } from '@/components/preview/preview-bar'
import { JsonLd } from '@/components/seo/json-ld'
import { Badge, LevelBadge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/ui/primitives'
import { bn, readingTimeLabel } from '@/lib/format'
import { articleLd, breadcrumbLd, buildMetadata } from '@/lib/seo'
import { data } from '@/server/data'
import { getPayloadClient } from '@/server/payload'
import { previewUser } from '@/server/preview'
import { getIkhtilaf, toCategory, toPerson } from '@/server/queries/articles'
import { toIkhtilafCard } from '@/server/queries/mappers'

export const revalidate = 86400

type Props = { params: Promise<{ slug: string }> }

type Evidence = {
  kind?: 'hadith' | 'ayah' | null
  arabic?: string | null
  text?: string | null
  narrator?: string | null
  source?: string | null
  grade?: string | null
  gradeNote?: string | null
}
type Opinion = {
  id?: string
  title: string
  holders: string
  evidence?: Evidence | null
  understanding?: string | null
  citations?: string[] | null
}

export async function generateStaticParams() {
  try {
    const list = await data.ikhtilafList(20)
    return list.docs.map((t) => ({ slug: t.slug }))
  } catch {
    return []
  }
}

async function load(slug: string) {
  const user = await previewUser()
  if (user)
    return {
      doc: await getIkhtilaf(await getPayloadClient(), slug, { draft: true, user }),
      preview: true,
    }
  return { doc: await data.ikhtilaf(slug), preview: false }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const doc = await data.ikhtilaf(slug)
  if (!doc)
    return buildMetadata({
      title: 'বিষয়টি পাওয়া যায়নি',
      path: `/ikhtilaf/${slug}`,
      noIndex: true,
    })
  return buildMetadata({
    title: doc.meta?.title || doc.title,
    description: doc.meta?.description || doc.lead,
    path: `/ikhtilaf/${slug}`,
    type: 'article',
    publishedTime: doc.publishedAt,
    modifiedTime: doc.updatedAt,
  })
}

export default async function IkhtilafTopicPage({ params }: Props) {
  const { slug } = await params
  const { doc, preview } = await load(slug)
  if (!doc) notFound()

  const category = toCategory(doc.category)
  const opinions = (doc.opinions ?? []) as Opinion[]
  const consensus = (doc.consensus ?? []).map((c) => c.point).filter(Boolean)
  const conduct = (doc.conduct ?? []).map((c) => c.point).filter(Boolean)
  const references = ((doc.references ?? []) as DalilItem[]).filter((r) => r.citation)
  const reviewers = ((doc.reviewedBy ?? []) as unknown[]).map(toPerson).filter((p) => p !== null)
  const manualRelated = ((doc.relatedTopics ?? []) as unknown[])
    .filter((t) => t && typeof t === 'object')
    .map((t) => toIkhtilafCard(t as never))
  const related = manualRelated.length
    ? manualRelated
    : (await data.ikhtilafList(4)).docs.filter((t) => t.id !== doc.id).slice(0, 3)
  const path = `/ikhtilaf/${doc.slug}`
  const countWord = opinions.length === 2 ? 'দুটি' : `${bn(opinions.length)}টি`

  return (
    <>
      {preview ? <PreviewBar /> : null}
      <main id="main">
        <header className="page-hero">
          <div className="rh-pattern" aria-hidden="true" />
          <div className="rh-container">
            <Breadcrumbs
              items={[
                { label: 'হোম', href: '/' },
                { label: 'মতপার্থক্যের বিষয়', href: '/ikhtilaf' },
              ]}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
              <Badge variant="live">
                <Columns2 className="ic" aria-hidden="true" />
                মতপার্থক্যের বিষয়
              </Badge>
              {category ? (
                <Badge variant="cat">
                  {[category.name, doc.subTopic].filter(Boolean).join(' · ')}
                </Badge>
              ) : null}
              <LevelBadge level={doc.level} />
              {doc._status !== 'published' ? <Badge>খসড়া</Badge> : null}
            </div>
            <h1 className="t-h1" style={{ marginTop: 16 }}>
              {doc.title}
            </h1>
            <p className="lead">{doc.lead}</p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                marginTop: 20,
              }}
            >
              <div className="stat-line">
                <span>
                  <Clock className="ic" aria-hidden="true" />
                  {readingTimeLabel(doc.readingTime ?? 5)}
                </span>
                {doc.reviewNote ? (
                  <span>
                    <Users className="ic" aria-hidden="true" />
                    {doc.reviewNote}
                  </span>
                ) : null}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <BookmarkButton
                  target={{ collection: 'ikhtilaf-topics', id: doc.id }}
                  variant="outline"
                />
                <ShareButton title={doc.title} path={path} variant="outline" />
              </div>
            </div>
          </div>
        </header>

        <section className="section" style={{ paddingTop: 56 }}>
          <div
            className="rh-container"
            style={{ display: 'flex', flexDirection: 'column', gap: 32 }}
          >
            {doc.readFirst ? (
              <div className="adab-strip" role="note">
                <Info
                  className="ic"
                  aria-hidden="true"
                  style={{ color: 'var(--rh-primary)', marginTop: 3 }}
                />
                <div>
                  <strong>পড়ার আগে</strong>
                  <p className="t-small t-muted" style={{ marginTop: 4 }}>
                    {doc.readFirst}
                  </p>
                </div>
              </div>
            ) : null}

            {consensus.length ? (
              <div className="card card-pad">
                <h2 className="t-h4" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CircleCheck
                    className="ic"
                    aria-hidden="true"
                    style={{ color: 'var(--rh-primary)' }}
                  />
                  যেখানে সবাই একমত
                </h2>
                <ul
                  style={{
                    margin: '14px 0 0',
                    paddingLeft: '1.3em',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {consensus.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <OpinionLayout title={`${countWord} মত, পাশাপাশি`} count={opinions.length}>
              {opinions.map((o, i) => (
                <article
                  key={o.id ?? i}
                  className="card"
                  aria-labelledby={`op${i + 1}`}
                  style={{ display: 'flex', flexDirection: 'column' }}
                >
                  <div
                    style={{
                      padding: '24px 26px',
                      borderBottom: '1px solid var(--rh-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <span className="ikh-col__label">
                      <span>{bn(i + 1)}</span>
                      {OPINION_ORDINALS[i] ?? `${bn(i + 1)} নম্বর মত`}
                    </span>
                    <h3 id={`op${i + 1}`} className="t-h4">
                      {o.title}
                    </h3>
                    <p className="t-small t-muted">
                      {o.holders.startsWith('যাঁরা')
                        ? o.holders
                        : `যাঁরা এই মত পোষণ করেন: ${o.holders}`}
                    </p>
                  </div>
                  <div
                    style={{
                      padding: '24px 26px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 18,
                      flex: 1,
                    }}
                  >
                    {o.evidence?.text ? (
                      o.evidence.kind === 'ayah' ? (
                        <AyahCard
                          compact
                          arabic={o.evidence.arabic}
                          translation={o.evidence.text}
                          reference={o.evidence.source ?? ''}
                          style={{ padding: 22, background: 'var(--rh-bg)' }}
                        />
                      ) : (
                        <HadithCard
                          showQuote={false}
                          arabic={o.evidence.arabic}
                          text={o.evidence.text}
                          narrator={o.evidence.narrator}
                          source={o.evidence.source}
                          grade={o.evidence.grade}
                          gradeNote={o.evidence.gradeNote}
                          style={{ padding: 22, background: 'var(--rh-bg)' }}
                          arabicStyle={{ fontSize: '1.375rem' }}
                          textStyle={{ fontSize: 16, lineHeight: 1.8 }}
                        />
                      )
                    ) : null}
                    {o.understanding ? (
                      <div>
                        <h4
                          style={{
                            fontFamily: 'var(--rh-font-body)',
                            fontSize: 15,
                            fontWeight: 600,
                          }}
                        >
                          এই মতের অনুসারীরা অন্য দলিলগুলো যেভাবে বোঝেন
                        </h4>
                        <p className="t-small t-muted" style={{ marginTop: 6 }}>
                          {o.understanding}
                        </p>
                      </div>
                    ) : null}
                    {o.citations?.length ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto' }}>
                        {o.citations.map((c) => (
                          <DalilTag key={c}>{c}</DalilTag>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </OpinionLayout>

            {conduct.length ? (
              <section
                className="pattern-host"
                aria-labelledby="conduct-title"
                style={{
                  borderRadius: 'var(--rh-radius-xl)',
                  background: 'var(--rh-band-bg)',
                  color: 'var(--rh-band-ink)',
                  padding: '40px 36px',
                }}
              >
                <div
                  className="rh-pattern"
                  aria-hidden="true"
                  style={{ backgroundColor: '#F3E9D6', opacity: 0.07 }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <HeartHandshake
                    className="ic ic-lg"
                    aria-hidden="true"
                    style={{ color: 'var(--rh-accent)' }}
                  />
                  <h2 id="conduct-title" className="t-h3" style={{ color: 'var(--rh-band-ink)' }}>
                    এই মতভেদে আমাদের আচরণ
                  </h2>
                </div>
                <ul
                  className="list-reset"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
                    gap: '16px 32px',
                    marginTop: 24,
                  }}
                >
                  {conduct.map((p) => (
                    <li key={p} style={{ display: 'flex', gap: 12 }}>
                      <CircleCheck
                        className="ic"
                        aria-hidden="true"
                        style={{ color: 'var(--rh-accent)', flex: 'none', marginTop: 4 }}
                      />
                      <span style={{ color: 'var(--rh-band-ink)' }}>{p}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <DalilBox id="ikh-dalil" title="পূর্ণ তথ্যসূত্র" items={references} />

            {reviewers.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px 32px' }}>
                {reviewers.map((r) => (
                  <PersonRow key={r.id} person={r} caption="রিভিউ করেছেন" href={personHref(r)} />
                ))}
              </div>
            ) : null}

            {related.length ? (
              <div>
                <h2 className="t-h4" style={{ marginBottom: 8 }}>
                  আরও মতপার্থক্যের বিষয়
                </h2>
                <ul className="list-reset">
                  {related.map((t) => (
                    <IkhtilafRow key={t.id} topic={t} />
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      </main>
      <JsonLd
        data={[
          articleLd({
            title: doc.title,
            description: doc.lead,
            path,
            author: { name: 'Ruhama ইলমি রিভিউ বোর্ড', path: '/about' },
            reviewers: reviewers.map((r) => ({ name: r.name })),
            publishedAt: doc.publishedAt,
            updatedAt: doc.updatedAt,
            section: category?.name,
          }),
          breadcrumbLd([
            { name: 'হোম', path: '/' },
            { name: 'মতপার্থক্যের বিষয়', path: '/ikhtilaf' },
            { name: doc.title, path },
          ]),
        ]}
      />
    </>
  )
}
