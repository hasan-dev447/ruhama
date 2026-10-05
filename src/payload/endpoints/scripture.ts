import { z } from 'zod'

import { errors } from '@/server/services/errors'
import {
  getHadith,
  getHadithBook,
  getSurah,
  listHadithBooks,
  listHadiths,
  listSurahs,
} from '@/server/queries/scripture'

import { param, query, v1 } from './helpers'

/** Scripture changes rarely: cache at the edge for a day. */
const DAILY = 'public, s-maxage=86400, stale-while-revalidate=604800'
const slug = z.string().regex(/^[a-z]+$/)

export const scriptureEndpoints = [
  v1('get', '/quran/surahs', async (_req, ctx) => ({ docs: await listSurahs(ctx.payload) }), {
    cache: DAILY,
  }),
  v1(
    'get',
    '/quran/surahs/:number',
    async (req, ctx) => {
      const res = await getSurah(
        ctx.payload,
        z.coerce.number().int().min(1).max(114).parse(param(req, 'number')),
      )
      if (!res) throw errors.notFound('সূরাটি পাওয়া যায়নি।')
      return res
    },
    { cache: DAILY },
  ),
  v1('get', '/hadith/books', async (_req, ctx) => ({ docs: await listHadithBooks(ctx.payload) }), {
    cache: DAILY,
  }),
  v1(
    'get',
    '/hadith/books/:book',
    async (req, ctx) => {
      const book = await getHadithBook(ctx.payload, slug.parse(param(req, 'book')))
      if (!book) throw errors.notFound('গ্রন্থটি পাওয়া যায়নি।')
      const q = query(req)
      return listHadiths(ctx.payload, {
        bookId: book.id,
        page: z.coerce.number().int().min(1).max(2000).catch(1).parse(q.get('page')),
        limit: 20,
        grade: z
          .enum(['sahih', 'hasan', 'daif', 'mawdu', 'unknown'])
          .optional()
          .catch(undefined)
          .parse(q.get('grade') ?? undefined),
        q: z
          .string()
          .trim()
          .max(120)
          .optional()
          .catch(undefined)
          .parse(q.get('q') ?? undefined),
      })
    },
    { cache: 'public, s-maxage=3600, stale-while-revalidate=86400' },
  ),
  v1(
    'get',
    '/hadith/books/:book/:number',
    async (req, ctx) => {
      const res = await getHadith(
        ctx.payload,
        slug.parse(param(req, 'book')),
        z.coerce.number().positive().parse(param(req, 'number')),
      )
      if (!res) throw errors.notFound('হাদিসটি পাওয়া যায়নি।')
      return res
    },
    { cache: DAILY },
  ),
]
