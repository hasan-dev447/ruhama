'use client'

import { hindSiliguri, notoSerifBengali } from '@/lib/fonts'

/**
 * Wraps the whole admin. Points Payload's font variable at the self-hosted Bangla fonts (next/font),
 * so the admin needs no external stylesheet and stays light.
 */
export function AdminProviders({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <style>{`:root{--font-body:${hindSiliguri.style.fontFamily};--rh-admin-heading:${notoSerifBengali.style.fontFamily};}`}</style>
      {children}
    </>
  )
}
