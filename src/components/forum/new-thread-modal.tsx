'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'

import { createThreadAction } from '@/actions/forum'
import { Button } from '@/components/ui/button'
import { Field, FormAlert, Input, Select, Textarea } from '@/components/ui/form'
import { Modal } from '@/components/ui/modal'
import { newThreadSchema } from '@/lib/validation/forum'

type Values = z.input<typeof newThreadSchema>

/** "নতুন আলোচনা" dialog (design `Forum` board). */
export function NewThreadModal({
  open,
  onOpenChange,
  categories,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  categories: { id: number; name: string }[]
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const form = useForm<Values, unknown, z.output<typeof newThreadSchema>>({
    resolver: zodResolver(newThreadSchema),
    defaultValues: {
      title: '',
      categoryId: categories[0]?.id,
      body: '',
      anonymous: false,
      agree: false as never,
    },
  })
  const { errors } = form.formState

  const onValid = (values: z.output<typeof newThreadSchema>) => {
    setError(null)
    start(async () => {
      const res = await createThreadAction(values)
      if (!res.ok) {
        setError(res.error)
        return
      }
      form.reset()
      onOpenChange(false)
      if (res.data.status === 'published') {
        toast.success('আলোচনাটি প্রকাশিত হয়েছে')
        router.push(`/forum/${res.data.id}${res.data.slug ? `/${res.data.slug}` : ''}`)
      } else {
        toast.info('আলোচনাটি মডারেশনে আছে', {
          description: 'সাধারণত কয়েক ঘণ্টার মধ্যে প্রকাশিত হয়।',
        })
      }
    })
  }
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => void form.handleSubmit(onValid)(e)

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="নতুন আলোচনা"
      width={620}
      onSubmit={onSubmit}
    >
      {error ? <FormAlert>{error}</FormAlert> : null}
      <Field label="শিরোনাম" htmlFor="nd-t" required error={errors.title?.message}>
        <Input
          id="nd-t"
          placeholder="এক লাইনে মূল বিষয়"
          invalid={Boolean(errors.title)}
          {...form.register('title')}
        />
      </Field>
      <Field label="বিভাগ" htmlFor="nd-c" error={errors.categoryId?.message}>
        <Select id="nd-c" {...form.register('categoryId')}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="বিস্তারিত" htmlFor="nd-b" required error={errors.body?.message}>
        <Textarea
          id="nd-b"
          placeholder="প্রেক্ষাপট লিখুন। কোনো দলিল উল্লেখ করলে উৎস দিন।"
          invalid={Boolean(errors.body)}
          {...form.register('body')}
        />
      </Field>
      <label className="check">
        <input type="checkbox" {...form.register('anonymous')} />
        <span className="t-small">নাম প্রকাশ না করে পোস্ট করুন</span>
      </label>
      <div>
        <label className="check" style={{ alignItems: 'flex-start' }}>
          <input
            type="checkbox"
            style={{ marginTop: 4 }}
            aria-invalid={errors.agree ? true : undefined}
            {...form.register('agree')}
          />
          <span className="t-small">
            আমি আলোচনার আদব মেনে চলব। নতুন সদস্যদের প্রথম তিনটি পোস্ট মডারেটর দেখে প্রকাশ করেন।
          </span>
        </label>
        {errors.agree ? (
          <span className="error-text" role="alert">
            {errors.agree.message}
          </span>
        ) : null}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
          বাতিল
        </Button>
        <Button type="submit" pending={pending}>
          প্রকাশ করুন
        </Button>
      </div>
    </Modal>
  )
}
