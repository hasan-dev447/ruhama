import { cn } from '@/lib/utils'

const MARK_PATH =
  'M24 5Q32.78 20.36 37.43 37.43Q20.36 32.78 5 24Q20.36 15.22 37.43 10.57Q32.78 27.64 24 43Q15.22 27.64 10.57 10.57Q27.64 15.22 43 24Q27.64 32.78 10.57 37.43Q15.22 20.36 24 5Z'

/** The Ruhama eight-point mark. Inherits colour from `currentColor`. */
export function BrandMark({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg className={cn('mark', className)} viewBox="0 0 48 48" aria-hidden="true" style={style}>
      <path d={MARK_PATH} />
    </svg>
  )
}
