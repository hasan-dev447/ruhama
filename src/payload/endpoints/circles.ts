import { z } from 'zod'

import {
  cancelJoinRequest,
  joinCircleSchema,
  myCircleState,
  requestToJoinCircle,
  toggleMeetupRsvp,
} from '@/server/services/circles'

import { param, readBody, v1 } from './helpers'

const id = z.coerce.number().int().positive()

export const circleEndpoints = [
  v1('get', '/me/circles/:id', async (req, ctx) => myCircleState(ctx, id.parse(param(req, 'id')))),
  v1('post', '/circles/:id/join', async (req, ctx) =>
    requestToJoinCircle(ctx, id.parse(param(req, 'id')), await readBody(req, joinCircleSchema)),
  ),
  v1('post', '/circles/:id/cancel', async (req, ctx) =>
    cancelJoinRequest(ctx, id.parse(param(req, 'id'))),
  ),
  v1('post', '/meetups/:id/rsvp', async (req, ctx) =>
    toggleMeetupRsvp(ctx, id.parse(param(req, 'id'))),
  ),
]
