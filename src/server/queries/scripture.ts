import type { Payload, Where } from 'payload'

export type SurahView = {
  number: number
  nameArabic: string
  nameBangla: string
  nameLatin: string
  revelation: 'meccan' | 'medinan'
  ayahCount: number
}
export type AyahView = {
  id: number
  surah: number
  ayah: number
  key: string
  juz: number | null
  arabic: string
  translation: string
}
export type HadithBookView = {
  id: number
  slug: string
  name: string
  shortName: string
  compiler: string | null
  hadithCount: number
}
export type HadithView = {
  id: number
  key: string
  number: number
  numberLabel: string
  chapter: string | null
  narrator: string | null
  arabic: string | null
  text: string
  grade: string
  gradeSource: string | null
  book: { slug: string; name: string; shortName: string }
}

const toSurah = (s: Record<string, unknown>): SurahView => ({
  number: Number(s.number),
  nameArabic: String(s.nameArabic ?? ''),
  nameBangla: String(s.nameBangla ?? ''),
  nameLatin: String(s.nameLatin ?? ''),
  revelation: s.revelation === 'medinan' ? 'medinan' : 'meccan',
  ayahCount: Number(s.ayahCount ?? 0),
})

export async function listSurahs(payload: Payload): Promise<SurahView[]> {
  const res = await payload.find({
    collection: 'surahs',
    depth: 0,
    sort: 'number',
    limit: 114,
    pagination: false,
  })
  return res.docs.map((d) => toSurah(d as never))
}

/** A whole surah, ayahs in order (the longest has 286). */
export async function getSurah(payload: Payload, number: number) {
  const s = await payload.find({
    collection: 'surahs',
    where: { number: { equals: number } },
    depth: 0,
    limit: 1,
  })
  if (!s.docs[0]) return null
  const ayahs = await payload.find({
    collection: 'ayahs',
    where: { surah: { equals: number } },
    select: { surah: true, ayah: true, key: true, juz: true, arabic: true, translation: true },
    depth: 0,
    sort: 'sortKey',
    limit: 300,
    pagination: false,
  })
  return {
    surah: toSurah(s.docs[0] as never),
    ayahs: ayahs.docs.map((a) => ({
      id: a.id,
      surah: a.surah,
      ayah: a.ayah,
      key: a.key ?? `${a.surah}:${a.ayah}`,
      juz: a.juz ?? null,
      arabic: a.arabic,
      translation: a.translation,
    })) as AyahView[],
  }
}

export async function listHadithBooks(payload: Payload): Promise<HadithBookView[]> {
  const res = await payload.find({
    collection: 'hadith-collections',
    depth: 0,
    sort: 'order',
    limit: 50,
    pagination: false,
  })
  return res.docs
    .filter((b) => (b.hadithCount ?? 0) > 0)
    .map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      shortName: b.shortName,
      compiler: b.compiler ?? null,
      hadithCount: b.hadithCount ?? 0,
    }))
}

export async function getHadithBook(
  payload: Payload,
  slug: string,
): Promise<HadithBookView | null> {
  const res = await payload.find({
    collection: 'hadith-collections',
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
  })
  const b = res.docs[0]
  return b
    ? {
        id: b.id,
        slug: b.slug,
        name: b.name,
        shortName: b.shortName,
        compiler: b.compiler ?? null,
        hadithCount: b.hadithCount ?? 0,
      }
    : null
}

const HADITH_SELECT = {
  key: true,
  number: true,
  numberLabel: true,
  chapter: true,
  narrator: true,
  arabic: true,
  text: true,
  grade: true,
  gradeSource: true,
  book: true,
} as const

function toHadith(h: Record<string, unknown>): HadithView {
  const book = (h.book && typeof h.book === 'object' ? h.book : {}) as {
    slug?: string
    name?: string
    shortName?: string
  }
  return {
    id: h.id as number,
    key: String(h.key),
    number: Number(h.number),
    numberLabel: String(h.numberLabel ?? h.number),
    chapter: (h.chapter as string) ?? null,
    narrator: (h.narrator as string) ?? null,
    arabic: (h.arabic as string) ?? null,
    text: String(h.text ?? ''),
    grade: String(h.grade ?? 'unknown'),
    gradeSource: (h.gradeSource as string) ?? null,
    book: { slug: book.slug ?? '', name: book.name ?? '', shortName: book.shortName ?? '' },
  }
}

const bookPopulate = { 'hadith-collections': { slug: true, name: true, shortName: true } } as const

export async function listHadiths(
  payload: Payload,
  params: {
    bookId: number
    page?: number
    limit?: number
    grade?: string | null
    q?: string | null
  },
) {
  const and: Where[] = [{ book: { equals: params.bookId } }]
  if (params.grade && params.grade !== 'all') and.push({ grade: { equals: params.grade } })
  const q = params.q?.trim()
  if (q)
    and.push(
      /^\d+$/.test(q)
        ? { number: { equals: Number(q) } }
        : { or: [{ text: { like: q } }, { narrator: { like: q } }] },
    )
  const res = await payload.find({
    collection: 'hadiths',
    where: { and },
    select: HADITH_SELECT,
    populate: bookPopulate,
    depth: 1,
    sort: 'number',
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  })
  return {
    docs: res.docs.map((d) => toHadith(d as never)),
    totalDocs: res.totalDocs,
    totalPages: res.totalPages,
    page: res.page ?? 1,
  }
}

/** One hadith with its neighbours for prev/next links. */
export async function getHadith(payload: Payload, bookSlug: string, number: number) {
  const res = await payload.find({
    collection: 'hadiths',
    where: { key: { equals: `${bookSlug}:${number}` } },
    select: HADITH_SELECT,
    populate: bookPopulate,
    depth: 1,
    limit: 1,
  })
  const doc = res.docs[0]
  if (!doc) return null
  const hadith = toHadith(doc as never)
  const bookId = (doc.book as { id?: number } | null)?.id ?? (doc.book as number)
  const [prev, next] = await Promise.all([
    payload.find({
      collection: 'hadiths',
      where: { and: [{ book: { equals: bookId } }, { number: { less_than: number } }] },
      select: { number: true },
      depth: 0,
      sort: '-number',
      limit: 1,
    }),
    payload.find({
      collection: 'hadiths',
      where: { and: [{ book: { equals: bookId } }, { number: { greater_than: number } }] },
      select: { number: true },
      depth: 0,
      sort: 'number',
      limit: 1,
    }),
  ])
  return { hadith, prev: prev.docs[0]?.number ?? null, next: next.docs[0]?.number ?? null }
}
