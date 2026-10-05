import { z } from 'zod'

import { DISTRICT_VALUES } from '@/lib/districts'
import { CONTACT_TOPICS, INTEREST_OPTIONS } from '@/lib/options'
import { normalizeBdPhone } from '@/lib/phone'

const optionalEmail = z
  .union([z.literal(''), z.string().trim().toLowerCase().email('সঠিক ইমেইল ঠিকানা দিন।').max(200)])
  .optional()

/** "যুক্ত হওয়ার ফর্ম" on /join. */
export const volunteerSchema = z.object({
  name: z.string().trim().min(2, 'পূর্ণ নাম লিখুন।').max(80),
  phone: z
    .string()
    .trim()
    .refine((v) => normalizeBdPhone(v) !== null, 'সঠিক মোবাইল নম্বর দিন, যেমন: ০১৭১২৩৪৫৬৭৮'),
  email: optionalEmail,
  district: z.enum(DISTRICT_VALUES, { message: 'জেলা নির্বাচন করুন।' }),
  interests: z
    .array(z.enum(INTEREST_OPTIONS.map((o) => o.value) as [string, ...string[]]))
    .max(5)
    .default([]),
  message: z.string().trim().max(1000, 'বার্তাটি ১০০০ অক্ষরের মধ্যে লিখুন।').optional().default(''),
  pledge: z.literal(true, { message: 'ঘোষণাপত্রের অঙ্গীকারে সম্মতি দিন।' }),
  turnstileToken: z.string().max(4096).optional(),
})
export type VolunteerInput = z.input<typeof volunteerSchema>

/** Contact form on /contact. */
export const contactSchema = z.object({
  name: z.string().trim().min(2, 'নাম লিখুন।').max(80),
  email: z.string().trim().toLowerCase().email('সঠিক ইমেইল ঠিকানা দিন।').max(200),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || normalizeBdPhone(v) !== null, 'সঠিক মোবাইল নম্বর দিন।'),
  topic: z.enum(CONTACT_TOPICS.map((o) => o.value) as [string, ...string[]]).default('general'),
  subject: z.string().trim().min(3, 'শিরোনাম লিখুন।').max(140),
  message: z.string().trim().min(10, 'বার্তাটি একটু বিস্তারিত লিখুন।').max(4000),
  turnstileToken: z.string().max(4096).optional(),
})
export type ContactInput = z.input<typeof contactSchema>
