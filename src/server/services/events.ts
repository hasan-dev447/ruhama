import type { Payload } from 'payload'

import { districtLabel } from '@/lib/districts'
import { formatLongDate, formatTime } from '@/lib/format'
import { normalizeBdPhone } from '@/lib/phone'
import { eventRegistrationSchema, type EventRegistrationInput } from '@/lib/validation/events'

import { emailTemplates } from '../email/templates'
import { sendEmail } from '../email'
import type { ServiceContext } from './context'
import { eventSeats, recountEvent } from './counters'
import { errors } from './errors'
import { notify } from './notifications'
import { consumeRateLimit } from './rate-limit'
import { verifyTurnstile } from './turnstile'
import { eventRules } from '../rules'
import { registrationClosedEarly } from '@/lib/events'

const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

type Pool = {
  connect: () => Promise<{
    query: (q: string, v?: unknown[]) => Promise<unknown>
    release: () => void
  }>
}

/**
 * Serialise seat allocation for one event across all server instances with a
 * Postgres advisory lock, so two people can never take the last seat at once.
 */
async function withEventLock<T>(
  payload: Payload,
  eventId: number,
  fn: () => Promise<T>,
): Promise<T> {
  const pool = (payload.db as unknown as { pool: Pool }).pool
  const client = await pool.connect()
  try {
    await client.query('SELECT pg_advisory_lock($1, $2)', [7301, eventId])
    return await fn()
  } finally {
    await client.query('SELECT pg_advisory_unlock($1, $2)', [7301, eventId]).catch(() => undefined)
    client.release()
  }
}

export function eventPlaceLabel(e: {
  mode?: string | null
  venueName?: string | null
  venueAddress?: string | null
  district?: string | null
}) {
  if (e.mode === 'online') return 'অনলাইন (যোগ দেওয়ার লিংক ইমেইলে পাঠানো হবে)'
  return [e.venueName, e.venueAddress, e.district ? districtLabel(e.district) : null]
    .filter(Boolean)
    .join(', ')
}

export function eventWhenLabel(e: { startsAt: string; timeLabel?: string | null }) {
  return `${formatLongDate(e.startsAt)}, ${e.timeLabel || formatTime(e.startsAt)}`
}

function codeFor(startsAt: string, seq: number) {
  const d = new Date(startsAt)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: '2-digit',
  }).formatToParts(d)
  const dd = parts.find((p) => p.type === 'day')?.value ?? '00'
  const mm = parts.find((p) => p.type === 'month')?.value ?? '00'
  return `RH-${dd}${mm}-${String(seq).padStart(3, '0')}`
}

export type RegistrationResult = {
  code: string
  already: boolean
  seatsTaken: number
  capacity: number
}

/** Register for a majlis. Members are linked to their account; guests must pass Turnstile. */
export async function registerForEvent(
  ctx: ServiceContext,
  eventId: number,
  input: EventRegistrationInput,
): Promise<RegistrationResult> {
  const data = eventRegistrationSchema.parse(input)
  const phone = normalizeBdPhone(data.phone)!

  const [ipLimit, phoneLimit] = await Promise.all([
    consumeRateLimit(ctx.payload, `event-reg:ip:${ctx.ip ?? 'unknown'}`, 20, 60 * 60),
    consumeRateLimit(ctx.payload, `event-reg:phone:${phone}`, 10, 60 * 60),
  ])
  if (!ipLimit.allowed || !phoneLimit.allowed) throw errors.rateLimited()
  if (!ctx.user && !(await verifyTurnstile(data.turnstileToken, ctx.ip))) {
    throw errors.invalid('আপনি যে মানুষ, তা যাচাই করা যায়নি। আবার চেষ্টা করুন।', [
      { path: 'turnstileToken', message: 'যাচাই সম্পন্ন করুন।' },
    ])
  }

  const event = await ctx.payload.findByID({
    select: {
      status: true,
      registrationOpen: true,
      startsAt: true,
      endsAt: true,
      timeLabel: true,
      separateSeating: true,
      allowGuests: true,
      maxGuests: true,
      seatsTaken: true,
      capacity: true,
      slug: true,
      title: true,
      mode: true,
      venueName: true,
      venueAddress: true,
      district: true,
    },
    collection: 'events',
    id: eventId,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
  })
  if (!event || event.status !== 'published') throw errors.notFound('মজলিসটি পাওয়া যায়নি।')
  if (!event.registrationOpen) throw errors.conflict('এই মজলিসের রেজিস্ট্রেশন বন্ধ আছে।')
  if (new Date(event.endsAt ?? event.startsAt).getTime() < Date.now())
    throw errors.conflict('মজলিসটি শেষ হয়ে গেছে।')
  if (event.separateSeating && !data.seating)
    throw errors.invalid('বসার ব্যবস্থা বেছে নিন।', [
      { path: 'seating', message: 'বসার ব্যবস্থা বেছে নিন।' },
    ])
  const rules = await eventRules()
  if (registrationClosedEarly(event.startsAt, rules.closeRegistrationHoursBefore))
    throw errors.conflict(
      `মজলিস শুরুর ${rules.closeRegistrationHoursBefore} ঘণ্টা আগে রেজিস্ট্রেশন বন্ধ হয়ে গেছে।`,
    )
  const guests = event.allowGuests ? data.guests : 0
  // the event's own limit, else the মজলিস menu's rule (0: only the seats left)
  const maxGuests = event.maxGuests || rules.defaultMaxGuests || null
  if (maxGuests && guests > maxGuests)
    throw errors.invalid(`এই মজলিসে একজনের সাথে সর্বোচ্চ ${maxGuests} জন সঙ্গী আসতে পারেন।`, [
      { path: 'guests', message: `সর্বোচ্চ ${maxGuests} জন।` },
    ])

  const result = await withEventLock(ctx.payload, eventId, async () => {
    const existing = await ctx.payload.find({
      collection: 'event-registrations',
      where: {
        and: [
          { event: { equals: eventId } },
          { phone: { equals: phone } },
          { status: { equals: 'confirmed' } },
        ],
      },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs[0]) {
      return {
        code: existing.docs[0].code,
        already: true,
        seatsTaken: event.seatsTaken ?? 0,
        capacity: event.capacity,
      }
    }
    const { seatsTaken } = await eventSeats(ctx.payload, eventId)
    if (seatsTaken + 1 + guests > event.capacity) {
      const left = Math.max(0, event.capacity - seatsTaken)
      throw errors.conflict(
        left > 0
          ? `মাত্র ${left}টি আসন বাকি আছে। সঙ্গীর সংখ্যা কমিয়ে আবার চেষ্টা করুন।`
          : 'দুঃখিত, সব আসন পূর্ণ হয়ে গেছে।',
      )
    }
    const total = await ctx.payload.count({
      collection: 'event-registrations',
      where: { event: { equals: eventId } },
      overrideAccess: true,
    })
    let code = codeFor(event.startsAt, total.totalDocs + 1)
    const clash = await ctx.payload.count({
      collection: 'event-registrations',
      where: { code: { equals: code } },
      overrideAccess: true,
    })
    if (clash.totalDocs) code = `${code}-${eventId}`
    await ctx.payload.create({
      collection: 'event-registrations',
      data: {
        event: eventId,
        user: ctx.user?.id ?? null,
        code,
        name: data.name,
        phone,
        email: data.email || null,
        seating: data.seating ?? null,
        guests,
        status: 'confirmed',
      },
      overrideAccess: true,
      depth: 0,
    })
    const after = await recountEvent(ctx.payload, eventId)
    return { code, already: false, seatsTaken: after, capacity: event.capacity }
  })

  if (!result.already) {
    const url = `${SITE()}/events/${event.slug}`
    const email =
      data.email ||
      (ctx.user?.email && !ctx.user.email.endsWith('.phone.ruhama.local') ? ctx.user.email : null)
    if (email) {
      const { html, text } = emailTemplates.eventRegistered({
        name: data.name,
        title: event.title,
        when: eventWhenLabel(event),
        place: eventPlaceLabel(event),
        code: result.code,
        url,
        onlineNote:
          event.mode === 'online'
            ? 'অনলাইনে যোগ দেওয়ার লিংক মজলিসের আগের দিন ইমেইলে পাঠানো হবে।'
            : undefined,
      })
      await sendEmail({
        to: email,
        subject: `রেজিস্ট্রেশন নিশ্চিত: ${event.title}`,
        html,
        text,
        tags: [{ name: 'kind', value: 'event' }],
      })
    }
    if (ctx.user) {
      await notify(ctx.payload, {
        recipients: [ctx.user.id],
        kind: 'event',
        text: `“${event.title}” মজলিসে আপনার রেজিস্ট্রেশন নিশ্চিত হয়েছে। নম্বর: ${result.code}`,
        link: `/events/${event.slug}`,
      })
    }
  }
  return result
}

/** The signed-in member's registration for one event, if any. */
export async function myRegistration(ctx: ServiceContext, eventId: number) {
  if (!ctx.user) return { registered: false as const }
  const res = await ctx.payload.find({
    collection: 'event-registrations',
    where: {
      and: [
        { event: { equals: eventId } },
        { user: { equals: ctx.user.id } },
        { status: { equals: 'confirmed' } },
      ],
    },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const reg = res.docs[0]
  return reg
    ? { registered: true as const, code: reg.code, guests: reg.guests ?? 0 }
    : { registered: false as const }
}

/** Cancel the member's own registration and free the seats. */
export async function cancelRegistration(ctx: ServiceContext, eventId: number) {
  if (!ctx.user) throw errors.unauthorized()
  const res = await ctx.payload.find({
    collection: 'event-registrations',
    where: {
      and: [
        { event: { equals: eventId } },
        { user: { equals: ctx.user.id } },
        { status: { equals: 'confirmed' } },
      ],
    },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const reg = res.docs[0]
  if (!reg) throw errors.notFound('রেজিস্ট্রেশনটি পাওয়া যায়নি।')
  await withEventLock(ctx.payload, eventId, async () => {
    await ctx.payload.update({
      collection: 'event-registrations',
      id: reg.id,
      data: { status: 'cancelled' },
      overrideAccess: true,
      depth: 0,
    })
    await recountEvent(ctx.payload, eventId)
  })
  return { cancelled: true }
}

/** Calendar file for "ক্যালেন্ডারে যোগ করুন". */
export async function eventIcs(
  payload: Payload,
  slug: string,
): Promise<{ filename: string; body: string } | null> {
  const res = await payload.find({
    select: {
      slug: true,
      title: true,
      summary: true,
      startsAt: true,
      endsAt: true,
      mode: true,
      venueName: true,
      venueAddress: true,
      district: true,
    },
    collection: 'events',
    where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
    depth: 0,
    limit: 1,
  })
  const e = res.docs[0]
  if (!e) return null
  const stamp = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')
  const start = new Date(e.startsAt)
  const end = e.endsAt ? new Date(e.endsAt) : new Date(start.getTime() + 2 * 3600 * 1000)
  const esc = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
  const url = `${SITE()}/events/${e.slug}`
  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ruhama//Majlis//BN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:majlis-${e.id}@ruhama`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(e.title)}`,
    `DESCRIPTION:${esc(`${e.summary}\n\n${url}`)}`,
    `LOCATION:${esc(eventPlaceLabel(e))}`,
    `URL:${url}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(e.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  return { filename: `${e.slug}.ics`, body }
}

/**
 * Daily job: remind everyone registered for tomorrow's majlis (email, plus in-app for members).
 * Online events include the join link only here, never on the public page.
 */
export async function sendEventReminders(payload: Payload, now = new Date()) {
  const from = new Date(now.getTime() + 12 * 3600 * 1000).toISOString()
  const to = new Date(now.getTime() + 36 * 3600 * 1000).toISOString()
  const events = await payload.find({
    select: {
      slug: true,
      title: true,
      startsAt: true,
      timeLabel: true,
      mode: true,
      onlineUrl: true,
      venueName: true,
      venueAddress: true,
      district: true,
    },
    collection: 'events',
    where: {
      and: [
        { status: { equals: 'published' } },
        { startsAt: { greater_than_equal: from } },
        { startsAt: { less_than: to } },
      ],
    },
    depth: 0,
    limit: 50,
    pagination: false,
    overrideAccess: true,
  })
  let sent = 0
  for (const e of events.docs) {
    const regs = await payload.find({
      select: { name: true, email: true, user: true },
      collection: 'event-registrations',
      where: {
        and: [
          { event: { equals: e.id } },
          { status: { equals: 'confirmed' } },
          { reminderSentAt: { exists: false } },
        ],
      },
      depth: 0,
      limit: 2000,
      pagination: false,
      overrideAccess: true,
    })
    const url = `${SITE()}/events/${e.slug}`
    for (const r of regs.docs) {
      if (r.email) {
        const { html, text } = emailTemplates.eventReminder({
          name: r.name,
          title: e.title,
          when: eventWhenLabel(e),
          place: eventPlaceLabel(e),
          url,
          joinUrl: e.mode === 'online' ? (e.onlineUrl ?? null) : null,
        })
        await sendEmail({
          to: r.email,
          subject: `মনে করিয়ে দিচ্ছি: ${e.title}`,
          html,
          text,
          tags: [{ name: 'kind', value: 'event-reminder' }],
        })
      }
      if (r.user) {
        await notify(payload, {
          recipients: [typeof r.user === 'object' ? r.user.id : r.user],
          kind: 'event',
          text: `আগামীকাল “${e.title}” মজলিস। ${eventWhenLabel(e)}`,
          link: `/events/${e.slug}`,
        })
      }
      await payload.update({
        collection: 'event-registrations',
        id: r.id,
        data: { reminderSentAt: new Date().toISOString() },
        overrideAccess: true,
        depth: 0,
      })
      sent++
    }
    await payload.update({
      collection: 'events',
      id: e.id,
      data: { reminderSentAt: new Date().toISOString() },
      overrideAccess: true,
      depth: 0,
      context: { skipCounters: true, disableRevalidate: true },
    })
  }
  return { events: events.docs.length, sent }
}
