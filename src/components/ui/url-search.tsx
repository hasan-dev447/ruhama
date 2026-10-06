'use client'

import { IconSearch } from '@/components/icons'
import { parseAsString, useQueryStates } from 'nuqs'
import { useEffect, useRef, useState } from 'react'

import { useDebouncedValue } from '@/hooks/use-debounced'

/**
 * Search box bound to the `q` URL param (debounced, no reload). Resets `page`.
 * Other components read the same param, so lists and the box stay in sync.
 */
export function UrlSearchBox({
  id,
  label,
  placeholder,
  wrapStyle,
  inputStyle,
}: {
  id: string
  label: string
  placeholder: string
  wrapStyle?: React.CSSProperties
  inputStyle?: React.CSSProperties
}) {
  const [state, setState] = useQueryStates(
    { q: parseAsString.withDefault(''), page: parseAsString },
    { history: 'replace', shallow: true, scroll: false },
  )
  const [value, setValue] = useState(state.q)
  const debounced = useDebouncedValue(value, 350)
  const pushed = useRef(state.q)

  useEffect(() => {
    if (debounced === pushed.current) return
    pushed.current = debounced
    void setState({ q: debounced || null, page: null })
  }, [debounced, setState])

  // filters cleared elsewhere (for example an empty state) flow back into the box
  useEffect(() => {
    if (state.q === pushed.current) return
    pushed.current = state.q
    setValue(state.q)
  }, [state.q])

  return (
    <div className="input-icon" style={wrapStyle}>
      <IconSearch className="ic" aria-hidden="true" />
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        className="input"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  )
}
