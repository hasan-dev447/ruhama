'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiFetch } from '@/lib/api-client'
import { fallbackInterval, useBroadcast } from '@/hooks/use-realtime'

export type NotificationKind = 'answer' | 'event' | 'forum' | 'course' | 'review' | 'system'

export type NotificationItem = {
  id: string
  kind: NotificationKind
  text: string
  link: string | null
  read: boolean
  createdAt: string
}

export type NotificationPage = {
  docs: NotificationItem[]
  unreadCount: number
  hasNextPage: boolean
  nextPage: number | null
  totalDocs: number
}

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params: Record<string, unknown>) => ['notifications', params] as const,
}

export function useNotificationsPreview(userId: string | null) {
  const qc = useQueryClient()
  useBroadcast(userId ? `user:${userId}` : null, 'notification', () => {
    void qc.invalidateQueries({ queryKey: notificationKeys.all })
  })
  return useQuery({
    queryKey: notificationKeys.list({ limit: 5 }),
    queryFn: () => apiFetch<NotificationPage>('/me/notifications?limit=5'),
    enabled: Boolean(userId),
    staleTime: 30_000,
    refetchInterval: fallbackInterval(60_000),
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: true }>(`/me/notifications/${id}/read`, { method: 'POST' }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: notificationKeys.all })
      const snapshots = qc.getQueriesData<NotificationPage>({ queryKey: notificationKeys.all })
      for (const [key, page] of snapshots) {
        if (!page?.docs) continue
        const target = page.docs.find((n) => n.id === id)
        qc.setQueryData<NotificationPage>(key, {
          ...page,
          unreadCount: Math.max(0, page.unreadCount - (target && !target.read ? 1 : 0)),
          docs: page.docs.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })
      }
      return { snapshots }
    },
    onError: (_e, _id, ctx) => ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<{ ok: true }>('/me/notifications/read-all', { method: 'POST' }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: notificationKeys.all })
      const snapshots = qc.getQueriesData<NotificationPage>({ queryKey: notificationKeys.all })
      for (const [key, page] of snapshots) {
        if (!page?.docs) continue
        qc.setQueryData<NotificationPage>(key, {
          ...page,
          unreadCount: 0,
          docs: page.docs.map((n) => ({ ...n, read: true })),
        })
      }
      return { snapshots }
    },
    onError: (_e, _v, ctx) => ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}
