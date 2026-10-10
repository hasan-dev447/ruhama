'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { IconCheck, IconChevronDown, IconLocation, IconSearch } from '@/components/icons'
import { DISTRICT_ALIASES, DIVISIONS, districtLabel } from '@/lib/districts'
import { cn } from '@/lib/utils'

type Option = {
  value: string
  label: string
  division: string
  haystack: string
  divisionHaystack?: string
}

const ALL_OPTIONS: Option[] = DIVISIONS.flatMap((d) =>
  d.districts.map((x) => ({
    value: x.value,
    label: x.label,
    division: d.label,
    // the district's own names: Bangla, English slug ("coxs-bazar" as "coxs bazar"), old spellings
    haystack: [x.label, x.value.replace(/-/g, ' '), ...(DISTRICT_ALIASES[x.value] ?? [])]
      .join(' ')
      .toLowerCase(),
    divisionHaystack: `${d.label} ${d.value} division`.toLowerCase(),
  })),
)

/**
 * A district picker you can type in: Bangla or English ("dhaka", "chittagong", "ঢাকা"), grouped by
 * division, with arrow keys, Enter and Escape (the ARIA combobox pattern). No library, no network.
 *
 * - `allLabel`: adds a first "all districts" choice whose value is "all" (list filters).
 * - `only`: offers just these districts (for example the ones that have events).
 */
export function DistrictSelect({
  id,
  value,
  onChange,
  placeholder = 'জেলা নির্বাচন করুন',
  allLabel,
  only,
  invalid,
  className,
  style,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  allLabel?: string
  only?: string[]
  invalid?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const listId = useId()

  const options = useMemo(() => {
    const pool = only ? ALL_OPTIONS.filter((o) => only.includes(o.value)) : ALL_OPTIONS
    const q = query.trim().toLowerCase()
    // a district's own name first ("dhaka" is the district); a whole division only when nothing
    // else matches ("রংপুর বিভাগ", "rangpur division")
    const byName = q ? pool.filter((o) => o.haystack.includes(q)) : pool
    const found = byName.length || !q ? byName : pool.filter((o) => o.divisionHaystack?.includes(q))
    return allLabel && !q
      ? [{ value: 'all', label: allLabel, division: '', haystack: '' }, ...found]
      : found
  }, [query, only, allLabel])

  const selectedLabel = value === 'all' && allLabel ? allLabel : value ? districtLabel(value) : ''

  // close on a click outside
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // keep the highlighted option in view
  useEffect(() => {
    if (!open) return
    list.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  function openList() {
    if (open) return
    setQuery('')
    const at = options.findIndex((o) => o.value === value)
    setActive(at >= 0 ? at : 0)
    setOpen(true)
  }

  function choose(o: Option) {
    onChange(o.value)
    setOpen(false)
    setQuery('')
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return openList()
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (options.length ? (i + step + options.length) % options.length : 0))
    } else if (e.key === 'Enter') {
      if (!open) return
      e.preventDefault()
      const o = options[active]
      if (o) choose(o)
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault()
        setOpen(false)
      }
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  let lastDivision = ''
  return (
    <div
      ref={root}
      className={cn('district-select', open && 'is-open', invalid && 'is-invalid', className)}
      style={style}
    >
      <IconLocation className="ic district-select__pin" aria-hidden="true" />
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        autoComplete="off"
        className="district-select__input"
        placeholder={open ? 'খুঁজুন: বাংলা বা English (যেমন dhaka)' : placeholder}
        value={open ? query : selectedLabel}
        onFocus={openList}
        onClick={openList}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
          if (!open) setOpen(true)
        }}
        onKeyDown={onKeyDown}
      />
      {open ? (
        <IconSearch className="ic district-select__icon" aria-hidden="true" />
      ) : (
        <IconChevronDown className="ic district-select__icon" aria-hidden="true" />
      )}
      {open ? (
        <ul ref={list} id={listId} role="listbox" className="district-select__list">
          {options.length ? (
            options.map((o, i) => {
              const head = o.division && o.division !== lastDivision ? o.division : null
              lastDivision = o.division || lastDivision
              return (
                <li key={o.value} role="presentation">
                  {head ? <div className="district-select__group">{head}</div> : null}
                  <div
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={o.value === value}
                    data-index={i}
                    className={cn('district-select__option', i === active && 'is-active')}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(o)}
                  >
                    <span>{o.label}</span>
                    {o.value === value ? (
                      <IconCheck className="ic ic-sm" aria-hidden="true" />
                    ) : null}
                  </div>
                </li>
              )
            })
          ) : (
            <li className="district-select__empty" role="presentation">
              “{query}” নামে কোনো জেলা পাওয়া যায়নি
            </li>
          )}
        </ul>
      ) : null}
    </div>
  )
}
