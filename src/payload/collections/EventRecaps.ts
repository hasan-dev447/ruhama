import { APIError, type CollectionConfig, type PayloadRequest } from 'payload'

import { eventEnded } from '@/lib/events'
import { hasRole, STAFF_ROLES } from '@/lib/roles'
import { TAGS } from '@/server/cache/tags'
import { endedWhere } from '@/server/queries/events'
import { notify } from '@/server/services/notifications'

import { menuAccess, menuRead } from '../access/permissions'
import { safeRevalidate } from '../hooks/revalidate'
import { parseYouTubeId, YOUTUBE_FIELD } from './Videos'
import { recapRules } from '@/server/rules'

const idOf = (v: unknown) =>
  v && typeof v === 'object' && 'id' in v ? (v as { id: number }).id : (v as number | null)

type EventLite = {
  id: number
  title: string
  slug?: string | null
  startsAt: string
  endsAt?: string | null
}

async function loadEvent(req: PayloadRequest, id: number | null) {
  if (!id) return null
  return (await req.payload.findByID({
    collection: 'events',
    id,
    depth: 0,
    select: { title: true, slug: true, startsAt: true, endsAt: true },
    overrideAccess: true,
    disableErrors: true,
    req,
  })) as EventLite | null
}

/** Members who registered (and did not cancel), told once when the recap is first published. */
async function notifyRegistrants(req: PayloadRequest, event: EventLite) {
  const regs = await req.payload.find({
    collection: 'event-registrations',
    where: { and: [{ event: { equals: event.id } }, { status: { not_equals: 'cancelled' } }] },
    select: { user: true },
    depth: 0,
    limit: 2000,
    pagination: false,
    overrideAccess: true,
    req,
  })
  const recipients = regs.docs.map((r) => idOf(r.user)).filter(Boolean) as number[]
  if (!recipients.length) return
  await notify(
    req.payload,
    {
      recipients,
      kind: 'event',
      text: `“${event.title}” মজলিসে কী হয়েছিল, ছবি ও ভিডিওসহ দেখুন।`,
      link: `/events/${event.slug}#recap`,
      actorId: req.user?.id,
    },
    req,
  )
}

/**
 * What happened at a মজলিস that is over: a short summary, the full write-up, photos and YouTube
 * recordings, for those who could not attend. One per মজলিস, added only after it has ended, by the
 * event staff (super admin, shura, editor, moderator); a draft until published.
 */
export const EventRecaps: CollectionConfig = {
  slug: 'event-recaps',
  labels: { singular: 'মজলিসের সারসংক্ষেপ', plural: 'মজলিসের সারসংক্ষেপ' },
  admin: {
    group: 'মজলিস ও সার্কেল',
    useAsTitle: 'title',
    defaultColumns: ['title', 'eventDate', 'attendance', '_status', 'updatedAt'],
    description:
      'শেষ হয়ে যাওয়া মজলিসে কী হয়েছিল: লেখা, ছবি ও ভিডিও। যাঁরা আসতে পারেননি তাঁরা মজলিসের পেজে দেখবেন। প্রকাশ করলে রেজিস্টার করা সদস্যরা নোটিফিকেশন পান।',
    hidden: ({ user }) => !hasRole(user, ...STAFF_ROLES),
    components: {
      beforeList: ['@/payload/components/pending-recaps#PendingRecaps'],
    },
  },
  defaultSort: '-eventDate',
  versions: { drafts: true, maxPerDoc: 20 },
  access: {
    read: menuRead('event-recaps', { publicWhere: { _status: { equals: 'published' } } }),
    ...menuAccess('event-recaps'),
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const event = await loadEvent(req, idOf(data.event ?? originalDoc?.event))
        if (!event) throw new APIError('মজলিসটি পাওয়া যায়নি', 400, undefined, true)
        if (!eventEnded(event))
          throw new APIError('মজলিস শেষ হওয়ার পরেই সারসংক্ষেপ যোগ করা যায়।', 400, undefined, true)
        data.title = event.title
        data.eventDate = event.startsAt
        if (Array.isArray(data.videos))
          data.videos = data.videos.map((v: { url?: string }) => ({
            ...v,
            youtubeId: v.url ? parseYouTubeId(v.url) : null,
          }))
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, context }) => {
        if (context.recapNotified) return doc
        const event = await loadEvent(req, idOf(doc.event))
        safeRevalidate([
          TAGS.home,
          TAGS.collection('events'),
          TAGS.collection('event-recaps'),
          ...(event ? [TAGS.doc('events', event.id)] : []),
          ...(event?.slug ? [TAGS.doc('events', event.slug)] : []),
        ])
        // the first time it goes public, tell the people who registered
        if (
          event &&
          doc._status === 'published' &&
          previousDoc?._status !== 'published' &&
          !doc.notifiedAt &&
          (await recapRules()).notifyRegistrants
        ) {
          await notifyRegistrants(req, event).catch((err) =>
            req.payload.logger.error({ err }, 'recap notification failed'),
          )
          await req.payload.update({
            collection: 'event-recaps',
            id: doc.id,
            data: { notifiedAt: new Date().toISOString() },
            overrideAccess: true,
            context: { recapNotified: true },
            req,
          })
        }
        return doc
      },
    ],
    afterDelete: [
      ({ doc }) => {
        safeRevalidate([TAGS.home, TAGS.collection('events'), TAGS.collection('event-recaps')])
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'event',
      label: 'মজলিস',
      type: 'relationship',
      relationTo: 'events',
      required: true,
      unique: true,
      index: true,
      filterOptions: () => endedWhere(),
      admin: {
        description:
          'শুধু শেষ হয়ে যাওয়া প্রকাশিত মজলিস দেখাবে। প্রতিটি মজলিসের একটিই সারসংক্ষেপ।',
      },
    },
    {
      name: 'summary',
      label: 'সংক্ষেপে কী হয়েছিল',
      type: 'textarea',
      required: true,
      maxLength: 400,
      admin: { description: 'দুই-তিন লাইনে। মজলিসের পেজে উপরে আর তালিকায় দেখাবে।' },
    },
    {
      name: 'attendance',
      label: 'কতজন উপস্থিত ছিলেন (ঐচ্ছিক)',
      type: 'number',
      min: 0,
      admin: { step: 1 },
    },
    { name: 'content', label: 'বিস্তারিত', type: 'richText' },
    {
      name: 'gallery',
      label: 'ছবি',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: { description: 'মজলিসের ছবি। মুখ দেখা যায় এমন ছবিতে সংশ্লিষ্টদের সম্মতি নিন।' },
    },
    {
      name: 'videos',
      label: 'ভিডিও (YouTube)',
      type: 'array',
      labels: { singular: 'ভিডিও', plural: 'ভিডিও' },
      admin: {
        description:
          'YouTube লিংক দিন। চ্যানেলে না দেখাতে চাইলে ভিডিওটি Unlisted রাখুন, Private ভিডিও সাইটে চলে না।',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'url',
              label: 'YouTube লিংক',
              type: 'text',
              required: true,
              validate: (v: unknown) =>
                typeof v === 'string' && parseYouTubeId(v) ? true : 'সঠিক YouTube লিংক দিন',
              admin: {
                width: '50%',
                components: {
                  Field: {
                    path: YOUTUBE_FIELD,
                    clientProps: { store: 'url', titleField: 'title' },
                  },
                },
              },
            },
            { name: 'title', label: 'শিরোনাম (ঐচ্ছিক)', type: 'text', admin: { width: '50%' } },
          ],
        },
        { name: 'youtubeId', type: 'text', admin: { hidden: true } },
      ],
    },
    // kept in step with the মজলিস by the hook above, for the list and sorting
    {
      name: 'title',
      label: 'মজলিস',
      type: 'text',
      admin: { readOnly: true, condition: () => false },
    },
    {
      name: 'eventDate',
      label: 'মজলিসের তারিখ',
      type: 'date',
      index: true,
      admin: { readOnly: true, condition: () => false },
    },
    { name: 'notifiedAt', type: 'date', admin: { hidden: true } },
  ],
}
