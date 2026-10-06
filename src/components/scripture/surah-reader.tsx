import { IconChevronBack, IconChevronNext, IconChevronUp } from '@/components/icons'
import Link from 'next/link'

import { ShareButton } from '@/components/actions/share-button'
import { JsonLd } from '@/components/seo/json-ld'
import { Badge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/ui/primitives'
import { bn } from '@/lib/format'
import { AYAH_PAGE, surahMeta, surahPath } from '@/lib/quran-meta'
import { breadcrumbLd } from '@/lib/seo'
import { QURAN_SOURCE } from '@/lib/sources'
import type { AyahView, SurahView } from '@/server/queries/scripture'

import { AyahFocus } from './ayah-focus'
import { AyahRow } from './ayah-row'
import { MoreAyahs } from './more-ayahs'
import { SourceNote } from './source-note'

/**
 * A surah page: one block of AYAH_PAGE ayahs starting at `start`, with "load more" for the rest.
 * `/quran/al-baqarah` starts at 1; `/quran/al-baqarah/255` starts at the block holding 255 and
 * brings that ayah into view.
 */
export function SurahReader({
  surah,
  ayahs,
  start,
  focus,
}: {
  surah: SurahView
  ayahs: AyahView[]
  start: number
  focus?: number
}) {
  const block = ayahs.filter((a) => a.ayah >= start && a.ayah < start + AYAH_PAGE)
  const before = ayahs.find((a) => a.ayah === start - 1)
  const last = block.at(-1)
  const prev = surahMeta(surah.number - 1)
  const next = surahMeta(surah.number + 1)
  // al-Fatihah counts the basmala as its first ayah; at-Tawbah has none
  const showBismillah = start === 1 && surah.number !== 1 && surah.number !== 9
  const path = surahPath(surah.number)

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
            items={[
              { label: 'আল-কুরআন', href: '/quran' },
              focus
                ? { label: `সূরা ${surah.nameBangla}`, href: path }
                : { label: `সূরা ${surah.nameBangla}` },
              ...(focus ? [{ label: `আয়াত ${bn(focus)}` }] : []),
            ]}
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
          <div className="surah-tools">
            {start > 1 ? (
              <Link
                href={start - AYAH_PAGE > 1 ? surahPath(surah.number, start - AYAH_PAGE) : path}
                className="link-arrow"
              >
                <IconChevronUp className="ic" aria-hidden="true" />
                {bn(Math.max(1, start - AYAH_PAGE))}–{bn(start - 1)} নং আয়াত
              </Link>
            ) : (
              <span />
            )}
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
          <ol
            className="ayah-list list-reset"
            start={start}
            aria-label={`সূরা ${surah.nameBangla}-এর আয়াতসমূহ`}
          >
            {block.map((a, i) => (
              <AyahRow
                key={a.id}
                a={a}
                prevJuz={i === 0 ? (before?.juz ?? null) : (block[i - 1]?.juz ?? null)}
                focus={a.ayah === focus}
              />
            ))}
          </ol>
          <MoreAyahs
            surah={surah.number}
            from={start + block.length}
            total={surah.ayahCount}
            lastJuz={last?.juz ?? null}
          />
          <AyahFocus surah={surah.number} focus={focus} />

          <nav aria-label="সূরা নেভিগেশন" className="surah-nav">
            {prev ? (
              <Link href={surahPath(prev.number)} className="card card-hover surah-nav__link">
                <IconChevronBack className="ic" aria-hidden="true" />
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
                className="card card-hover surah-nav__link surah-nav__link--next"
              >
                <span>
                  <span className="t-caption t-muted" style={{ display: 'block' }}>
                    পরের সূরা
                  </span>
                  <strong style={{ fontWeight: 600 }}>{next.bangla}</strong>
                </span>
                <IconChevronNext className="ic" aria-hidden="true" />
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
          ...(focus ? [{ name: `আয়াত ${bn(focus)}`, path: surahPath(surah.number, focus) }] : []),
        ])}
      />
    </main>
  )
}
