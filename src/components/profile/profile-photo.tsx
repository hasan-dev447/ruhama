'use client'

import { Dialog } from 'radix-ui'
import { useState } from 'react'

import { IconClose } from '@/components/icons'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * The large round photo on a profile. With a photo it opens full screen on click (Escape or the close
 * button returns); without one it shows the member's initials.
 */
export function ProfilePhoto({
  name,
  photo,
  tone = 'gold',
}: {
  name: string
  photo: { src: string; large: string } | null
  tone?: 'gold' | 'teal'
}) {
  const [open, setOpen] = useState(false)
  const className = cn('avatar-hero', tone === 'teal' && 'avatar-hero--teal')
  if (!photo) {
    return (
      <span className={className} aria-hidden="true">
        {initials(name)}
      </span>
    )
  }
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className={cn(className, 'avatar-hero--button')}
        aria-label={`${name}-এর ছবি বড় করে দেখুন`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt="" decoding="async" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="photo-viewer__scrim" />
        <Dialog.Content className="photo-viewer" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">{name}-এর প্রোফাইল ছবি</Dialog.Title>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.large} alt={`${name}-এর প্রোফাইল ছবি`} className="photo-viewer__img" />
          <Dialog.Close className="photo-viewer__close" aria-label="বন্ধ করুন">
            <IconClose className="ic ic-lg" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
