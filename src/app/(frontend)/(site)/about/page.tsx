import { Ban, BookOpen, Heart, Megaphone, Scale, UserX } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { TableOfContents } from '@/components/content/article-aids'
import { PersonAvatar, personHref } from '@/components/content/cards'
import { RichText } from '@/components/content/rich-text'
import { BrandMark } from '@/components/icons/brand-mark'
import { JsonLd } from '@/components/seo/json-ld'
import { ButtonLink } from '@/components/ui/button'
import { Breadcrumbs, IconTile, MetaDot } from '@/components/ui/primitives'
import { bn, readingTimeLabel } from '@/lib/format'
import { extractHeadings, headingId, type LexicalState } from '@/lib/lexical'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'
import { data } from '@/server/data'
import { getAboutPage } from '@/server/queries/globals'

export const revalidate = 86400

/** Stable anchors for sections other pages link to (footer: /about#manifesto). */
const ANCHORS: Record<string, string> = {
  আমরাকারা: 'who',
  আমাদেরভিত্তি: 'foundation',
  বিভক্তিনিয়েকুরআনেরসতর্কবাণী: 'warnings',
  আমাদেরঅঙ্গীকার: 'manifesto',
}
const anchorFor = (index: number, text: string) =>
  ANCHORS[text.replace(/\s+/g, '')] ?? headingId(index)

const RULE_ICONS = {
  book: BookOpen,
  heart: Heart,
  scale: Scale,
  ban: Ban,
  megaphone: Megaphone,
  user: UserX,
} as const

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutPage()
  return buildMetadata({
    title: about.title || 'আমাদের পরিচয়',
    description: about.lead,
    path: '/about',
  })
}

export default async function AboutPage() {
  const [about, shura] = await Promise.all([getAboutPage(), data.shura()])
  const headings = [
    ...extractHeadings(about.manifesto as LexicalState, anchorFor).filter((h) => h.level === 2),
    { id: 'shura', text: 'শূরা', level: 2 as const },
    { id: 'adab', text: 'আদব ও ইনসাফ নীতি', level: 2 as const },
  ]
  const rules = about.adabRules ?? []

  return (
    <main id="main">
      <section className="page-hero" aria-labelledby="about-title">
        <div className="rh-pattern" aria-hidden="true" />
        <div
          className="rh-container-narrow"
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Breadcrumbs
            items={[{ label: 'হোম', href: '/' }, { label: 'আমাদের পরিচয়' }]}
            style={{ justifyContent: 'center' }}
          />
          <BrandMark
            className="rh-in"
            style={{ width: 56, height: 56, color: 'var(--rh-accent)', marginTop: 24 }}
          />
          <h1 id="about-title" className="t-display rh-in d1" style={{ marginTop: 20 }}>
            {about.title}
          </h1>
          <p className="lead rh-in d2">{about.lead}</p>
          <div className="stat-line rh-in d3" style={{ justifyContent: 'center', marginTop: 20 }}>
            {about.version ? <span>সংস্করণ {bn(about.version)}</span> : null}
            {about.version && about.publishedLabel ? <MetaDot /> : null}
            {about.publishedLabel ? <span>প্রকাশ: {about.publishedLabel}</span> : null}
            {about.readingTime ? (
              <>
                <MetaDot />
                <span>{readingTimeLabel(about.readingTime)}</span>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 64 }}>
        <div className="rh-container">
          <div className="layout-side">
            <aside className="layout-side__aside sticky-col" aria-label="সূচিপত্র">
              <TableOfContents headings={headings} title="এই পৃষ্ঠায়" />
              <div
                className="card card-pad"
                style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 20 }}
              >
                <p className="t-small" style={{ fontWeight: 600 }}>
                  ঘোষণাপত্রের সাথে একমত?
                </p>
                <p className="t-small t-muted">
                  পড়ে ভালো লাগলে নিজের নাম যুক্ত করুন অথবা পরিচিতদের সাথে শেয়ার করুন।
                </p>
                <ButtonLink href="/join" size="sm">
                  যুক্ত হোন
                </ButtonLink>
              </div>
            </aside>

            <article className="layout-side__main">
              <RichText data={about.manifesto} headingIdFor={anchorFor} className="prose-first" />

              <section
                id="shura"
                aria-labelledby="shura-title"
                style={{ marginTop: 72, scrollMarginTop: 100 }}
              >
                <h2 id="shura-title" className="t-h3">
                  শূরা
                </h2>
                <p className="t-muted" style={{ marginTop: 10, maxWidth: '70ch' }}>
                  {about.shuraIntro}
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))',
                    gap: 14,
                    marginTop: 28,
                  }}
                >
                  {shura.map((m) => (
                    <Link
                      key={m.id}
                      href={personHref({ slug: m.slug ?? '', kinds: (m.kinds ?? []) as string[] })}
                      className="card card-hover"
                      style={{
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14,
                        textDecoration: 'none',
                        color: 'var(--rh-ink)',
                      }}
                    >
                      <PersonAvatar
                        person={{ name: m.name, tone: m.avatarTone === 'gold' ? 'gold' : 'teal' }}
                        size="lg"
                      />
                      <div>
                        <strong style={{ display: 'block', lineHeight: 1.5 }}>{m.name}</strong>
                        <span className="t-small t-muted">{m.shuraRole}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              <section
                id="adab"
                aria-labelledby="adab-title"
                style={{ marginTop: 72, scrollMarginTop: 100 }}
              >
                <h2 id="adab-title" className="t-h3">
                  আদব ও ইনসাফ নীতি
                </h2>
                <p className="t-muted" style={{ marginTop: 10, maxWidth: '70ch' }}>
                  {about.adabIntro}{' '}
                  <Link href="/adab" className="link">
                    পূর্ণ নীতিমালা পড়ুন
                  </Link>
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
                    gap: 16,
                    marginTop: 28,
                  }}
                >
                  {rules.map((r, i) => {
                    const Icon =
                      RULE_ICONS[(r.icon ?? 'book') as keyof typeof RULE_ICONS] ?? BookOpen
                    return (
                      <div
                        key={r.id ?? i}
                        className="card card-pad"
                        style={{ display: 'flex', gap: 14, padding: 22 }}
                      >
                        <IconTile teal={r.tone !== 'gold'} size={40}>
                          <Icon className="ic" aria-hidden="true" />
                        </IconTile>
                        <div>
                          <strong>{r.title}</strong>
                          <p className="t-small t-muted" style={{ marginTop: 4 }}>
                            {r.text}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </article>
          </div>
        </div>
      </section>

      <section className="section-sm" style={{ paddingBottom: 104 }} aria-labelledby="about-cta">
        <div className="rh-container">
          <div className="cta-band">
            <div className="rh-pattern" aria-hidden="true" />
            <BrandMark style={{ width: 44, height: 44, color: '#D4A95C', strokeWidth: 2 }} />
            <h2 id="about-cta" className="t-h2">
              {about.ctaTitle}
            </h2>
            <p>{about.ctaText}</p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                justifyContent: 'center',
                marginTop: 8,
              }}
            >
              <ButtonLink href="/join" variant="gold" size="lg">
                যুক্ত হোন
              </ButtonLink>
              <ButtonLink href="/ilm" variant="onBand" size="lg">
                ইলম কেন্দ্র দেখুন
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
      <JsonLd
        data={breadcrumbLd([
          { name: 'হোম', path: '/' },
          { name: 'আমাদের পরিচয়', path: '/about' },
        ])}
      />
    </main>
  )
}
