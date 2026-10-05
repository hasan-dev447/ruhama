import Link from 'next/link'

import { BrandMark } from '@/components/icons/brand-mark'

export function BrandLink({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" className="brand" aria-label="Ruhama, হোম পেজ" onClick={onClick}>
      <BrandMark className="brand__mark" />
      <span className="brand__word">Ruhama</span>
    </Link>
  )
}
