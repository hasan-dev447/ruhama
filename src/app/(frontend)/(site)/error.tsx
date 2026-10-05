'use client'

import { ErrorView } from '@/components/errors/error-view'

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorView error={error} reset={reset} />
}
