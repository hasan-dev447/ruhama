import Link from 'next/link'

import { BrandMark } from '@/components/icons/brand-mark'
import { cn } from '@/lib/utils'

export function AuthCard({
  title,
  lead,
  children,
  wide,
  brandWord = true,
}: {
  title: string
  lead?: string
  children: React.ReactNode
  wide?: boolean
  brandWord?: boolean
}) {
  return (
    <div
      className={cn('card card-raised auth-card rh-in')}
      style={wide ? { width: 'min(500px, 100%)' } : undefined}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 10,
        }}
      >
        <Link
          href="/"
          className="brand"
          aria-label="Ruhama হোম"
          style={{ flexDirection: 'column', gap: 8 }}
        >
          <BrandMark className="brand__mark" style={{ width: 44, height: 44 }} />
          {brandWord ? <span className="brand__word">Ruhama</span> : null}
        </Link>
        <h1 className="t-h3" style={{ marginTop: 10 }}>
          {title}
        </h1>
        {lead ? <p className="t-small t-muted">{lead}</p> : null}
      </div>
      {children}
    </div>
  )
}
