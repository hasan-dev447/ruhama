import { z } from 'zod'

import { normalizeBdPhone } from '@/lib/phone'

/** Event registration form, shared by the client form and the events service. */
export const eventRegistrationSchema = z.object({
  name: z.string().trim().min(2, 'পূর্ণ নাম লিখুন।').max(80, 'নামটি ৮০ অক্ষরের মধ্যে লিখুন।'),
  phone: z
    .string()
    .trim()
    .refine((v) => normalizeBdPhone(v) !== null, 'সঠিক মোবাইল নম্বর দিন, যেমন: ০১৭১২৩৪৫৬৭৮'),
  email: z
    .union([
      z.literal(''),
      z.string().trim().toLowerCase().email('সঠিক ইমেইল ঠিকানা দিন।').max(200),
    ])
    .optional(),
  seating: z.enum(['brothers', 'sisters']).optional(),
  guests: z.coerce.number().int().min(0).max(3).default(0),
  turnstileToken: z.string().max(4096).optional(),
})

export type EventRegistrationInput = z.input<typeof eventRegistrationSchema>
