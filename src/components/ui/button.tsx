import { cva, type VariantProps } from 'class-variance-authority'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Slot } from 'radix-ui'
import { forwardRef } from 'react'

import { cn } from '@/lib/utils'

/** Design `.btn` family. Classes come straight from the design system board. */
export const buttonVariants = cva('btn', {
  variants: {
    variant: {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost',
      gold: 'btn-gold',
      onBand: 'btn-on-band',
      danger: 'btn-danger',
      dangerGhost: 'btn-danger-ghost',
    },
    size: { sm: 'btn-sm', md: '', lg: 'btn-lg' },
    block: { true: 'btn-block', false: '' },
  },
  defaultVariants: { variant: 'primary', size: 'md', block: false },
})

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean; pending?: boolean }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, block, asChild, pending, children, disabled, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={asChild ? undefined : disabled || pending}
      aria-busy={pending || undefined}
      type={asChild ? undefined : (type ?? 'button')}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {pending ? <span className="spin" aria-hidden="true" /> : null}
          {children}
        </>
      )}
    </Comp>
  )
})

type ButtonLinkProps = Omit<React.ComponentProps<typeof Link>, 'className'> &
  VariantProps<typeof buttonVariants> & { className?: string; arrow?: boolean }

/** A Link styled as a button, with optional animated arrow (`.ic-arrow`). */
export function ButtonLink({
  variant,
  size,
  block,
  className,
  arrow,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={cn(buttonVariants({ variant, size, block }), className)} {...props}>
      {children}
      {arrow ? <ArrowRight className="ic ic-arrow" aria-hidden="true" /> : null}
    </Link>
  )
}

export const IconButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; outline?: boolean }
>(function IconButton({ label, outline, className, children, type, ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      aria-label={label}
      className={cn('btn-icon', outline && 'btn-icon--outline', className)}
      {...props}
    >
      {children}
    </button>
  )
})

export function LinkArrow({
  href,
  children,
  className,
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link href={href} className={cn('link-arrow', className)}>
      {children} <ArrowRight className="ic" aria-hidden="true" />
    </Link>
  )
}
