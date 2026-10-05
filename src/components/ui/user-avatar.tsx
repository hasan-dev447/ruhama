import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'

type Props = {
  name: string | null | undefined
  image?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  tone?: 'teal' | 'gold'
  ring?: boolean
  className?: string
}

/** Design `.avatar`: photo when available, otherwise Bangla initials. */
export function UserAvatar({ name, image, size = 'md', tone = 'teal', ring, className }: Props) {
  return (
    <span
      className={cn(
        'avatar',
        size === 'sm' && 'avatar-sm',
        size === 'lg' && 'avatar-lg',
        size === 'xl' && 'avatar-xl',
        tone === 'gold' && 'avatar--gold',
        ring && 'avatar--ring',
        className,
      )}
      aria-hidden="true"
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
      ) : (
        initials(name)
      )}
    </span>
  )
}
