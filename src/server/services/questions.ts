import { createHash } from 'node:crypto'

import type { z } from 'zod'

import { EDITOR_ROLES, MODERATOR_ROLES } from '@/lib/roles'
import { askQuestionSchema, voteSchema } from '@/lib/validation/questions'

import type { ServiceContext } from './context'
import { requireUser } from './context'
import { errors } from './errors'
import { notify, usersWithRoles } from './notifications'
import { consumeRateLimit } from './rate-limit'

/** A member submits a question. It stays private (draft, pending moderation) until answered and approved. */
export async function askQuestion(ctx: ServiceContext, input: z.input<typeof askQuestionSchema>) {
  const user = requireUser(ctx)
  const data = askQuestionSchema.parse(input)

  const limit = await consumeRateLimit(ctx.payload, `qa:ask:user:${user.id}`, 5, 24 * 60 * 60)
  if (!limit.allowed)
    throw errors.rateLimited('আজ আর প্রশ্ন জমা দেওয়া যাবে না। আগামীকাল আবার চেষ্টা করুন।')

  const category = await ctx.payload.findByID({
    collection: 'categories',
    id: data.categoryId,
    depth: 0,
    select: { usedFor: true },
    overrideAccess: true,
    disableErrors: true,
  })
  if (!category || !(category.usedFor ?? []).includes('questions'))
    throw errors.invalid('একটি বিষয় বেছে নিন।', [
      { path: 'categoryId', message: 'বিষয়টি সঠিক নয়।' },
    ])

  const doc = await ctx.payload.create({
    collection: 'questions',
    draft: true,
    data: {
      title: data.title,
      body: data.body || undefined,
      category: data.categoryId,
      anonymous: data.anonymous,
      askedBy: user.id,
      askerDistrict: user.district ?? undefined,
      moderation: 'pending',
      _status: 'draft',
    },
    overrideAccess: true,
    context: { questionIntake: true, skipCounters: true },
    depth: 0,
  })

  const staff = await usersWithRoles(ctx.payload, [
    ...new Set([...MODERATOR_ROLES, ...EDITOR_ROLES]),
  ])
  await notify(ctx.payload, {
    recipients: staff,
    kind: 'review',
    text: `নতুন প্রশ্ন জমা পড়েছে: “${data.title}”`,
    link: `/admin/collections/questions/${doc.id}`,
    actorId: user.id,
  })

  return { id: doc.id }
}

/** "উত্তরটি কি উপকারী ছিল?" One vote per member (or per anonymous visitor), changeable. */
export async function voteAnswer(
  ctx: ServiceContext,
  input: z.input<typeof voteSchema>,
  visitorSeed?: string,
) {
  const { questionId, value } = voteSchema.parse(input)
  const voterKey = ctx.user
    ? `u:${ctx.user.id}`
    : `v:${createHash('sha256')
        .update(`${ctx.ip ?? ''}|${visitorSeed ?? ''}`)
        .digest('hex')
        .slice(0, 32)}`

  const limit = await consumeRateLimit(ctx.payload, `qa:vote:${voterKey}`, 30, 60 * 60)
  if (!limit.allowed) throw errors.rateLimited()

  const question = await ctx.payload.findByID({
    collection: 'questions',
    id: questionId,
    depth: 0,
    select: { _status: true },
    overrideAccess: true,
    disableErrors: true,
  })
  if (!question || question._status !== 'published')
    throw errors.notFound('প্রশ্নটি পাওয়া যায়নি।')

  const existing = await ctx.payload.find({
    collection: 'answer-votes',
    where: { and: [{ question: { equals: questionId } }, { voterKey: { equals: voterKey } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (existing.docs[0]) {
    if (existing.docs[0].value !== value) {
      await ctx.payload.update({
        collection: 'answer-votes',
        id: existing.docs[0].id,
        data: { value },
        overrideAccess: true,
      })
    }
  } else {
    await ctx.payload.create({
      collection: 'answer-votes',
      data: { question: questionId, voterKey, value },
      overrideAccess: true,
    })
  }

  const [yes, no] = await Promise.all([
    ctx.payload.count({
      collection: 'answer-votes',
      where: { and: [{ question: { equals: questionId } }, { value: { equals: 'helpful' } }] },
      overrideAccess: true,
    }),
    ctx.payload.count({
      collection: 'answer-votes',
      where: { and: [{ question: { equals: questionId } }, { value: { equals: 'unclear' } }] },
      overrideAccess: true,
    }),
  ])
  // counters only: write straight to the row so votes never create content versions or trigger revalidation
  await ctx.payload.db.updateOne({
    collection: 'questions',
    id: questionId,
    data: { helpfulYes: yes.totalDocs, helpfulNo: no.totalDocs },
  })
  return { value, helpfulYes: yes.totalDocs, helpfulNo: no.totalDocs }
}
