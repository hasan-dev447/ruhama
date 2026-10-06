'use client'

import { IconChevronDown, IconHide, IconSearch, IconShow, IconWarning } from '@/components/icons'
import { forwardRef, useId, useState } from 'react'

import { cn } from '@/lib/utils'

/** Design `.field` with label, control, hint and inline error wired for screen readers. */
export function Field({
  label,
  htmlFor,
  required,
  optional,
  hint,
  error,
  children,
  className,
  style,
}: {
  label?: React.ReactNode
  htmlFor?: string
  required?: boolean
  optional?: boolean
  hint?: React.ReactNode
  error?: string | null
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={cn('field', className)} style={style}>
      {label ? (
        <label className="label" htmlFor={htmlFor}>
          {label}
          {required ? (
            <span className="req" aria-hidden="true">
              *
            </span>
          ) : null}
          {optional ? (
            <span className="t-muted" style={{ fontWeight: 400 }}>
              {' '}
              (ঐচ্ছিক)
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <span id={htmlFor ? `${htmlFor}-error` : undefined} className="error-text" role="alert">
          <IconWarning className="ic ic-sm" aria-hidden="true" />
          {error}
        </span>
      ) : hint ? (
        <span id={htmlFor ? `${htmlFor}-hint` : undefined} className="hint">
          {hint}
        </span>
      ) : null}
    </div>
  )
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn('input', invalid && 'is-error', className)}
      aria-invalid={invalid || undefined}
      aria-describedby={props.id ? (invalid ? `${props.id}-error` : `${props.id}-hint`) : undefined}
      {...props}
    />
  )
})

/** Password field with a show/hide (eye) button; works with react-hook-form's register. */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  function PasswordInput({ style, ...props }, ref) {
    const [visible, setVisible] = useState(false)
    return (
      <div style={{ position: 'relative' }}>
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          style={{ paddingRight: 52, ...style }}
          {...props}
        />
        <button
          type="button"
          className="btn-icon"
          aria-label={visible ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
          aria-pressed={visible}
          aria-controls={props.id}
          onClick={() => setVisible((v) => !v)}
          style={{ position: 'absolute', right: 3, top: 3 }}
        >
          {visible ? (
            <IconHide className="ic" aria-hidden="true" />
          ) : (
            <IconShow className="ic" aria-hidden="true" />
          )}
        </button>
      </div>
    )
  },
)

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn('textarea', invalid && 'is-error', className)}
      aria-invalid={invalid || undefined}
      aria-describedby={props.id ? (invalid ? `${props.id}-error` : `${props.id}-hint`) : undefined}
      {...props}
    />
  )
})

/** Native select in the design's `.select-wrap`, best for mobile and accessibility. */
export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    wrapStyle?: React.CSSProperties
    invalid?: boolean
  }
>(function Select({ className, children, wrapStyle, invalid, ...props }, ref) {
  return (
    <div className="select-wrap" style={wrapStyle}>
      <select
        ref={ref}
        className={cn('select', invalid && 'is-error', className)}
        aria-invalid={invalid || undefined}
        {...props}
      >
        {children}
      </select>
      <IconChevronDown className="ic" aria-hidden="true" />
    </div>
  )
})

export const SearchInput = forwardRef<
  HTMLInputElement,
  InputProps & { label: string; wrapClassName?: string; wrapStyle?: React.CSSProperties }
>(function SearchInput({ label, wrapClassName, wrapStyle, className, id, ...props }, ref) {
  const auto = useId()
  const inputId = id ?? auto
  return (
    <div className={cn('input-icon', wrapClassName)} style={wrapStyle}>
      <IconSearch className="ic" aria-hidden="true" />
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <input ref={ref} id={inputId} type="search" className={cn('input', className)} {...props} />
    </div>
  )
})

export const Checkbox = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    label: React.ReactNode
    labelClassName?: string
    labelStyle?: React.CSSProperties
  }
>(function Checkbox({ label, labelClassName, labelStyle, ...props }, ref) {
  return (
    <label className={cn('check', labelClassName)} style={labelStyle}>
      <input ref={ref} type="checkbox" {...props} />
      {label}
    </label>
  )
})

export const Radio = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }
>(function Radio({ label, ...props }, ref) {
  return (
    <label className="check">
      <input ref={ref} type="radio" {...props} />
      {label}
    </label>
  )
})

/** Selectable card (`.check-card`) for radios and checkboxes. */
export const CheckCard = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }
>(function CheckCard({ label, checked, className, ...props }, ref) {
  return (
    <label className={cn('check-card', checked && 'is-checked', className)}>
      <input ref={ref} checked={checked} {...props} />
      <span>{label}</span>
    </label>
  )
})

/** Accessible toggle (`role="switch"`). */
export function Switch({
  checked,
  onCheckedChange,
  label,
  labelledBy,
  disabled,
}: {
  checked: boolean
  onCheckedChange: (next: boolean) => void
  label?: string
  labelledBy?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      className="switch"
      aria-checked={checked}
      aria-label={label}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
    />
  )
}

export function FormAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="form-alert" role="alert">
      <IconWarning className="ic" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}
