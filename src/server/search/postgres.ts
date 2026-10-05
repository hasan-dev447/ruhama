import type { Pool } from 'pg'

import { bn, formatDate, formatDuration } from '@/lib/format'
import { ayahReference, surahPath } from '@/lib/quran-meta'

import {
  SEARCH_TYPES,
  type Highlighted,
  type SearchHit,
  type SearchQuery,
  type SearchResults,
  type SearchService,
  type SearchType,
} from './types'

/** Unify Bangla spelling variants that differ only in encoding (nukta letters, joiners). */
export function normalizeQuery(q: string): string {
  return q
    .normalize('NFC')
    .replace(/য়/g, 'য়')
    .replace(/ড়/g, 'ড়')
    .replace(/ঢ়/g, 'ঢ়')
    .replace(/[​-‍⁠﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
}

/** Prefix tsquery from the words of the query ("ভাই সম্পর্ক" -> "ভাই:* & সম্পর্ক:*"). */
export function toTsQuery(q: string): string | null {
  const words = q
    .split(' ')
    .map((w) => w.replace(/[^\p{L}\p{N}\p{M}]/gu, ''))
    .filter((w) => w.length > 0)
    .slice(0, 6)
  return words.length ? words.map((w) => `${w}:*`).join(' & ') : null
}

const START = '\u0001'
const STOP = '\u0002'

/** Turn ts_headline output with control-character markers into highlight segments. */
export function toSegments(text: string | null | undefined): Highlighted | null {
  if (!text) return null
  const out: Highlighted = []
  for (const part of text.split(START)) {
    const [hit, rest] = part.includes(STOP) ? part.split(STOP) : [null, part]
    if (hit) out.push({ text: hit, hit: true })
    if (rest) out.push({ text: rest, hit: false })
  }
  return out.length ? out : null
}

type Row = { id: number; title: string; snippet: string | null; extra: Record<string, unknown> }

type Source = {
  /** FROM clause with alias t; filters for public documents */
  from: string
  where: string
  /** Column for the title, and its trigram-indexed fallback match */
  title: string
  snippet?: string
  /** JSON object of extra fields used to build links and meta */
  extra: string
  toHit: (r: Row) => Omit<SearchHit, 'type' | 'id' | 'title' | 'snippet'>
  /** Long titles (verses, hadith) are clipped by ts_headline as well */
  headlineTitle?: boolean
  /** Extra ranking signal added to the text rank */
  boost?: string
}

const SOURCES: Record<SearchType, Source> = {
  articles: {
    from: 'articles t',
    where: `t._status = 'published'`,
    title: 't.title',
    snippet: 't.excerpt',
    extra: `json_build_object('slug', t.slug, 'minutes', t.reading_time)`,
    toHit: (r) => ({
      href: `/ilm/${r.extra.slug}`,
      meta: r.extra.minutes ? `${bn(r.extra.minutes as number)} মিনিট পড়া · রিভিউকৃত` : 'রিভিউকৃত',
      reference: false,
    }),
  },
  ayahs: {
    from: 'ayahs t',
    where: 'true',
    title: 't.translation',
    extra: `json_build_object('surah', t.surah, 'ayah', t.ayah)`,
    headlineTitle: true,
    toHit: (r) => ({
      href: surahPath(Number(r.extra.surah), Number(r.extra.ayah)),
      meta: ayahReference(Number(r.extra.surah), Number(r.extra.ayah)),
      reference: true,
    }),
  },
  hadiths: {
    from: 'hadiths t JOIN hadith_collections b ON b.id = t.book_id',
    where: 'true',
    title: 't.text',
    extra: `json_build_object('book', b.slug, 'bookName', b.name, 'label', t.number_label, 'grade', t.grade)`,
    headlineTitle: true,
    // sahih first, then the six books in their customary order
    boost: `CASE t.grade WHEN 'sahih' THEN 0.03 WHEN 'hasan' THEN 0.015 ELSE 0 END + GREATEST(0, 9 - coalesce(b."order", 9)) * 0.003`,
    toHit: (r) => ({
      href: `/hadith/${r.extra.book}/${r.extra.label}`,
      meta: `${r.extra.bookName} : ${bn(String(r.extra.label))}${GRADE_BN[String(r.extra.grade)] ? ` · ${GRADE_BN[String(r.extra.grade)]}` : ''}`,
      reference: true,
    }),
  },
  questions: {
    from: 'questions t LEFT JOIN people p ON p.id = t.answered_by_id',
    where: `t._status = 'published'`,
    title: 't.title',
    snippet: 'coalesce(t.answer_excerpt, t.body)',
    extra: `json_build_object('slug', t.slug, 'by', p.name)`,
    toHit: (r) => ({
      href: `/qa/${r.extra.slug}`,
      meta: r.extra.by ? `উত্তর: ${r.extra.by} · রিভিউকৃত` : 'রিভিউকৃত উত্তর',
      reference: false,
    }),
  },
  ikhtilaf: {
    from: 'ikhtilaf_topics t',
    where: `t._status = 'published'`,
    title: 't.title',
    snippet: 't.lead',
    extra: `json_build_object('slug', t.slug)`,
    toHit: (r) => ({
      href: `/ikhtilaf/${r.extra.slug}`,
      meta: 'মতপার্থক্যের বিষয় · সব মত দলিলসহ',
      reference: false,
    }),
  },
  videos: {
    from: 'videos t LEFT JOIN people p ON p.id = t.speaker_id',
    where: `t.status = 'published'`,
    title: 't.title',
    snippet: 't.description',
    extra: `json_build_object('slug', t.slug, 'by', p.name, 'secs', t.duration_seconds)`,
    toHit: (r) => ({
      href: `/videos/${r.extra.slug}`,
      meta:
        [r.extra.by, r.extra.secs ? formatDuration(Number(r.extra.secs)) : null]
          .filter(Boolean)
          .join(' · ') || null,
      reference: false,
    }),
  },
  courses: {
    from: 'courses t',
    where: `t.status = 'published'`,
    title: 't.title',
    snippet: 't.description',
    extra: `json_build_object('slug', t.slug, 'lessons', t.lesson_count)`,
    toHit: (r) => ({
      href: `/courses/${r.extra.slug}`,
      meta: r.extra.lessons ? `${bn(Number(r.extra.lessons))} পাঠের কোর্স` : 'কোর্স',
      reference: false,
    }),
  },
  events: {
    from: 'events t',
    where: `t.status = 'published'`,
    title: 't.title',
    snippet: 't.summary',
    extra: `json_build_object('slug', t.slug, 'at', t.starts_at)`,
    toHit: (r) => ({
      href: `/events/${r.extra.slug}`,
      meta: r.extra.at ? formatDate(String(r.extra.at)) : null,
      reference: false,
    }),
  },
  people: {
    from: 'people t',
    where: 't.active = true',
    title: 't.name',
    snippet: `concat_ws(' · ', t.title, t.specialty)`,
    extra: `json_build_object('slug', t.slug, 'scholar', EXISTS (SELECT 1 FROM people_kinds k WHERE k.parent_id = t.id AND k.value = 'scholar'), 'articles', t.article_count, 'answers', t.answer_count)`,
    toHit: (r) => ({
      href: `${r.extra.scholar ? '/scholars' : '/speakers'}/${r.extra.slug}`,
      meta:
        [
          r.extra.articles ? `${bn(Number(r.extra.articles))} প্রবন্ধ` : null,
          r.extra.answers ? `${bn(Number(r.extra.answers))} উত্তর` : null,
        ]
          .filter(Boolean)
          .join(' · ') || null,
      reference: false,
    }),
  },
}

const GRADE_BN: Record<string, string> = {
  sahih: 'সহিহ',
  hasan: 'হাসান',
  daif: 'যঈফ',
  mawdu: 'মাওযু',
}
const HEADLINE = `StartSel=${START}, StopSel=${STOP}, MaxWords=34, MinWords=14, ShortWord=1, MaxFragments=1, FragmentDelimiter=" … "`

/** Postgres full-text search (simple config, prefix match) with an ILIKE fallback on titles. */
export class PostgresSearchService implements SearchService {
  constructor(private readonly pool: Pool) {}

  private match(source: Source) {
    return `(${source.where}) AND (t.search_tsv @@ to_tsquery('simple', $1) OR ${source.title} ILIKE $2)`
  }

  private async count(type: SearchType, tsq: string, like: string) {
    const s = SOURCES[type]
    const res = await this.pool.query<{ n: string }>(
      `SELECT count(*) AS n FROM ${s.from} WHERE ${this.match(s)}`,
      [tsq, like],
    )
    return Number(res.rows[0]?.n ?? 0)
  }

  private async hits(
    type: SearchType,
    tsq: string,
    like: string,
    limit: number,
    offset: number,
  ): Promise<SearchHit[]> {
    const s = SOURCES[type]
    const title = s.headlineTitle
      ? `ts_headline('simple', ${s.title}, to_tsquery('simple', $1), '${HEADLINE}')`
      : s.title
    const snippet = s.snippet
      ? `ts_headline('simple', coalesce(${s.snippet}, ''), to_tsquery('simple', $1), '${HEADLINE}')`
      : 'NULL'
    const sql = `
      WITH ranked AS (
        SELECT t.id, ts_rank_cd(t.search_tsv, to_tsquery('simple', $1), 1) + CASE WHEN ${s.title} ILIKE $2 THEN 0.6 ELSE 0 END${s.boost ? ` + ${s.boost}` : ''} AS score
        FROM ${s.from}
        WHERE ${this.match(s)}
        ORDER BY score DESC, t.id DESC
        LIMIT ${limit} OFFSET ${offset}
      )
      SELECT t.id, ${title} AS title, ${snippet} AS snippet, ${s.extra} AS extra
      FROM ranked r JOIN ${s.from} ON t.id = r.id
      ORDER BY r.score DESC, t.id DESC`
    const res = await this.pool.query<Row>(sql, [tsq, like])
    return res.rows.map((r) => ({
      type,
      id: r.id,
      title: toSegments(s.headlineTitle ? r.title : markPlain(r.title, tsq)) ?? [
        { text: r.title, hit: false },
      ],
      snippet: toSegments(r.snippet),
      ...s.toHit(r),
    }))
  }

  async search(query: SearchQuery): Promise<SearchResults> {
    const q = normalizeQuery(query.q)
    const empty = Object.fromEntries(SEARCH_TYPES.map((t) => [t, 0])) as Record<SearchType, number>
    const tsq = toTsQuery(q)
    if (!tsq || q.length < 2)
      return { q, total: 0, counts: empty, groups: [], hits: [], page: 1, totalPages: 0 }
    const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`

    const counts = { ...empty }
    await Promise.all(SEARCH_TYPES.map(async (t) => (counts[t] = await this.count(t, tsq, like))))
    const total = SEARCH_TYPES.reduce((s, t) => s + counts[t], 0)

    if (query.type) {
      const limit = query.limit ?? 20
      const page = Math.max(1, query.page ?? 1)
      const hits = counts[query.type]
        ? await this.hits(query.type, tsq, like, limit, (page - 1) * limit)
        : []
      return {
        q,
        total,
        counts,
        groups: [],
        hits,
        page,
        totalPages: Math.ceil(counts[query.type] / limit),
      }
    }

    const perGroup = query.perGroup ?? 3
    const groups = await Promise.all(
      SEARCH_TYPES.filter((t) => counts[t] > 0).map(async (type) => ({
        type,
        hits: await this.hits(type, tsq, like, perGroup, 0),
      })),
    )
    return { q, total, counts, groups, hits: [], page: 1, totalPages: 1 }
  }
}

/** Highlight query words inside a short title without asking Postgres for a headline. */
function markPlain(text: string, tsq: string): string {
  const words = tsq
    .split(' & ')
    .map((w) => w.replace(/:\*$/, ''))
    .filter(Boolean)
  if (!words.length) return text
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return text.replace(new RegExp(`(${escaped.join('|')})`, 'gu'), `${START}$1${STOP}`)
}
