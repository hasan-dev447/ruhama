import { z } from 'zod'

import {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/server/services/notifications'

import { param, query, v1 } from './helpers'

export const notificationEndpoints = [
  v1('get', '/me/notifications', async (req, ctx) => {
    const q = query(req)
    return listMyNotifications(ctx, {
      page: z.coerce.number().int().min(1).max(200).catch(1).parse(q.get('page')),
      limit: z.coerce.number().int().min(1).max(50).catch(30).parse(q.get('limit')),
      unreadOnly: q.get('unread') === '1',
    })
  }),
  v1('post', '/me/notifications/read-all', async (_req, ctx) => markAllNotificationsRead(ctx)),
  v1('post', '/me/notifications/:id/read', async (req, ctx) =>
    markNotificationRead(ctx, z.coerce.number().int().positive().parse(param(req, 'id'))),
  ),
]
