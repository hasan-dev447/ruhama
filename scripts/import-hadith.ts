/**
 * Import hadith collections (Arabic + Bangla) into `hadith-collections` and `hadiths`.
 *
 *   npm run import:hadith                      # all books listed in src/lib/sources.ts
 *   npm run import:hadith -- bukhari muslim    # selected books
 *   npm run import:hadith -- --refresh         # ignore the download cache
 *
 * Source: fawazahmed0/hadith-api (Arabic and Bangla editions) on jsDelivr.
 * Grades: Bukhari and Muslim are marked sahih; other books use al-Albani's verdict
 * when present (see pickGrade). Narrators are read from the opening of the Bangla text.
 * Safe to run repeatedly: rows are upserted by `book:number` key.
 */
import 'dotenv/config'

import { stripArabic } from '@/lib/arabic'
import { cleanHadithText, extractNarrator, normalizeArabicDashes, pickGrade } from '@/lib/hadith'
import { HADITH_BOOKS, type HadithBookSlug } from '@/lib/sources'

import { connect, fetchJson, upsertRows } from './lib/import-utils'

const BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1'

type Edition = {
  metadata: { name: string; sections: Record<string, string> }
  hadiths: {
    hadithnumber: number
    arabicnumber?: number
    text: string
    grades?: { name: string; grade: string }[]
    reference?: { book: number; hadith: number }
  }[]
}

const hasBangla = (s: string) => /[ঀ-৿]/.test(s)

async function main() {
  const args = process.argv.slice(2)
  const refresh = args.includes('--refresh')
  const wanted = args.filter((a) => !a.startsWith('--'))
  const unknown = wanted.filter((w) => !HADITH_BOOKS.some((b) => b.slug === w))
  if (unknown.length)
    throw new Error(
      `unknown book(s): ${unknown.join(', ')}. Available: ${HADITH_BOOKS.map((b) => b.slug).join(', ')}`,
    )
  const books = HADITH_BOOKS.filter(
    (b) => !wanted.length || wanted.includes(b.slug as HadithBookSlug),
  )

  const pool = connect()
  try {
    await upsertRows(
      pool,
      'hadith_collections',
      'slug',
      ['slug', 'name', 'short_name', 'compiler', 'order'],
      HADITH_BOOKS.map((b) => [b.slug, b.name, b.shortName, b.compiler, b.order]),
    )
    const ids = new Map<string, number>(
      (
        await pool.query<{ id: number; slug: string }>('SELECT id, slug FROM hadith_collections')
      ).rows.map((r) => [r.slug, r.id]),
    )

    for (const book of books) {
      console.log(`\n${book.name} (${book.slug})`)
      const [bangla, arabic] = await Promise.all([
        fetchJson<Edition>(`${BASE}/editions/ben-${book.slug}.min.json`, { refresh }),
        fetchJson<Edition>(`${BASE}/editions/ara-${book.slug}.min.json`, { refresh }),
      ])
      const arabicOf = new Map(
        arabic.hadiths.map((h) => [h.hadithnumber, normalizeArabicDashes(h.text?.trim() ?? '')]),
      )
      const sections = bangla.metadata.sections ?? {}

      const seen = new Set<string>()
      const rows: unknown[][] = []
      let narrators = 0
      for (const h of bangla.hadiths) {
        const text = cleanHadithText(h.text ?? '')
        if (!text) continue
        const key = `${book.slug}:${h.hadithnumber}`
        if (seen.has(key)) continue
        seen.add(key)
        const narrator = extractNarrator(text)
        if (narrator) narrators++
        const { grade, source } = pickGrade(book.slug, h.grades)
        const ar = arabicOf.get(h.hadithnumber) || null
        const section =
          h.reference?.book !== undefined ? sections[String(h.reference.book)] : undefined
        rows.push([
          ids.get(book.slug),
          h.hadithnumber,
          String(h.hadithnumber),
          key,
          section && hasBangla(section) ? section : null,
          narrator,
          ar,
          ar ? stripArabic(ar) : null,
          text,
          grade,
          source,
        ])
      }
      const written = await upsertRows(
        pool,
        'hadiths',
        'key',
        [
          'book_id',
          'number',
          'number_label',
          'key',
          'chapter',
          'narrator',
          'arabic',
          'arabic_plain',
          'text',
          'grade',
          'grade_source',
        ],
        rows,
        300,
      )
      await pool.query(
        'UPDATE hadith_collections SET hadith_count = (SELECT count(*) FROM hadiths WHERE book_id = $1), updated_at = now() WHERE id = $1',
        [ids.get(book.slug)],
      )
      console.log(`  ${rows.length} hadith, ${written} written, narrator found for ${narrators}`)
    }
    console.log(
      '\nDone. Published hadith pages refresh within a day, or immediately after the next deploy.',
    )
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
