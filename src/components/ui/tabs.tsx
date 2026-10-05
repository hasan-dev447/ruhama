'use client'

import { Tabs as TabsPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

/** Design `.tabs` / `.tab` on top of Radix Tabs (arrow-key navigation, ARIA roles). */
export const Tabs = TabsPrimitive.Root
export const TabsContent = TabsPrimitive.Content

export function TabsList({
  children,
  label,
  className,
  style,
}: {
  children: React.ReactNode
  label: string
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <TabsPrimitive.List className={cn('tabs', className)} aria-label={label} style={style}>
      {children}
    </TabsPrimitive.List>
  )
}

export function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <TabsPrimitive.Trigger value={value} className="tab">
      {children}
    </TabsPrimitive.Trigger>
  )
}
