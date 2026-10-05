'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { useMounted } from '@/hooks/use-mounted'
import { cn } from '@/lib/utils'

function useIsDark() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()
  const dark = mounted && resolvedTheme === 'dark'
  return { dark, mounted, toggle: () => setTheme(dark ? 'light' : 'dark') }
}

/** Icon button used in the header and on the auth pages. */
export function ThemeToggle({ className }: { className?: string }) {
  const { dark, mounted, toggle } = useIsDark()
  const label = !mounted ? 'থিম পরিবর্তন করুন' : dark ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন'
  return (
    <button type="button" className={cn('btn-icon', className)} aria-label={label} onClick={toggle}>
      <Moon className="ic theme-icon-light" aria-hidden="true" />
      <Sun className="ic theme-icon-dark" aria-hidden="true" />
    </button>
  )
}

/** Full-width variant used inside the mobile drawer. */
export function ThemeToggleRow() {
  const { dark, toggle } = useIsDark()
  return (
    <button
      type="button"
      className="btn btn-ghost btn-block"
      onClick={toggle}
      style={{ justifyContent: 'space-between' }}
    >
      {dark ? 'লাইট মোড' : 'ডার্ক মোড'}
      <Moon className="ic theme-icon-light" aria-hidden="true" />
      <Sun className="ic theme-icon-dark" aria-hidden="true" />
    </button>
  )
}
