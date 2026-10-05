import { z } from 'zod'

/** Forum input rules, shared by the post dialogs (client) and the forum service (server). */
export const newThreadSchema = z.object({
  title: z
    .string()
    .trim()
    .min(8, 'শিরোনাম অন্তত ৮ অক্ষরের হতে হবে।')
    .max(180, 'শিরোনাম ১৮০ অক্ষরের মধ্যে লিখুন।'),
  categoryId: z.coerce.number().int().positive('একটি বিভাগ বেছে নিন।'),
  body: z.string().trim().min(20, 'বিস্তারিত অংশ অন্তত ২০ অক্ষরের হতে হবে।').max(8000),
  anonymous: z.boolean().default(false),
  agree: z.literal(true, { message: 'আলোচনার আদব মেনে চলার অঙ্গীকারে সম্মতি দিন।' }),
})

export const newPostSchema = z.object({
  threadId: z.coerce.number().int().positive(),
  parentId: z.coerce.number().int().positive().optional(),
  body: z.string().trim().min(2, 'উত্তর লিখুন।').max(6000, 'উত্তরটি ৬০০০ অক্ষরের মধ্যে লিখুন।'),
  reference: z.string().trim().max(120).optional(),
})

export const reportSchema = z.object({
  targetType: z.enum(['thread', 'post']),
  id: z.coerce.number().int().positive(),
  reason: z.enum(['disrespect', 'unsourced', 'partisan', 'spam']),
  note: z.string().trim().max(500).optional(),
})

export const moderateSchema = z.object({
  targetType: z.enum(['thread', 'post']),
  id: z.coerce.number().int().positive(),
  action: z.enum(['approve', 'hide', 'remove', 'restore', 'dismiss']),
  reason: z.string().trim().max(300).optional(),
  muteDays: z.coerce.number().int().min(0).max(90).optional(),
})
