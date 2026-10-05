'use server'

import { headers } from 'next/headers'

import type { AskQuestionInput } from '@/lib/validation/questions'
import { actionContext, actionError } from '@/server/action-context'
import { askQuestion, voteAnswer } from '@/server/services/questions'

import type { ActionResult } from './types'

export async function askQuestionAction(
  input: AskQuestionInput,
): Promise<ActionResult<{ id: number }>> {
  try {
    const ctx = await actionContext()
    const res = await askQuestion(ctx, input)
    return { ok: true, data: { id: Number(res.id) } }
  } catch (err) {
    return actionError(err)
  }
}

export async function voteAnswerAction(
  questionId: number,
  value: 'helpful' | 'unclear',
): Promise<ActionResult<{ value: string }>> {
  try {
    const ctx = await actionContext()
    const ua = (await headers()).get('user-agent') ?? ''
    const res = await voteAnswer(ctx, { questionId, value }, ua)
    return { ok: true, data: { value: res.value } }
  } catch (err) {
    return actionError(err)
  }
}
