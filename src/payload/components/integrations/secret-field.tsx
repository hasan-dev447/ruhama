'use client'

import { FieldDescription, FieldLabel, useField, useFormFields } from '@payloadcms/ui'
import { IconDelete, IconHide, IconKey, IconShow, IconUndo } from '@/components/icons'
import type { TextFieldClientComponent } from 'payload'
import { useState } from 'react'

import { SECRET_CLEAR } from '@/payload/globals/integrations-shared'

/**
 * Write-only input for an API key or client secret. The saved value never reaches the browser: the field
 * shows only its last four characters, a new value replaces it, and "remove" clears it on save.
 */
export const SecretField: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue } = useField<string>({ path })
  const hint = useFormFields(
    ([fields]) => fields[`${path}Hint`]?.value as string | null | undefined,
  )
  const [visible, setVisible] = useState(false)
  const id = `field-${path.replace(/\./g, '__')}`
  const clearing = value === SECRET_CLEAR
  const typed = typeof value === 'string' && value !== '' && !clearing
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined

  return (
    <div className="field-type text rh-secret">
      <FieldLabel htmlFor={id} label={field.label} path={path} />
      <div className="rh-secret__status">
        <IconKey size={14} aria-hidden="true" />
        {clearing ? (
          <span className="rh-secret__warn">সংরক্ষণ করলে সংরক্ষিত মানটি মুছে যাবে।</span>
        ) : hint ? (
          <span>
            সংরক্ষিত আছে: <code>{hint}</code>
            {typed ? ' (সংরক্ষণ করলে নতুনটি বসবে)' : null}
          </span>
        ) : (
          <span className="rh-secret__muted">
            এখানে কিছু সংরক্ষিত নেই। থাকলে .env-এর মান ব্যবহার হবে।
          </span>
        )}
      </div>
      {clearing ? (
        <button type="button" className="rh-int-btn rh-int-btn--ghost" onClick={() => setValue('')}>
          <IconUndo size={15} aria-hidden="true" /> বাতিল করুন
        </button>
      ) : (
        <div className="rh-secret__row">
          <div className="field-type__wrap rh-secret__input">
            <input
              id={id}
              type={visible ? 'text' : 'password'}
              autoComplete="new-password"
              spellCheck={false}
              placeholder={hint ? 'বদলাতে চাইলে নতুন মান লিখুন' : 'মান লিখুন'}
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => setValue(e.target.value)}
            />
            <button
              type="button"
              className="rh-secret__eye"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'লুকান' : 'দেখান'}
              aria-pressed={visible}
            >
              {visible ? <IconHide size={16} /> : <IconShow size={16} />}
            </button>
          </div>
          {hint ? (
            <button
              type="button"
              className="rh-int-btn rh-int-btn--danger"
              onClick={() => setValue(SECRET_CLEAR)}
            >
              <IconDelete size={15} aria-hidden="true" /> মুছুন
            </button>
          ) : null}
        </div>
      )}
      {description ? <FieldDescription description={description} path={path} /> : null}
    </div>
  )
}
