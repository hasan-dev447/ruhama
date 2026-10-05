'use server'

import { revalidateTag } from 'next/cache'
import type { z } from 'zod'

import { actionContext, actionError } from '@/server/action-context'
import { TAGS } from '@/server/cache/tags'
import {
  createPost,
  createThread,
  markHelpfulAnswer,
  moderate,
  reportContent,
  softDelete,
  toggleHelpful,
  type moderateSchema,
  type newPostSchema,
  type newThreadSchema,
  type reportSchema,
} from '@/server/services/forum'

import type { ActionResult } from './types'

/** Thread pages and lists are cached; refresh them right after a visible change. */
function refresh(threadId?: number) {
  revalidateTag(TAGS.collection('forum-threads'), { expire: 0 })
  if (threadId) revalidateTag(TAGS.doc('forum-threads', threadId), { expire: 0 })
}

export async function createThreadAction(
  input: z.input<typeof newThreadSchema>,
): Promise<ActionResult<{ id: number; slug: string | null; status: string }>> {
  try {
    const res = await createThread(await actionContext(), input)
    if (res.status === 'published') refresh(Number(res.id))
    return { ok: true, data: { id: Number(res.id), slug: res.slug, status: res.status } }
  } catch (err) {
    return actionError(err)
  }
}

export async function createPostAction(
  input: z.input<typeof newPostSchema>,
): Promise<ActionResult<{ id: number; status: string }>> {
  try {
    const res = await createPost(await actionContext(), input)
    if (res.status === 'published') refresh(Number(input.threadId))
    return { ok: true, data: { id: Number(res.id), status: res.status } }
  } catch (err) {
    return actionError(err)
  }
}

export async function toggleHelpfulAction(
  postId: number,
  threadId: number,
): Promise<ActionResult<{ helpful: boolean; count: number }>> {
  try {
    const res = await toggleHelpful(await actionContext(), postId)
    refresh(threadId)
    return { ok: true, data: res }
  } catch (err) {
    return actionError(err)
  }
}

export async function markHelpfulAnswerAction(
  postId: number,
  threadId: number,
): Promise<ActionResult<{ helpfulPost: number | null }>> {
  try {
    const res = await markHelpfulAnswer(await actionContext(), postId)
    refresh(threadId)
    return { ok: true, data: res }
  } catch (err) {
    return actionError(err)
  }
}

export async function reportContentAction(
  input: z.input<typeof reportSchema>,
  threadId: number,
): Promise<ActionResult<{ hidden: boolean }>> {
  try {
    const res = await reportContent(await actionContext(), input)
    if (res.hidden) refresh(threadId)
    return { ok: true, data: { hidden: res.hidden } }
  } catch (err) {
    return actionError(err)
  }
}

export async function softDeleteAction(
  targetType: 'thread' | 'post',
  id: number,
  threadId: number,
): Promise<ActionResult> {
  try {
    await softDelete(await actionContext(), targetType, id)
    refresh(threadId)
    return { ok: true }
  } catch (err) {
    return actionError(err)
  }
}

export async function moderateAction(
  input: z.input<typeof moderateSchema>,
  threadId: number,
): Promise<ActionResult<{ status: string }>> {
  try {
    const res = await moderate(await actionContext(), input)
    refresh(threadId)
    return { ok: true, data: res }
  } catch (err) {
    return actionError(err)
  }
}
