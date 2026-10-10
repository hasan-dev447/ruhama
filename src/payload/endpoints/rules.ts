import type { Endpoint } from 'payload'

import { COLLECTION_RULES, resolveRules } from '@/lib/collection-rules'
import { canEnterAdmin, hasLevel, levelOf } from '@/server/permissions'
import { getRules, getWorkflowRules, invalidateRules } from '@/server/rules'
import { errors } from '@/server/services/errors'

import { param, readBody, v1 } from './helpers'
import { z } from 'zod'

const known = (slug: string) => {
  if (!COLLECTION_RULES[slug]) throw errors.notFound('এই মেনুর কোনো নিয়ম নেই।')
  return slug
}

/** /api/v1/rules/:slug: one admin menu's rules, read by staff and changed by শূরা and super admin. */
export const rulesEndpoints: Endpoint[] = [
  v1('get', '/rules/:slug', async (req, ctx) => {
    if (!(await canEnterAdmin(ctx.user))) throw errors.forbidden()
    const slug = known(param(req, 'slug'))
    return {
      // reviewers and publishers as set on the রোল ও অনুমতি page
      values: COLLECTION_RULES[slug].rules.some((r) => r.managedByRoles)
        ? await getWorkflowRules(slug)
        : await getRules(slug),
      canEdit: await hasLevel(ctx.user, 'collection-rules', 'edit'),
      myLevel: await levelOf(ctx.user, slug),
    }
  }),

  // only this menu's part is replaced; the global's hook cleans it and writes the audit log
  v1('post', '/rules/:slug', async (req, ctx) => {
    if (!(await hasLevel(ctx.user, 'collection-rules', 'edit')))
      throw errors.forbidden('নিয়ম বদলানোর অনুমতি আপনার নেই।')
    const slug = known(param(req, 'slug'))
    const { values } = await readBody(req, z.object({ values: z.record(z.string(), z.unknown()) }))
    const current = (await req.payload.findGlobal({
      slug: 'collection-rules',
      depth: 0,
      overrideAccess: true,
    })) as { rules?: Record<string, unknown> | null }
    await req.payload.updateGlobal({
      slug: 'collection-rules',
      data: { rules: { ...(current.rules ?? {}), [slug]: resolveRules(slug, values) } },
      depth: 0,
      user: ctx.user,
      overrideAccess: false,
      req,
    })
    invalidateRules()
    return {
      values: COLLECTION_RULES[slug].rules.some((r) => r.managedByRoles)
        ? await getWorkflowRules(slug)
        : await getRules(slug),
      canEdit: true,
    }
  }),
]
