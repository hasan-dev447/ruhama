import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { Fragment } from 'react'

import { ShareButton } from '@/components/actions/share-button'
import { AyahActions } from '@/components/scripture/ayah-actions'
import { SourceNote } from '@/components/scripture/source-note'
import { JsonLd } from '@/components/seo/json-ld'
import { Badge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/ui/primitives'
import { bn } from '@/lib/format'
import { ayahReference, SURAHS, surahBySlug, surahMeta, surahPath } from '@/lib/quran-meta'
import { breadcrumbLd, buildMetadata } from '@/lib/seo'
import { QURAN_SOURCE } from '@/lib/sources'
import { data } from '@/server/data'

export const revalidate = 86400

type Props = { params: Promise<{ surah: string }> }

/** `/quran/al-kahf`; a bare number such as `/quran/18` redirects to the readable slug. */
function resolve(param: string) {
  if (/^\d+$/.test(param)) return { meta: surahMeta(Number(param)), redirect: true }
  return { meta: surahBySlug(param), redirect: false }
}

export function generateStaticParams() {
  return SURAHS.map((s) => ({ surah: s.latin }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { surah } = await params
  const { meta } = resolve(surah)
  if (!meta)
    return buildMetadata({ title: 'সূরাটি পাওয়া যায়নি', path: `/quran/${surah}`, noIndex: true })
  return buildMetadata({
    title: `সূরা ${meta.bangla}`,
    description: `সূরা ${meta.bangla} (${bn(meta.number)}): ${bn(meta.ayahs)} আয়াত, আরবি মূল পাঠ ও বাংলা অনুবাদ।`,
    path: surahPath(meta.number),
  })
}

export default async function SurahPage({ params }: Props) {
  const { surah: param } = await params
  const { meta, redirect } = resolve(param)
  if (!meta) notFound()
  if (redirect) permanentRedirect(surahPath(meta.number))
  const res = await data.surah(meta.number)
  if (!res) notFound()
  const { surah, ayahs } = res

  const prev = surahMeta(meta.number - 1)
  const next = surahMeta(meta.number + 1)
  // al-Fatihah counts the basmala as its first ayah; at-Tawbah has none
  const showBismillah = meta.number !== 1 && meta.number !== 9
  const path = surahPath(meta.number)

  return (
    <main id="main">
      <section
        className="pattern-host"
        style={{
          background: 'var(--rh-band-bg)',
          color: 'var(--rh-band-ink)',
          padding: '40px 0 48px',
        }}
      >
        <div
          className="rh-pattern"
          aria-hidden="true"
          style={{ backgroundColor: '#F3E9D6', opacity: 0.08 }}
        />
        <div
          className="rh-container-narrow"
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Breadcrumbs
            className="crumbs--band"
            items={[{ label: 'আল-কুরআন', href: '/quran' }, { label: `সূরা ${surah.nameBangla}` }]}
            style={{ color: 'var(--rh-band-muted)', justifyContent: 'center' }}
            linkStyle={{ color: 'var(--rh-band-muted)' }}
          />
          <p
            lang="ar"
            dir="rtl"
            style={{
              fontFamily: 'var(--rh-font-arabic)',
              fontSize: 'clamp(2.25rem, 1.8rem + 2vw, 3.25rem)',
              color: '#D4A95C',
              lineHeight: 1.5,
              marginTop: 8,
            }}
          >
            {surah.nameArabic}
          </p>
          <h1 className="t-h1" style={{ color: 'var(--rh-band-ink)' }}>
            সূরা {surah.nameBangla}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            <Badge style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--rh-band-ink)' }}>
              সূরা নং {bn(surah.number)}
            </Badge>
            <Badge style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--rh-band-ink)' }}>
              {surah.revelation === 'medinan' ? 'মাদানী' : 'মাক্কী'}
            </Badge>
            <Badge style={{ background: 'rgba(212,169,92,0.22)', color: '#F3E2BE' }}>
              {bn(surah.ayahCount)} আয়াত
            </Badge>
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="rh-container-narrow">
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <ShareButton
              title={`সূরা ${surah.nameBangla}`}
              path={path}
              variant="ghost"
              label="শেয়ার"
            />
          </div>
          {showBismillah ? (
            <p className="bismillah" lang="ar">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
          ) : null}
          <ol className="ayah-list list-reset" aria-label={`সূরা ${surah.nameBangla}-এর আয়াতসমূহ`}>
            {ayahs.map((a, i) => {
              const reference = ayahReference(a.surah, a.ayah)
              const newJuz = i > 0 && a.juz !== null && a.juz !== ayahs[i - 1]?.juz
              return (
                <Fragment key={a.id}>
                  {newJuz ? (
                    <li className="juz-marker" aria-hidden="true">
                      পারা {bn(a.juz!)}
                    </li>
                  ) : null}
                  <li id={`ayah-${a.ayah}`} className="ayah-row">
                    <span className="ayah-row__num" aria-label={`আয়াত ${bn(a.ayah)}`}>
                      {bn(a.ayah)}
                    </span>
                    <p className="ar" lang="ar" dir="rtl">
                      {a.arabic}
                    </p>
                    <p className="ayah-row__tr">{a.translation}</p>
                    <AyahActions
                      id={a.id}
                      arabic={a.arabic}
                      translation={a.translation}
                      reference={reference}
                      anchor={`ayah-${a.ayah}`}
                    />
                  </li>
                </Fragment>
              )
            })}
          </ol>

          <nav
            aria-label="সূরা নেভিগেশন"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
              gap: 14,
              marginTop: 32,
            }}
          >
            {prev ? (
              <Link
                href={surahPath(prev.number)}
                className="card card-hover"
                style={{
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  textDecoration: 'none',
                  color: 'var(--rh-ink)',
                }}
              >
                <ChevronLeft className="ic" aria-hidden="true" />
                <span>
                  <span className="t-caption t-muted" style={{ display: 'block' }}>
                    আগের সূরা
                  </span>
                  <strong style={{ fontWeight: 600 }}>{prev.bangla}</strong>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={surahPath(next.number)}
                className="card card-hover"
                style={{
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 14,
                  textDecoration: 'none',
                  color: 'var(--rh-ink)',
                  textAlign: 'right',
                }}
              >
                <span>
                  <span className="t-caption t-muted" style={{ display: 'block' }}>
                    পরের সূরা
                  </span>
                  <strong style={{ fontWeight: 600 }}>{next.bangla}</strong>
                </span>
                <ChevronRight className="ic" aria-hidden="true" />
              </Link>
            ) : null}
          </nav>
          <SourceNote items={[QURAN_SOURCE.arabic, QURAN_SOURCE.translation]} />
        </div>
      </section>
      <JsonLd
        data={breadcrumbLd([
          { name: 'আল-কুরআন', path: '/quran' },
          { name: `সূরা ${surah.nameBangla}`, path },
        ])}
      />
    </main>
  )
}
