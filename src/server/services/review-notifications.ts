import type { PayloadRequest } from 'payload'

import type { ReviewStatus } from '@/payload/workflow/constants'

import { notify, usersWithRoles } from './notifications'

type Collection = 'articles' | 'ikhtilaf-topics' | 'questions'

const LABEL: Record<Collection, string> = {
  articles: 'প্রবন্ধ',
  'ikhtilaf-topics': 'মতপার্থক্যের বিষয়',
  questions: 'প্রশ্নের উত্তর',
}

const idOf = (v: unknown) =>
  v && typeof v === 'object' && 'id' in v
    ? (v as { id: number | string }).id
    : (v as number | string | null)

function adminLink(collection: Collection, id: number | string) {
  return `/admin/collections/${collection}/${id}`
}

function publicLink(collection: Collection, slug: string) {
  if (collection === 'articles') return `/ilm/${slug}`
  if (collection === 'ikhtilaf-topics') return `/ikhtilaf/${slug}`
  return `/qa/${slug}`
}

/** Notify authors, reviewers and publishers when a document moves through review. */
export async function notifyReviewTransition(params: {
  req: PayloadRequest
  collection: Collection
  doc: Record<string, unknown>
  from: ReviewStatus | null
  to: ReviewStatus
}) {
  const { req, collection, doc, to } = params
  const payload = req.payload
  const title = String(doc.title ?? '')
  const id = doc.id as number | string
  const author = idOf(doc.createdBy)
  const actorId = req.user?.id ?? null
  const label = LABEL[collection]

  if (to === 'in_review') {
    const assigned = ((doc.assignedReviewers as unknown[]) ?? []).map(idOf).filter(Boolean) as (
      number | string
    )[]
    const recipients = assigned.length ? assigned : await usersWithRoles(payload, ['reviewer'], req)
    await notify(
      payload,
      {
        recipients,
        kind: 'review',
        text: `নতুন ${label} রিভিউর অপেক্ষায়: “${title}”`,
        link: adminLink(collection, id),
        emailSubject: `রিভিউর অনুরোধ: ${title}`,
        actorId,
      },
      req,
    )
  }

  if (to === 'needs_changes' && author) {
    const last = ((doc.approvals as { note?: string | null }[]) ?? []).at(-1)
    await notify(
      payload,
      {
        recipients: [author],
        kind: 'review',
        text: `আপনার ${label} “${title}” এ পরিবর্তন প্রয়োজন।${last?.note ? ` রিভিউয়ারের মন্তব্য: ${last.note}` : ''}`,
        link: adminLink(collection, id),
        emailSubject: `পরিবর্তন প্রয়োজন: ${title}`,
        actorId,
      },
      req,
    )
  }

  if (to === 'approved') {
    const publishers = await usersWithRoles(payload, ['shura', 'super_admin'], req)
    await notify(
      payload,
      {
        recipients: [...(author ? [author] : []), ...publishers],
        kind: 'review',
        text: `“${title}” দুইজন রিভিউয়ারের অনুমোদন পেয়েছে, এখন প্রকাশের অপেক্ষায়।`,
        link: adminLink(collection, id),
        emailSubject: `অনুমোদিত: ${title}`,
        actorId,
      },
      req,
    )
  }

  if (to === 'published') {
    const slug = String(doc.slug ?? '')
    if (author) {
      await notify(
        payload,
        {
          recipients: [author],
          kind: 'review',
          text: `আপনার ${label} “${title}” প্রকাশিত হয়েছে।`,
          link: publicLink(collection, slug),
          emailSubject: `প্রকাশিত: ${title}`,
          actorId,
        },
        req,
      )
    }
    if (collection === 'questions') {
      const asker = idOf(doc.askedBy)
      if (asker) {
        await notify(
          payload,
          {
            recipients: [asker],
            kind: 'answer',
            text: `আপনার প্রশ্ন “${title}” এর উত্তর প্রকাশিত হয়েছে।`,
            link: publicLink(collection, slug),
            emailSubject: 'আপনার প্রশ্নের উত্তর প্রকাশিত হয়েছে',
          },
          req,
        )
      }
    }
  }
}
