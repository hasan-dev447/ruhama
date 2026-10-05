'use client'

import { Copy, Link2 } from 'lucide-react'
import { toast } from 'sonner'

import { BookmarkButton } from '@/components/actions/bookmark-button'

/** Per-ayah tools: bookmark, copy text with reference, copy a link to the ayah. */
export function AyahActions({
  id,
  arabic,
  translation,
  reference,
  anchor,
}: {
  id: number
  arabic: string
  translation: string
  reference: string
  anchor: string
}) {
  async function copy(text: string, done: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(done)
    } catch {
      toast.error('কপি করা যায়নি')
    }
  }
  return (
    <div className="ayah-row__actions">
      <BookmarkButton
        target={{ collection: 'ayahs', id }}
        labels={{ save: `${reference} সংরক্ষণ করুন`, remove: `${reference} সংরক্ষণ থেকে সরান` }}
      />
      <button
        type="button"
        className="btn-icon"
        aria-label={`${reference} কপি করুন`}
        onClick={() => copy(`${arabic}\n\n“${translation}”\n(${reference})`, 'আয়াত কপি হয়েছে')}
      >
        <Copy className="ic" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="btn-icon"
        aria-label={`${reference}-এর লিংক কপি করুন`}
        onClick={() =>
          copy(`${window.location.origin}${window.location.pathname}#${anchor}`, 'লিংক কপি হয়েছে')
        }
      >
        <Link2 className="ic" aria-hidden="true" />
      </button>
    </div>
  )
}
