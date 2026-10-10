'use client'

import { IconInfo } from '@/components/icons'

/** A short note beside a home page setting: where that section's items come from. */
export function HomeSectionNote({ text }: { text?: string }) {
  if (!text) return null
  return (
    <p className="rh-home-note">
      <IconInfo size={16} aria-hidden="true" />
      <span>{text}</span>
    </p>
  )
}
