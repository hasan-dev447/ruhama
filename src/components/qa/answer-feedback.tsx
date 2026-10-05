'use client'

import { CircleCheck } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { voteAnswerAction } from '@/actions/questions'
import { Button } from '@/components/ui/button'

const DONE_TEXT = {
  helpful: 'জাযাকাল্লাহু খাইরান! আপনার মতামত আলিম প্যানেলকে উৎসাহ দেবে।',
  unclear: 'ধন্যবাদ। উত্তরটি আরও স্পষ্ট করতে আলিম প্যানেলকে জানানো হলো।',
} as const

/** "উত্তরটি কি উপকারী ছিল?" */
export function AnswerFeedback({ questionId }: { questionId: number }) {
  const [voted, setVoted] = useState<keyof typeof DONE_TEXT | null>(null)
  const [pending, startTransition] = useTransition()

  function vote(value: keyof typeof DONE_TEXT) {
    setVoted(value)
    startTransition(async () => {
      const res = await voteAnswerAction(questionId, value)
      if (!res.ok) {
        setVoted(null)
        toast.error('মতামত পাঠানো যায়নি', { description: res.error })
      }
    })
  }

  return (
    <div
      className="card"
      style={{
        padding: '20px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {voted ? (
        <span
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--rh-success)',
            fontWeight: 500,
          }}
        >
          <CircleCheck className="ic" aria-hidden="true" />
          {DONE_TEXT[voted]}
        </span>
      ) : (
        <>
          <span style={{ fontWeight: 600, flex: '1 1 200px' }}>উত্তরটি কি উপকারী ছিল?</span>
          <Button variant="secondary" size="sm" onClick={() => vote('helpful')} disabled={pending}>
            হ্যাঁ, উপকারী
          </Button>
          <Button variant="ghost" size="sm" onClick={() => vote('unclear')} disabled={pending}>
            আরও স্পষ্টতা দরকার
          </Button>
        </>
      )}
    </div>
  )
}
