import { describe, expect, it } from 'vitest'

import { savedListHtml } from '@/sw/protocol'

describe('offline saved list markup', () => {
  it('escapes titles and links so cached data cannot inject markup', () => {
    const html = savedListHtml([{ url: '/ilm/a"b', title: '<img src=x onerror=alert(1)>' }])
    expect(html).toContain('href="/ilm/a&quot;b"')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toContain('<img')
  })
  it('lists only article pages', () => {
    const html = savedListHtml([
      { url: 'https://evil.example/x', title: 'x' },
      { url: '/ilm/ok', title: 'ঠিক আছে' },
    ])
    expect(html).not.toContain('evil.example')
    expect(html).toContain('/ilm/ok')
  })
  it('explains how to save when nothing is stored', () => {
    expect(savedListHtml([])).toContain('এখনো কোনো লেখা সংরক্ষিত নেই')
  })
})
