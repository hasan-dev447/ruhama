import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import { SurahReader } from '@/components/scripture/surah-reader'
import { bn } from '@/lib/format'
import { pageCanonical, pageStart, resolveSurah, surahPath } from '@/lib/quran-meta'
import { buildMetadata } from '@/lib/seo'
import { data } from '@/server/data'

export const revalidate = 86400

type Props = { params: Promise<{ surah: string; ayah: string }> }

// 6,236 addresses: none built ahead, each one is made on its first visit and then served from cache
export function generateStaticParams() {
  return []
}

/**
 * One ayah's address, e.g. `/quran/al-baqarah/255`: the shareable link for a verse. It shows the
 * surah from the block holding that ayah, with the ayah in view, and its own title and description
 * for link previews. Search engines index the block's page instead (canonical), so the same ayahs
 * are not listed many times.
 */
async function load(params: Props['params']) {
  const { surah: param, ayah: raw } = await params
  const { meta, redirect } = resolveSurah(param)
  const ayah = /^\d+$/.test(raw) ? Number(raw) : NaN
  if (!meta || !Number.isInteger(ayah) || ayah < 1 || ayah > meta.ayahs) return null
  return { meta, redirect, ayah }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await load(params)
  if (!found)
    return buildMetadata({ title: 'আয়াতটি পাওয়া যায়নি', path: '/quran', noIndex: true })
  const { meta, ayah } = found
  const res = await data.surah(meta.number)
  const text = res?.ayahs.find((a) => a.ayah === ayah)?.translation ?? ''
  return buildMetadata({
    title: `সূরা ${meta.bangla}, আয়াত ${bn(ayah)}`,
    description: text.length > 155 ? `${text.slice(0, 154)}…` : text,
    path: surahPath(meta.number, ayah),
    canonical: pageCanonical(meta.number, ayah),
  })
}

export default async function AyahPage({ params }: Props) {
  const found = await load(params)
  if (!found) notFound()
  const { meta, redirect, ayah } = found
  if (redirect) permanentRedirect(surahPath(meta.number, ayah))
  const res = await data.surah(meta.number)
  if (!res) notFound()
  return <SurahReader surah={res.surah} ayahs={res.ayahs} start={pageStart(ayah)} focus={ayah} />
}
