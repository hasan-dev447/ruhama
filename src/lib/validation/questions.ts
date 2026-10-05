import { z } from 'zod'

/** Shared by the ask form (client) and the Q&A service (server). */
export const askQuestionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(10, 'প্রশ্নটি অন্তত ১০ অক্ষরের হতে হবে।')
    .max(200, 'প্রশ্নটি ২০০ অক্ষরের মধ্যে লিখুন।'),
  body: z
    .string()
    .trim()
    .max(3000, 'বিস্তারিত অংশ ৩০০০ অক্ষরের মধ্যে লিখুন।')
    .optional()
    .default(''),
  categoryId: z.coerce
    .number({ message: 'একটি বিষয় বেছে নিন।' })
    .int()
    .positive('একটি বিষয় বেছে নিন।'),
  anonymous: z.boolean().default(true),
})

export type AskQuestionInput = z.input<typeof askQuestionSchema>

export const voteSchema = z.object({
  questionId: z.coerce.number().int().positive(),
  value: z.enum(['helpful', 'unclear']),
})
