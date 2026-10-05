import {
  BookOpen,
  Check,
  CircleCheck,
  Handshake,
  MessageCircleMore,
  Search,
  Users,
} from 'lucide-react'
import type { Metadata } from 'next'

import { BookmarkButton } from '@/components/actions/bookmark-button'
import { ShareButton } from '@/components/actions/share-button'
import { ArticleCard, CategoryTile, EventRow, ValueCard } from '@/components/content/cards'
import { IkhtilafPreviewCard } from '@/components/content/ikhtilaf'
import { AyahCard, HadithCard } from '@/components/content/scripture'
import { Journey } from '@/components/home/journey'
import { BrandMark } from '@/components/icons/brand-mark'
import { RefBadge } from '@/components/ui/badge'
import { ButtonLink, LinkArrow } from '@/components/ui/button'
import { SectionHead, SplitHead } from '@/components/ui/primitives'
import { bn, formatLongDate } from '@/lib/format'
import { buildMetadata } from '@/lib/seo'
import { data } from '@/server/data'
import { getHomePage } from '@/server/queries/globals'

export const revalidate = 86400

export const metadata: Metadata = buildMetadata({ path: '/' })

const VALUE_ICONS = {
  handshake: <Handshake className="ic ic-lg" aria-hidden="true" />,
  book: <BookOpen className="ic ic-lg" aria-hidden="true" />,
  message: <MessageCircleMore className="ic ic-lg" aria-hidden="true" />,
  search: <Search className="ic ic-lg" aria-hidden="true" />,
  mark: <BrandMark style={{ width: 26, height: 26, strokeWidth: 2.6 }} />,
  users: <Users className="ic ic-lg" aria-hidden="true" />,
} as const

const reveal = (i: number) =>
  i % 3 === 1 ? 'reveal reveal-2' : i % 3 === 2 ? 'reveal reveal-3' : 'reveal'

export default async function HomePage() {
  const today = data.today()
  const [home, content, daily] = await Promise.all([getHomePage(), data.home(), data.daily(today)])
  const { articles, categories, events, featured } = content

  return (
    <main id="main">
      {/* HERO */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="rh-pattern" aria-hidden="true" />
        <div className="hero__glow" aria-hidden="true" />
        <div className="rh-container">
          <div className="hero__inner">
            <p className="ar hero__ayah rh-in" lang="ar" dir="rtl">
              {home.heroAyah?.arabic}
            </p>
            <p className="hero__ayah-tr rh-in d1">
              “{home.heroAyah?.translation}” <RefBadge>{home.heroAyah?.reference}</RefBadge>
            </p>
            <h1 id="hero-title" className="t-display hero__title rh-in d2">
              {home.titleLine1}
              <br />
              <em>{home.titleLine2}</em>
            </h1>
            <p className="t-body-lg hero__sub rh-in d3">{home.subtitle}</p>
            <div className="hero__ctas rh-in d4">
              <ButtonLink href="#journey" size="lg" arrow>
                {home.primaryCtaLabel}
              </ButtonLink>
              <ButtonLink href="/about" variant="secondary" size="lg">
                {home.secondaryCtaLabel}
              </ButtonLink>
            </div>
            {home.support?.text ? (
              <p className="hero__support rh-in d5">
                {home.support.arabic ? (
                  <span className="ar-inline" lang="ar" dir="rtl">
                    {home.support.arabic}
                  </span>
                ) : null}
                <span>{home.support.text}</span>
              </p>
            ) : null}
          </div>
        </div>
        <svg
          className="hero__thread"
          viewBox="0 0 1440 160"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <path
            className="thread-echo"
            pathLength={1}
            d="M0 122C240 52 420 162 720 102S1200 42 1440 112"
          />
          <path
            className="thread-main"
            pathLength={1}
            d="M0 110C240 40 420 150 720 90S1200 30 1440 100"
          />
          {[
            [171.6, 85.8, 5],
            [337.5, 96.3, 5],
            [514.7, 108.6, 5],
            [720, 90, 6.5],
            [925.3, 56.4, 5],
            [1102.5, 46.3, 5],
            [1268.4, 60.5, 5],
          ].map(([cx, cy, r]) => (
            <circle key={cx} className="bead" cx={cx} cy={cy} r={r} />
          ))}
        </svg>
      </section>

      {/* PLEDGE */}
      <section aria-labelledby="pledge-title" style={{ position: 'relative', marginTop: -24 }}>
        <div className="rh-container">
          <div className="card card-raised pledge reveal">
            <div className="pledge__head">
              <span className="eyebrow">{home.pledgeEyebrow}</span>
              <h2 id="pledge-title" className="t-h4">
                {home.pledgeTitle}
              </h2>
            </div>
            <ul className="pledge__list">
              {(home.pledges ?? []).map((pl) => (
                <li key={pl.title} className="pledge__item">
                  <CircleCheck className="ic" aria-hidden="true" />
                  <div>
                    <strong>{pl.title}</strong>
                    <p>{pl.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* JOURNEY */}
      <section
        id="journey"
        className="section"
        aria-labelledby="journey-title"
        style={{ scrollMarginTop: 40 }}
      >
        <div className="rh-container">
          <SectionHead
            id="journey-title"
            eyebrow="যাত্রার ধাপ"
            title={home.journeyTitle}
            lead={home.journeyLead}
            className="reveal"
          />
          <Journey
            steps={(home.journeySteps ?? []).map((s) => ({
              title: s.title,
              text: s.text,
              href: s.href,
            }))}
          />
          <div className="journey__end reveal">
            <p className="t-muted">
              এই যাত্রায় আপনি কোথায় আছেন, নিজের ড্যাশবোর্ডে চিহ্নিত করে রাখুন।
            </p>
            <ButtonLink href="/dashboard" variant="secondary">
              আমার যাত্রা দেখুন
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ENVIRONMENT */}
      <section className="section section-alt pattern-host" aria-labelledby="env-title">
        <div className="rh-pattern" aria-hidden="true" />
        <div className="rh-container">
          <SectionHead
            id="env-title"
            eyebrow="আমাদের সংস্কৃতি"
            title={home.valuesTitle}
            lead={home.valuesLead}
            className="reveal"
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
              gap: 20,
            }}
          >
            {(home.values ?? []).map((v, i) => (
              <ValueCard
                key={v.title}
                className={reveal(i)}
                icon={VALUE_ICONS[v.icon as keyof typeof VALUE_ICONS] ?? VALUE_ICONS.book}
                title={v.title}
                text={v.text}
              />
            ))}
          </div>
        </div>
      </section>

      {/* DAILY AYAH + HADITH */}
      <section className="section" aria-labelledby="daily-title">
        <div className="rh-container">
          <SplitHead
            className="reveal"
            action={<p className="t-muted t-small">{formatLongDate(`${daily.date}T06:00:00Z`)}</p>}
          >
            <span className="eyebrow">প্রতিদিনের পাথেয়</span>
            <h2 id="daily-title" className="t-h2">
              আজকের আয়াত ও হাদিস
            </h2>
          </SplitHead>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))',
              gap: 24,
              alignItems: 'stretch',
            }}
          >
            {daily.ayah ? (
              <AyahCard
                className="reveal"
                labelledBy="ayah-label"
                eyebrow={
                  <span id="ayah-label" className="eyebrow">
                    আজকের আয়াত
                  </span>
                }
                arabic={daily.ayah.arabic}
                translation={daily.ayah.translation}
                reference={daily.ayah.reference}
                actions={
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    {daily.ayah.ayahId ? (
                      <BookmarkButton
                        target={{ collection: 'ayahs', id: daily.ayah.ayahId }}
                        labels={{
                          save: 'আয়াতটি সংরক্ষণ করুন',
                          remove: 'আয়াতটি সংরক্ষণ থেকে সরান',
                        }}
                      />
                    ) : null}
                    <ShareButton
                      title={daily.ayah.reference}
                      path="/"
                      label="আয়াতটি শেয়ার করুন"
                    />
                  </div>
                }
              />
            ) : null}
            {daily.hadith ? (
              <HadithCard
                className="reveal reveal-2"
                labelledBy="hadith-label"
                eyebrow={
                  <span id="hadith-label" className="eyebrow">
                    আজকের হাদিস
                  </span>
                }
                arabic={daily.hadith.arabic}
                text={daily.hadith.text}
                narrator={daily.hadith.narrator}
                source={daily.hadith.reference}
                grade={daily.hadith.grade}
              />
            ) : null}
          </div>
        </div>
      </section>

      {/* ILM CATEGORIES */}
      <section className="section section-line" aria-labelledby="ilm-title">
        <div className="rh-container">
          <SplitHead className="reveal" action={<LinkArrow href="/ilm">সব বিষয় দেখুন</LinkArrow>}>
            <span className="eyebrow">ইলম কেন্দ্র</span>
            <h2 id="ilm-title" className="t-h2">
              বিষয়ভিত্তিক জ্ঞানভান্ডার
            </h2>
            {home.ilmLead ? (
              <p className="lead" style={{ maxWidth: 560 }}>
                {home.ilmLead}
              </p>
            ) : null}
          </SplitHead>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))',
              gap: 16,
            }}
          >
            {categories.slice(0, 7).map((c, i) => (
              <div key={c.id} className={reveal(i)}>
                <CategoryTile
                  name={c.name}
                  icon={c.icon}
                  href={`/ilm?category=${c.slug}`}
                  foot={`${bn(c.articleCount)}টি প্রবন্ধ`}
                />
              </div>
            ))}
            <div className="reveal reveal-2">
              <CategoryTile
                all
                name="মতপার্থক্যের আদব"
                icon="columns"
                href="/ikhtilaf"
                foot="ভিন্ন মত, সমান সম্মানে"
              />
            </div>
          </div>
        </div>
      </section>

      {/* LATEST ARTICLES */}
      <section className="section section-alt" aria-labelledby="articles-title">
        <div className="rh-container">
          <SplitHead className="reveal" action={<LinkArrow href="/ilm">সব প্রবন্ধ</LinkArrow>}>
            <span className="eyebrow">নতুন লেখা</span>
            <h2 id="articles-title" className="t-h2">
              সর্বশেষ প্রবন্ধ
            </h2>
          </SplitHead>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(330px, 100%), 1fr))',
              gap: 24,
            }}
          >
            {articles.map((a, i) => (
              <ArticleCard key={a.id} article={a} className={reveal(i)} />
            ))}
          </div>
        </div>
      </section>

      {/* IKHTILAF FEATURE */}
      {featured ? (
        <section className="section" aria-labelledby="ikh-title">
          <div className="rh-container">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(440px, 100%), 1fr))',
                gap: 56,
                alignItems: 'center',
              }}
            >
              <div className="reveal" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <span className="eyebrow">ইখতিলাফ বিভাগ</span>
                <h2 id="ikh-title" className="t-h2">
                  মতপার্থক্যের আদব
                </h2>
                <p className="t-body-lg t-muted">
                  যেসব বিষয়ে আলিমদের মধ্যে দলিলভিত্তিক ভিন্নমত রয়েছে, সেখানে প্রতিটি মত তার দলিলসহ
                  পাশাপাশি তুলে ধরা হয়, সমান মর্যাদায়। উদ্দেশ্য বিতর্ক জেতা নয়, বোঝা ও সম্মান
                  করা।
                </p>
                <ul
                  className="list-reset"
                  style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}
                >
                  {(home.ikhtilafPoints ?? []).map((pt) => (
                    <li
                      key={pt.text}
                      style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
                    >
                      <Check
                        className="ic"
                        aria-hidden="true"
                        style={{ color: 'var(--rh-accent)', marginTop: 4 }}
                      />
                      <span>{pt.text}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: 10 }}>
                  <ButtonLink href="/ikhtilaf" arrow>
                    ইখতিলাফ বিভাগ দেখুন
                  </ButtonLink>
                </div>
              </div>
              <IkhtilafPreviewCard topic={featured} className="reveal reveal-2" />
            </div>
          </div>
        </section>
      ) : null}

      {/* UPCOMING MAJLIS */}
      {events.length ? (
        <section className="section section-line" aria-labelledby="events-title">
          <div className="rh-container">
            <SplitHead
              className="reveal"
              action={<LinkArrow href="/events">সব মজলিস দেখুন</LinkArrow>}
            >
              <span className="eyebrow">একসাথে বসি</span>
              <h2 id="events-title" className="t-h2">
                আসন্ন মজলিস
              </h2>
            </SplitHead>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {events.map((e, i) => (
                <div key={e.id} className={reveal(i)}>
                  <EventRow event={e} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* JOIN CTA */}
      <section className="section-sm" aria-labelledby="cta-title" style={{ paddingBottom: 104 }}>
        <div className="rh-container">
          <div className="cta-band reveal">
            <div className="rh-pattern" aria-hidden="true" />
            <svg
              className="cta-band__thread"
              viewBox="0 0 1200 140"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M0 100C200 40 360 130 600 80S1000 30 1200 90" />
              <path d="M0 116C220 64 380 146 600 98S1010 52 1200 108" style={{ opacity: 0.35 }} />
            </svg>
            <BrandMark style={{ width: 44, height: 44, color: '#D4A95C', strokeWidth: 2 }} />
            <h2 id="cta-title" className="t-h1">
              {home.ctaTitle}
            </h2>
            <p className="t-body-lg">{home.ctaText}</p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                justifyContent: 'center',
                marginTop: 10,
              }}
            >
              <ButtonLink href="/join" variant="gold" size="lg" arrow>
                যুক্ত হোন
              </ButtonLink>
              <ButtonLink href="/about" variant="onBand" size="lg">
                আগে আমাদের জানুন
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
