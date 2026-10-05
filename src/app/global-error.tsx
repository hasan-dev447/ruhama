'use client'

import '@/styles/globals.css'

import { ErrorView } from '@/components/errors/error-view'
import { fontVariables } from '@/lib/fonts'

/** Last-resort boundary when the root layout itself fails. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="bn" className={`rh ${fontVariables}`}>
      <body>
        <ErrorView error={error} reset={reset} />
      </body>
    </html>
  )
}
