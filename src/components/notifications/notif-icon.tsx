import {
  IconAnswered,
  IconBook,
  IconCalendar,
  IconReminder,
  IconReview,
  IconUsers,
} from '@/components/icons'

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
      ? IconAnswered
      : kind === 'event'
        ? IconCalendar
        : kind === 'forum'
          ? IconUsers
          : kind === 'course'
            ? IconBook
            : kind === 'review'
              ? IconReview
              : IconReminder
  return (
    <span className={cn('notif-item__icon', TONE[kind])}>
      <Icon className="ic" aria-hidden="true" />
    </span>
  )
}
