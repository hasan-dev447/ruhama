'use client'

import { useSyncExternalStore } from 'react'

const noop = () => () => {}

/** True after hydration (false during SSR and the first client render), without an effect. */
export function useMounted() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
}
