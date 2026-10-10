'use client'

import { toast, useTranslation } from '@payloadcms/ui'
import type { DefaultCellComponentProps } from 'payload'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Option = { label: string; value: string }

const labelText = (label: unknown, lang: string): string => {
  if (typeof label === 'string') return label
  if (label && typeof label === 'object') {
    const map = label as Record<string, string>
    return map[lang] ?? Object.values(map)[0] ?? ''
  }
  return ''
}

/**
 * A yes/no or choice field changed right in the admin list, without opening the document. It saves
 * that one field through the REST API, so the server's access rules and hooks (review workflow,
 * validation) still decide; a refusal puts the old value back and shows why.
 */
export function InlineCell({
  cellData,
  rowData,
  field,
  collectionSlug,
}: DefaultCellComponentProps) {
  const router = useRouter()
  const { i18n } = useTranslation()
  const [value, setValue] = useState<unknown>(cellData)
  const [saving, setSaving] = useState(false)
  const name = 'name' in field ? field.name : ''

  async function save(next: unknown) {
    const previous = value
    setValue(next)
    setSaving(true)
    try {
      const res = await fetch(`/api/${collectionSlug}/${rowData.id}?depth=0`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ [name]: next }),
      })
      const json = (await res.json().catch(() => null)) as {
        errors?: { message?: string; data?: { errors?: { message?: string }[] } }[]
        message?: string
      } | null
      if (!res.ok) {
        const err = json?.errors?.[0]
        throw new Error(
          err?.data?.errors?.[0]?.message ?? err?.message ?? json?.message ?? `HTTP ${res.status}`,
        )
      }
      toast.success('পরিবর্তন সংরক্ষিত হয়েছে')
      router.refresh()
    } catch (err) {
      setValue(previous)
      toast.error(err instanceof Error ? err.message : 'সংরক্ষণ করা যায়নি')
    } finally {
      setSaving(false)
    }
  }

  if (field.type === 'checkbox') {
    const on = value === true
    return (
      <button
        type="button"
        role="switch"
        aria-checked={on}
        className={`rh-inline-switch${on ? ' is-on' : ''}`}
        disabled={saving}
        onClick={() => void save(!on)}
      >
        <span className="rh-inline-switch__track" aria-hidden="true">
          <span className="rh-inline-switch__thumb" />
        </span>
        {on ? 'Yes' : 'No'}
      </button>
    )
  }

  const options: Option[] =
    'options' in field && Array.isArray(field.options)
      ? field.options.map((o) =>
          typeof o === 'string'
            ? { label: o, value: o }
            : { label: labelText(o.label, i18n.language), value: String(o.value) },
        )
      : []
  return (
    <select
      className="rh-inline-select"
      value={typeof value === 'string' ? value : ''}
      disabled={saving}
      aria-label={labelText('label' in field ? field.label : name, i18n.language) || name}
      onChange={(e) => void save(e.target.value || null)}
    >
      {value ? null : <option value="">None</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
