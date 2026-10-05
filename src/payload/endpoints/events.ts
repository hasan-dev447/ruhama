import { timingSafeEqual } from 'node:crypto'

import { z } from 'zod'

import { eventRegistrationSchema } from '@/lib/validation/events'
import { safeRevalidate } from '@/payload/hooks/revalidate'
import { TAGS } from '@/server/cache/tags'
import { errors } from '@/server/services/errors'
import {
  cancelRegistration,
  eventIcs,
  myRegistration,
  registerForEvent,
  sendEventReminders,
} from '@/server/services/events'
import { purgeExpiredRateLimits } from '@/server/services/rate-limit'
import { purgeDeletedAccounts } from '@/server/services/settings'

import { param, readBody, v1 } from './helpers'

const id = z.coerce.number().int().positive()

function cronAuthorized(header: string | null) {
  const secret = process.env.CRON_SECRET
  if (!secret || !header) return false
  const a = Buffer.from(header)
  const b = Buffer.from(`Bearer ${secret}`)
  return a.length === b.length && timingSafeEqual(a, b)
}

export const eventEndpoints = [
  v1('post', '/events/:id/register', async (req, ctx) =>
    registerForEvent(ctx, id.parse(param(req, 'id')), await readBody(req, eventRegistrationSchema)),
  ),
  v1('get', '/me/events/:id/registration', async (req, ctx) =>
    myRegistration(ctx, id.parse(param(req, 'id'))),
  ),
  v1('post', '/events/:id/cancel', async (req, ctx) =>
    cancelRegistration(ctx, id.parse(param(req, 'id'))),
  ),
  v1('get', '/events/:slug/ics', async (req, ctx) => {
    const ics = await eventIcs(ctx.payload, param(req, 'slug'))
    if (!ics) throw errors.notFound('মজলিসটি পাওয়া যায়নি।')
    return new Response(ics.body, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${ics.filename}"`,
        'Cache-Control': 'public, s-maxage=300',
      },
    })
  }),
  /** Vercel Cron (daily): event reminders, account purges after the grace period, housekeeping. Requires `Authorization: Bearer $CRON_SECRET`. */
  v1('get', '/cron/daily', async (req, ctx) => {
    if (!cronAuthorized(req.headers.get('authorization'))) throw errors.unauthorized()
    const reminders = await sendEventReminders(ctx.payload)
    const accounts = await purgeDeletedAccounts(ctx.payload)
    await purgeExpiredRateLimits(ctx.payload)
    return { ok: true, reminders, accounts }
  }),
  /**
   * Vercel Cron at Bangladesh midnight (18:00 UTC): the only content that changes with the clock rather
   * than with an edit (the daily ayah and hadith, upcoming events and circle meetups) is refreshed here,
   * which lets every other page keep a long cache and saves ISR and database usage.
   */
  v1('get', '/cron/refresh', async (req) => {
    if (!cronAuthorized(req.headers.get('authorization'))) throw errors.unauthorized()
    const tags = [
      TAGS.home,
      TAGS.daily,
      TAGS.collection('events'),
      TAGS.collection('circles'),
      TAGS.sitemap,
    ]
    safeRevalidate(tags)
    return { ok: true, refreshed: tags }
  }),
]
