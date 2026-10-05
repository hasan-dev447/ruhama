'use client'

import { X } from 'lucide-react'
import { Dialog } from 'radix-ui'

import { cn } from '@/lib/utils'

import { Button } from './button'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  width?: number
  className?: string
  /** Render the modal body as a <form>; Enter submits */
  onSubmit?: React.FormEventHandler<HTMLFormElement>
}

/** Design `.modal`: blurred scrim, xl radius, focus trap and Escape to close (Radix Dialog). */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  width,
  className,
  onSubmit,
}: Props) {
  const style: React.CSSProperties = {
    width: width ? `min(${width}px, 100%)` : undefined,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  }
  const inner = (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <Dialog.Title className="t-h4">{title}</Dialog.Title>
        <Dialog.Close
          className="btn-icon"
          aria-label="বন্ধ করুন"
          style={{ margin: '-8px -8px 0 0' }}
        >
          <X className="ic" aria-hidden="true" />
        </Dialog.Close>
      </div>
      <Dialog.Description className={description ? 't-small t-muted' : 'sr-only'}>
        {description ?? (typeof title === 'string' ? title : '')}
      </Dialog.Description>
      {children}
    </>
  )
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-scrim">
          <Dialog.Content
            asChild
            onOpenAutoFocus={(e) => {
              const first = (e.currentTarget as HTMLElement | null)?.querySelector<HTMLElement>(
                'input, textarea, select',
              )
              if (first) {
                e.preventDefault()
                first.focus()
              }
            }}
          >
            {onSubmit ? (
              <form className={cn('modal', className)} style={style} onSubmit={onSubmit}>
                {inner}
              </form>
            ) : (
              <div className={cn('modal', className)} style={style}>
                {inner}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** Styled replacement for window.confirm: a short question with cancel and a (danger) confirm button. */
export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  pending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  confirmLabel: string
  onConfirm: () => void
  pending?: boolean
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      width={420}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
          বাতিল
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm} pending={pending}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
