import { describe, expect, it } from 'vitest'

import { focusPosition, pickImageUrl } from '@/lib/rich-image'

const doc = {
  url: '/orig.jpg',
  sizes: { w480: { url: '/480.jpg', width: 480 }, w960: { url: '/960.jpg', width: 960 } },
}

describe('pickImageUrl', () => {
  it('takes the lightest version wide enough for sharp screens', () => {
    expect(pickImageUrl(doc, 'small')).toBe('/480.jpg') // 240px shown
    expect(pickImageUrl(doc, 'medium')).toBe('/960.jpg') // 360px shown
    expect(pickImageUrl(doc, 'large')).toBe('/960.jpg') // 540px shown
    expect(pickImageUrl(doc, 'full')).toBe('/orig.jpg') // 720px shown
  })

  it('falls back to the original for older uploads without these versions', () => {
    expect(pickImageUrl({ url: '/orig.jpg' }, 'small')).toBe('/orig.jpg')
    // a small original is never "enlarged": the 480 version of a 300px picture is 300px wide
    expect(
      pickImageUrl({ url: '/o.jpg', sizes: { w480: { url: '/s.jpg', width: 300 } } }, 'small'),
    ).toBe('/o.jpg')
  })
})

describe('focusPosition', () => {
  it('maps the chosen part, or the media focal point', () => {
    expect(focusPosition('top', {})).toBe('center top')
    expect(focusPosition('auto', { focalX: 30, focalY: 70 })).toBe('30% 70%')
    expect(focusPosition(undefined, {})).toBe('50% 50%')
  })
})
