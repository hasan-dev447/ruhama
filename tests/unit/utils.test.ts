import { describe, expect, it } from 'vitest'

import {
  extractHeadings,
  lexicalToPlainText,
  paragraphsToLexical,
  readingMinutes,
} from '@/lib/lexical'
import { normalizeBdPhone } from '@/lib/phone'
import { safeRedirectPath } from '@/lib/safe-path'

describe('Bangladeshi phone numbers', () => {
  it('normalises local, international and Bangla-digit forms', () => {
    expect(normalizeBdPhone('01712345678')).toBe('+8801712345678')
    expect(normalizeBdPhone('+880 1712-345678')).toBe('+8801712345678')
    expect(normalizeBdPhone('০১৭১২৩৪৫৬৭৮')).toBe('+8801712345678')
  })

  it('rejects invalid numbers', () => {
    expect(normalizeBdPhone('01212345678')).toBeNull()
    expect(normalizeBdPhone('12345')).toBeNull()
  })
})

describe('redirect safety', () => {
  it('allows only same-site relative paths', () => {
    expect(safeRedirectPath('/ilm/abc')).toBe('/ilm/abc')
    expect(safeRedirectPath('//evil.example')).toBe('/')
    expect(safeRedirectPath('https://evil.example')).toBe('/')
    expect(safeRedirectPath(`/${String.fromCharCode(92)}evil.example`)).toBe('/')
    expect(safeRedirectPath(null, '/dashboard')).toBe('/dashboard')
  })
})

describe('lexical helpers', () => {
  it('extracts plain text and reading time', () => {
    const doc = paragraphsToLexical(['প্রথম অনুচ্ছেদ', 'দ্বিতীয় অনুচ্ছেদ'])
    expect(lexicalToPlainText(doc)).toBe('প্রথম অনুচ্ছেদ\nদ্বিতীয় অনুচ্ছেদ')
    expect(readingMinutes(Array.from({ length: 360 }, () => 'শব্দ').join(' '))).toBe(3)
  })

  it('numbers headings in order and accepts custom anchors', () => {
    const heading = (tag: string, text: string) => ({
      type: 'heading',
      tag,
      children: [{ type: 'text', text }],
    })
    const doc = {
      root: {
        type: 'root',
        children: [heading('h2', 'ভূমিকা'), heading('h3', 'উপ'), heading('h2', 'শেষ কথা')],
      },
    }
    expect(extractHeadings(doc).map((h) => h.id)).toEqual(['section-1', 'section-2', 'section-3'])
    expect(
      extractHeadings(doc, (i, t) => (t === 'শেষ কথা' ? 'end' : `s${i}`)).map((h) => h.id),
    ).toEqual(['s1', 's2', 'end'])
  })
})
