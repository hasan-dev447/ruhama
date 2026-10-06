'use client'

import { useState, useTransition } from 'react'

import { completeProfileAction } from '@/actions/settings'
import { Button } from '@/components/ui/button'
import { FormAlert } from '@/components/ui/form'
import type { Gender } from '@/lib/gender'

import { GenderPicker } from './gender-picker'

export function OnboardingForm({ next }: { next: string }) {
  const [gender, setGender] = useState<Gender | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!gender) {
      setError('ভাই অথবা বোন বেছে নিন।')
      return
    }
    setError(null)
    start(async () => {
      const res = await completeProfileAction(gender)
      if (!res.ok) {
        setError(res.error)
        return
      }
      // a full load, so the header and every page read the completed profile
      window.location.assign(next)
    })
  }

  return (
    <form
      onSubmit={submit}
      style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20 }}
      noValidate
    >
      {error ? <FormAlert>{error}</FormAlert> : null}
      <GenderPicker value={gender} onChange={setGender} />
      <Button type="submit" block pending={pending}>
        নিশ্চিত করুন ও এগিয়ে যান
      </Button>
    </form>
  )
}
