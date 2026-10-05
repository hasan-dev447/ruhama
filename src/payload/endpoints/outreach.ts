import { contactSchema, volunteerSchema } from '@/lib/validation/forms'
import { newsletterSchema, subscribeNewsletter } from '@/server/services/newsletter'
import { submitContact, submitVolunteer } from '@/server/services/outreach'

import { readBody, v1 } from './helpers'

export const outreachEndpoints = [
  v1('post', '/volunteers', async (req, ctx) =>
    submitVolunteer(ctx, await readBody(req, volunteerSchema)),
  ),
  v1('post', '/contact', async (req, ctx) =>
    submitContact(ctx, await readBody(req, contactSchema)),
  ),
  v1('post', '/newsletter', async (req, ctx) =>
    subscribeNewsletter(ctx, await readBody(req, newsletterSchema)),
  ),
]
