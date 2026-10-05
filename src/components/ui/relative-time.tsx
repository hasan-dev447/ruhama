import { formatDate, formatRelative, valid } from '@/lib/format'

/**
 * "৭ ঘণ্টা আগে" inside a <time> element. Cached HTML can be minutes old when it hydrates,
 * so the text may legitimately differ from the server render; the warning is suppressed for this node only.
 */
export function RelativeTime({
  value,
  className,
}: {
  value: string | Date | number | null | undefined
  className?: string
}) {
  if (value == null || !valid(value)) return null
  const d = new Date(value)
  return (
    <time
      dateTime={d.toISOString()}
      title={formatDate(d)}
      className={className}
      suppressHydrationWarning
    >
      {formatRelative(d)}
    </time>
  )
}
