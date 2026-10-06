'use client'

import { GENDERS, type Gender } from '@/lib/gender'
import { cn } from '@/lib/utils'

/** ভাই / বোন as two large choices. Used on registration and on /onboarding. */
export function GenderPicker({
  value,
  onChange,
  error,
  name = 'gender',
}: {
  value: Gender | null
  onChange: (g: Gender) => void
  error?: string
  name?: string
}) {
  return (
    <fieldset
      className="field"
      style={{ border: 0, padding: 0, margin: 0 }}
      aria-invalid={Boolean(error)}
    >
      <legend className="label" style={{ marginBottom: 8 }}>
        আপনার পরিচয় <span aria-hidden="true">*</span>
      </legend>
      <div className="gender-choice" role="radiogroup">
        {GENDERS.map((g) => (
          <label key={g.value} className={cn('gender-card', value === g.value && 'is-checked')}>
            <input
              type="radio"
              name={name}
              value={g.value}
              checked={value === g.value}
              onChange={() => onChange(g.value)}
              required
            />
            <strong>{g.label}</strong>
            <span>{g.value === 'male' ? 'পুরুষ' : 'নারী'}</span>
          </label>
        ))}
      </div>
      <p className="hint" style={{ marginTop: 8 }}>
        একবার বেছে নিলে আর বদলানো যাবে না। ভাইয়েরা প্রোফাইল ছবি দিতে পারবেন।
      </p>
      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
