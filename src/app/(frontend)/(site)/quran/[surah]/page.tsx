import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import { SurahReader } from '@/components/scripture/surah-reader'
import { bn } from '@/lib/format'
import { resolveSurah, SURAHS, surahPath } from '@/lib/quran-meta'
import { buildMetadata } from '@/lib/seo'
import { data } from '@/server/data'

export const revalidate = 86400

type Props = { params: Promise<{ surah: string }> }

export function generateStaticParams() {
  return SURAHS.map((s) => ({ surah: s.latin }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { surah } = await params
  const { meta } = resolveSurah(surah)
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
  const { meta, redirect } = resolveSurah(param)
  if (!meta) notFound()
  if (redirect) permanentRedirect(surahPath(meta.number))
  const res = await data.surah(meta.number)
  if (!res) notFound()
  return <SurahReader surah={res.surah} ayahs={res.ayahs} start={1} />
}
