'use server'

import { actionContext, actionError } from '@/server/action-context'
import { checkQuiz, enroll, setLessonComplete, type QuizResult } from '@/server/services/learning'

import type { ActionResult } from './types'

export async function enrollAction(courseId: number): Promise<ActionResult<{ created: boolean }>> {
  try {
    const res = await enroll(await actionContext(), courseId)
    return { ok: true, data: { created: res.created } }
  } catch (err) {
    return actionError(err)
  }
}

export async function setLessonCompleteAction(
  lessonId: number,
  completed: boolean,
): Promise<
  ActionResult<{
    progress: number
    completedLessons: number
    total: number
    courseCompleted: boolean
  }>
> {
  try {
    const res = await setLessonComplete(await actionContext(), { lessonId, completed })
    return {
      ok: true,
      data: {
        progress: res.progress,
        completedLessons: res.completedLessons,
        total: res.total,
        courseCompleted: res.courseCompleted,
      },
    }
  } catch (err) {
    return actionError(err)
  }
}

export async function checkQuizAction(
  lessonId: number,
  answers: Record<string, number>,
): Promise<ActionResult<QuizResult>> {
  try {
    return { ok: true, data: await checkQuiz(await actionContext(), { lessonId, answers }) }
  } catch (err) {
    return actionError(err)
  }
}
