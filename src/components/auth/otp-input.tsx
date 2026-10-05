'use client'

import { useRef } from 'react'

const BN = '০১২৩৪৫৬৭৮৯'
const toAscii = (s: string) => s.replace(/[০-৯]/g, (d) => String(BN.indexOf(d))).replace(/\D/g, '')

/** Six single-digit boxes (`.otp-row`); accepts Bangla digits and pasted codes. */
export function OtpInput({
  value,
  onChange,
  length = 6,
  invalid,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  length?: number
  invalid?: boolean
  autoFocus?: boolean
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  function setAt(i: number, raw: string) {
    const clean = toAscii(raw)
    if (clean.length > 1) {
      // pasted or autofilled code
      const next = clean.slice(0, length)
      onChange(next)
      refs.current[Math.min(next.length, length - 1)]?.focus()
      return
    }
    const arr = digits.slice()
    arr[i] = clean
    onChange(arr.join('').slice(0, length))
    if (clean && i < length - 1) refs.current[i + 1]?.focus()
  }

  return (
    <div className="otp-row" role="group" aria-label={`${BN[length] ?? length} অঙ্কের কোড`}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          className={invalid ? 'input is-error' : 'input'}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={i === 0 ? length : 1}
          value={d}
          autoFocus={autoFocus && i === 0}
          aria-label={`অঙ্ক ${BN[i + 1] ?? i + 1}`}
          aria-invalid={invalid || undefined}
          onChange={(e) => setAt(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !d && i > 0) refs.current[i - 1]?.focus()
            if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
            if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus()
          }}
          onFocus={(e) => e.currentTarget.select()}
        />
      ))}
    </div>
  )
}
