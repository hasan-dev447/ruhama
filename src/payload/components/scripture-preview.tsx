'use client'

import { toast, useForm, useFormFields } from '@payloadcms/ui'
import type { UIFieldClientProps } from 'payload'
import { useEffect, useState } from 'react'

import { IconCopy } from '@/components/icons'
import { ayahReference } from '@/lib/quran-meta'

type Kind = 'ayah' | 'hadith'

type Loaded = {
  arabic: string | null
  text: string
  reference: string
  narrator?: string | null
  grade?: string | null
}

const GRADES: Record<string, string> = {
  sahih: 'সহিহ',
  hasan: 'হাসান',
  daif: 'যঈফ',
  mawdu: 'মাওযু',
}

async function load(kind: Kind, id: number): Promise<Loaded> {
  if (kind === 'ayah') {
    const res = await fetch(
      `/api/ayahs/${id}?depth=0&select[arabic]=true&select[translation]=true&select[surah]=true&select[ayah]=true`,
      { credentials: 'include' },
    )
    const d = (await res.json()) as {
      arabic?: string
      translation?: string
      surah?: number
      ayah?: number
    }
    return {
      arabic: d.arabic ?? null,
      text: d.translation ?? '',
      reference: d.surah && d.ayah ? ayahReference(d.surah, d.ayah) : '',
    }
  }
  const res = await fetch(
    `/api/hadiths/${id}?depth=1&select[arabic]=true&select[text]=true&select[narrator]=true&select[grade]=true&select[number]=true&select[numberLabel]=true&select[book]=true`,
    { credentials: 'include' },
  )
  const d = (await res.json()) as {
    arabic?: string | null
    text?: string
    narrator?: string | null
    grade?: string | null
    number?: number
    numberLabel?: string | null
    book?: { name?: string } | number
  }
  const book = d.book && typeof d.book === 'object' ? d.book.name : ''
  return {
    arabic: d.arabic ?? null,
    text: d.text ?? '',
    reference: book ? `${book} : ${d.numberLabel ?? d.number}` : '',
    narrator: d.narrator ?? null,
    grade: d.grade ?? null,
  }
}

/**
 * In the আয়াত / হাদিস blocks: shows the picked verse or hadith as it will appear, so the editor sees
 * that nothing else needs filling in, and can copy it into the "write it yourself" fields to adjust it.
 */
export function ScripturePreview({ path, kind }: UIFieldClientProps & { kind: Kind }) {
  const sibling = (name: string) => path.replace(/[^.]+$/, name)
  const picked = useFormFields(([fields]) => fields[sibling(kind)]?.value) as
    number | { id: number } | null | undefined
  const id = picked && typeof picked === 'object' ? picked.id : (picked ?? null)
  const { dispatchFields } = useForm()
  const [data, setData] = useState<{ id: number; value: Loaded } | null>(null)

  useEffect(() => {
    if (!id) return
    let alive = true
    load(kind, Number(id))
      .then((value) => alive && setData({ id: Number(id), value }))
      .catch(() => null)
    return () => {
      alive = false
    }
  }, [id, kind])

  if (!id) {
    return (
      <p className="rh-scripture-preview__hint">
        উপরে বেছে নিন, অথবা নিচের “নিজের মতো লিখতে চাইলে” অংশ খুলে নিজে লিখুন।
      </p>
    )
  }
  const v = data && data.id === Number(id) ? data.value : null
  if (!v) return <p className="rh-scripture-preview__hint">লোড হচ্ছে...</p>

  function copy() {
    const set = (name: string, value: string | null | undefined) =>
      dispatchFields({ type: 'UPDATE', path: sibling(name), value: value ?? '' })
    set('arabic', v!.arabic)
    if (kind === 'ayah') {
      set('translation', v!.text)
      set('reference', v!.reference)
    } else {
      set('text', v!.text)
      set('source', v!.reference)
      set('narrator', v!.narrator)
    }
    toast.success('কপি হয়েছে। নিচের “নিজের মতো লিখতে চাইলে” অংশ খুলে বদলান।')
  }

  return (
    <div className="rh-scripture-preview">
      <span className="rh-scripture-preview__label">সাইটে যেভাবে দেখাবে</span>
      {v.arabic ? (
        <p className="rh-scripture-preview__ar" lang="ar" dir="rtl">
          {v.arabic}
        </p>
      ) : null}
      <p className="rh-scripture-preview__text">“{v.text}”</p>
      <p className="rh-scripture-preview__ref">
        {v.reference}
        {v.narrator ? ` · বর্ণনাকারী: ${v.narrator}` : ''}
        {v.grade && GRADES[v.grade] ? ` · ${GRADES[v.grade]}` : ''}
      </p>
      <button type="button" className="rh-int-btn rh-int-btn--ghost" onClick={copy}>
        <IconCopy size={15} aria-hidden="true" /> বদলাতে চাইলে নিচের ঘরে কপি করুন
      </button>
    </div>
  )
}
