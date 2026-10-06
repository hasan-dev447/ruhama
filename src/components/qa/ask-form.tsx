'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { IconLogin, IconSend, IconSuccess } from '@/components/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import { askQuestionAction } from '@/actions/questions'
import { Button, ButtonLink } from '@/components/ui/button'
import { Checkbox, Field, FormAlert, Input, Select, Textarea } from '@/components/ui/form'
import { Skeleton } from '@/components/ui/primitives'
import { useSession } from '@/lib/auth/client'
import { askQuestionSchema } from '@/lib/validation/questions'

type Values = z.input<typeof askQuestionSchema>

/** "প্রশ্ন করুন" sidebar card. Members only; guests are asked to log in first. */
export function AskQuestionForm({
  categories,
}: {
  categories: { id: number | string; name: string }[]
}) {
  const { data: session, isPending: sessionPending } = useSession()
  const pathname = usePathname()
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const form = useForm<Values, unknown, z.output<typeof askQuestionSchema>>({
    resolver: zodResolver(askQuestionSchema),
    defaultValues: {
      title: '',
      body: '',
      categoryId: categories[0] ? Number(categories[0].id) : undefined,
      anonymous: true,
    },
  })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null)
    startTransition(async () => {
      const res = await askQuestionAction(values)
      if (res.ok) {
        setSent(true)
        form.reset()
        return
      }
      setServerError(res.error)
      for (const [path, message] of Object.entries(res.fieldErrors ?? {})) {
        if (path === 'title' || path === 'body' || path === 'categoryId')
          form.setError(path, { message })
      }
    })
  })

  if (sent) {
    return (
      <div className="empty" role="status" style={{ padding: '24px 8px' }}>
        <span
          className="empty__icon"
          style={{ background: 'var(--rh-success-soft)', color: 'var(--rh-success)' }}
        >
          <IconSuccess className="ic ic-lg" aria-hidden="true" />
        </span>
        <h2 className="t-h4">প্রশ্নটি জমা হয়েছে</h2>
        <p className="t-small t-muted">
          জাযাকাল্লাহু খাইরান। উত্তর প্রকাশ হলে ইমেইলে জানানো হবে এবং ড্যাশবোর্ডে দেখতে পাবেন।
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          <ButtonLink href="/dashboard#questions" variant="secondary" size="sm">
            আমার প্রশ্ন
          </ButtonLink>
          <Button variant="ghost" size="sm" onClick={() => setSent(false)}>
            আরেকটি প্রশ্ন
          </Button>
        </div>
      </div>
    )
  }

  const header = (
    <div>
      <h2 id="ask-title" className="t-h4">
        প্রশ্ন করুন
      </h2>
      <p className="t-small t-muted" style={{ marginTop: 4 }}>
        আগে খুঁজে দেখুন, হয়তো উত্তর ইতিমধ্যে আছে।
      </p>
    </div>
  )

  if (sessionPending) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} aria-busy="true">
        {header}
        <Skeleton style={{ height: 48 }} />
        <Skeleton style={{ height: 48 }} />
        <Skeleton style={{ height: 120 }} />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {header}
        <p className="t-small">
          প্রশ্ন জমা দিতে লগইন করুন। এতে উত্তর প্রকাশ হলে আপনাকে জানাতে পারব, আর চাইলে আপনার পরিচয়
          গোপন থাকবে।
        </p>
        <ButtonLink href={`/login?next=${encodeURIComponent(`${pathname ?? '/qa'}#ask`)}`} block>
          <IconLogin className="ic" aria-hidden="true" />
          লগইন করে প্রশ্ন করুন
        </ButtonLink>
        <p className="t-caption t-muted">
          অ্যাকাউন্ট নেই?{' '}
          <Link href="/register" className="link">
            বিনামূল্যে নিবন্ধন করুন
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      noValidate
    >
      {header}
      {serverError ? <FormAlert>{serverError}</FormAlert> : null}
      <Field label="আপনার প্রশ্ন" htmlFor="ask-q" required error={errors.title?.message}>
        <Input
          id="ask-q"
          placeholder="এক লাইনে প্রশ্নটি লিখুন"
          invalid={Boolean(errors.title)}
          {...form.register('title')}
        />
      </Field>
      <Field label="বিষয়" htmlFor="ask-cat" error={errors.categoryId?.message}>
        <Select id="ask-cat" invalid={Boolean(errors.categoryId)} {...form.register('categoryId')}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="বিস্তারিত" htmlFor="ask-d" error={errors.body?.message}>
        <Textarea
          id="ask-d"
          placeholder="প্রেক্ষাপট লিখলে উত্তর দেওয়া সহজ হয়। ব্যক্তিগত তথ্য দেবেন না।"
          invalid={Boolean(errors.body)}
          {...form.register('body')}
        />
      </Field>
      <Checkbox label="নাম প্রকাশ না করে প্রকাশ করুন" {...form.register('anonymous')} />
      <Button type="submit" block pending={pending}>
        প্রশ্ন জমা দিন <IconSend className="ic" aria-hidden="true" />
      </Button>
      <p className="t-caption t-muted">
        প্রশ্নটি আদব নীতিমালা মেনে মডারেট করা হবে। সাধারণত ৩ থেকে ৭ দিনের মধ্যে উত্তর প্রকাশিত হয়।
      </p>
    </form>
  )
}
