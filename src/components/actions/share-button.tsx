'use client'

import { IconShare } from '@/components/icons'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'

/** Native share sheet when available, otherwise copy the link. */
export function ShareButton({
  title,
  path,
  label = 'লিংক কপি করে শেয়ার করুন',
  variant = 'icon',
  text,
  className,
}: {
  title: string
  path?: string
  label?: string
  variant?: 'icon' | 'outline' | 'ghost' | 'secondary'
  text?: string
  className?: string
}) {
  async function share() {
    const url = path ? new URL(path, window.location.origin).toString() : window.location.href
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success('লিংক কপি হয়েছে', {
        description: 'বন্ধুদের সাথে শেয়ার করুন। কল্যাণের পথ দেখানোও সওয়াবের কাজ।',
      })
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') toast.error('লিংক কপি করা যায়নি')
    }
  }

  if (variant === 'ghost' || variant === 'secondary') {
    return (
      <button
        type="button"
        className={cn('btn btn-sm', variant === 'ghost' ? 'btn-ghost' : 'btn-secondary', className)}
        onClick={share}
      >
        <IconShare className="ic" aria-hidden="true" />
        {text ?? 'শেয়ার'}
      </button>
    )
  }
  return (
    <button
      type="button"
      className={cn('btn-icon', variant === 'outline' && 'btn-icon--outline', className)}
      aria-label={label}
      onClick={share}
    >
      <IconShare className="ic" aria-hidden="true" />
    </button>
  )
}
