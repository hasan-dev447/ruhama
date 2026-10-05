/**
 * Import the Quran into the `surahs` and `ayahs` tables.
 *
 *   npm run import:quran            # uses the cached download when present
 *   npm run import:quran -- --refresh
 *
 * Sources (attribution is shown on every Quran page, see src/lib/sources.ts):
 *  - Arabic: Tanzil Quran Text (Simple), CC BY 3.0, unmodified
 *  - Bangla: Maulana Muhiuddin Khan, from the Tanzil translations collection
 *  - Delivered through the fawazahmed0/quran-api dataset on jsDelivr
 *
 * Safe to run repeatedly: rows are upserted by surah number and `surah:ayah` key.
 */
import 'dotenv/config'

import { stripArabic } from '@/lib/arabic'
import { SURAHS, TOTAL_AYAHS } from '@/lib/quran-meta'

import { connect, fetchJson, upsertRows } from './lib/import-utils'

const BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1'

type Edition = { quran: { chapter: number; verse: number; text: string }[] }
type Info = {
  chapters: {
    chapter: number
    name: string
    arabicname: string
    englishname: string
    revelation: string
    verses: { verse: number; juz: number }[]
  }[]
}

async function main() {
  const refresh = process.argv.includes('--refresh')
  console.log('Downloading Quran datasets…')
  const [info, arabic, bangla] = await Promise.all([
    fetchJson<Info>(`${BASE}/info.min.json`, { refresh }),
    fetchJson<Edition>(`${BASE}/editions/ara-quransimple.min.json`, { refresh }),
    fetchJson<Edition>(`${BASE}/editions/ben-muhiuddinkhan.min.json`, { refresh }),
  ])

  // integrity checks against our own surah table before touching the database
  if (arabic.quran.length !== TOTAL_AYAHS || bangla.quran.length !== TOTAL_AYAHS) {
    throw new Error(
      `unexpected ayah count: arabic ${arabic.quran.length}, bangla ${bangla.quran.length}, expected ${TOTAL_AYAHS}`,
    )
  }
  for (const s of SURAHS) {
    const chapter = info.chapters.find((c) => c.chapter === s.number)
    if (!chapter || chapter.verses.length !== s.ayahs)
      throw new Error(`surah ${s.number}: ayah count mismatch`)
  }

  const juzOf = new Map<string, number>()
  for (const c of info.chapters)
    for (const v of c.verses) juzOf.set(`${c.chapter}:${v.verse}`, v.juz)
  const banglaOf = new Map(bangla.quran.map((a) => [`${a.chapter}:${a.verse}`, a.text.trim()]))

  const pool = connect()
  try {
    const surahRows = SURAHS.map((s) => {
      const c = info.chapters.find((x) => x.chapter === s.number)!
      return [
        s.number,
        c.arabicname.replace(/^\s*سُوْرَةُ\s+/, '').trim(),
        s.bangla,
        s.latin,
        c.revelation?.toLowerCase().startsWith('mad') ? 'medinan' : 'meccan',
        s.ayahs,
      ]
    })
    const surahsWritten = await upsertRows(
      pool,
      'surahs',
      'number',
      ['number', 'name_arabic', 'name_bangla', 'name_latin', 'revelation', 'ayah_count'],
      surahRows,
    )

    // this copy prefixes the basmala to verse 1 of every surah; Tanzil's original keeps it
    // only as al-Fatihah 1:1, and the reader shows it separately above each surah
    const basmala = arabic.quran.find((a) => a.chapter === 1 && a.verse === 1)!.text.trim()
    const ayahRows = arabic.quran.map((a) => {
      const key = `${a.chapter}:${a.verse}`
      const translation = banglaOf.get(key)
      if (!translation) throw new Error(`missing Bangla translation for ${key}`)
      let text = a.text.trim()
      if (a.verse === 1 && a.chapter !== 1 && text.startsWith(`${basmala} `))
        text = text.slice(basmala.length).trim()
      return [
        a.chapter,
        a.verse,
        juzOf.get(key) ?? null,
        key,
        a.chapter * 1000 + a.verse,
        text,
        stripArabic(text),
        translation,
      ]
    })
    const ayahsWritten = await upsertRows(
      pool,
      'ayahs',
      'key',
      ['surah', 'ayah', 'juz', 'key', 'sort_key', 'arabic', 'arabic_plain', 'translation'],
      ayahRows,
    )

    console.log(
      `Done. ${surahsWritten} surahs and ${ayahsWritten} ayahs written (${TOTAL_AYAHS} ayahs in total).`,
    )
    console.log('Published Quran pages refresh within a day, or immediately after the next deploy.')
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
