import {
  BellRing,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  MessageCircleCheck,
  Users,
} from 'lucide-react'

import type { NotificationKind } from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'

const TONE: Partial<Record<NotificationKind, string>> = {
  event: 'notif-item__icon--gold',
  answer: 'notif-item__icon--green',
  review: 'notif-item__icon--gold',
}

export function NotifIcon({ kind }: { kind: NotificationKind }) {
  const Icon =
    kind === 'answer'
      ? MessageCircleCheck
      : kind === 'event'
        ? CalendarDays
        : kind === 'forum'
          ? Users
          : kind === 'course'
            ? BookOpen
            : kind === 'review'
              ? ClipboardCheck
              : BellRing
  return (
    <span className={cn('notif-item__icon', TONE[kind])}>
      <Icon className="ic" aria-hidden="true" />
    </span>
  )
}
