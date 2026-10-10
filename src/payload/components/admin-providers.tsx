'use client'

import { notoSansBengali } from '@/lib/fonts'

import { ListDrawerHost } from './list-drawer'
import { NavScrollKeeper } from './nav-scroll-keeper'
import { SaveBars } from './save-bars'

/**
 * Wraps the whole admin. Points Payload's font variable at the self-hosted Bangla fonts (next/font),
 * so the admin needs no external stylesheet and stays light.
 */
export function AdminProviders({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <style>{`:root{--font-body:${notoSansBengali.style.fontFamily};--rh-admin-heading:${notoSansBengali.style.fontFamily};}`}</style>
      {children}
      <ListDrawerHost />
      <SaveBars />
      <NavScrollKeeper />
    </>
  )
}
