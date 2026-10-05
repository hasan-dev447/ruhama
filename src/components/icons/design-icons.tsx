/* Icons drawn specifically for Ruhama's design that have no Lucide equivalent. */

type Props = { className?: string }

/** Menu with a shorter last line, as in the header board. */
export function MenuIcon({ className = 'ic ic-lg' }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M10 17h10" />
    </svg>
  )
}

/** A ring with three beads: the local circles icon. */
export function CircleBeadsIcon({ className = 'ic ic-lg' }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="3" r="1.6" />
      <circle cx="20" cy="15" r="1.6" />
      <circle cx="5" cy="17" r="1.6" />
    </svg>
  )
}
