import { z } from 'zod'

import { askQuestionSchema, voteSchema } from '@/lib/validation/questions'
import {
  checkQuiz,
  completeLessonSchema,
  courseProgress,
  enroll,
  myEnrollments,
  quizSchema,
  setLessonComplete,
} from '@/server/services/learning'
import { askQuestion, voteAnswer } from '@/server/services/questions'

import { param, readBody, v1 } from './helpers'

const id = z.coerce.number().int().positive()

export const learningEndpoints = [
  v1('get', '/me/enrollments', async (_req, ctx) => ({ docs: await myEnrollments(ctx) })),
  v1('get', '/me/courses/:id/progress', async (req, ctx) =>
    courseProgress(ctx, id.parse(param(req, 'id'))),
  ),
  v1('post', '/courses/:id/enroll', async (req, ctx) => enroll(ctx, id.parse(param(req, 'id')))),
  v1('post', '/lessons/:id/complete', async (req, ctx) => {
    const body = await readBody(req, completeLessonSchema.omit({ lessonId: true }))
    return setLessonComplete(ctx, {
      lessonId: id.parse(param(req, 'id')),
      completed: body.completed,
    })
  }),
  v1('post', '/lessons/:id/quiz', async (req, ctx) => {
    const body = await readBody(req, quizSchema.omit({ lessonId: true }))
    return checkQuiz(ctx, { lessonId: id.parse(param(req, 'id')), answers: body.answers })
  }),
]

export const questionEndpoints = [
  v1('post', '/questions', async (req, ctx) =>
    askQuestion(ctx, await readBody(req, askQuestionSchema)),
  ),
  v1('post', '/questions/:id/vote', async (req, ctx) => {
    const body = await readBody(req, voteSchema.omit({ questionId: true }))
    return voteAnswer(
      ctx,
      { questionId: id.parse(param(req, 'id')), value: body.value },
      req.headers.get('user-agent') ?? '',
    )
  }),
]
