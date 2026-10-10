import { describe, expect, it } from 'vitest'

import { featuredShura } from '@/components/content/shura-grid'

const all = [1, 2, 3, 4, 5].map((id) => ({ id, name: `m${id}` }))

describe('featuredShura', () => {
  it('shows everyone when nobody is chosen', () => {
    expect(featuredShura(all, null)).toHaveLength(5)
    expect(featuredShura(all, [])).toHaveLength(5)
  })

  it('keeps the chosen order, ids or populated docs alike', () => {
    expect(featuredShura(all, [4, { id: 1 }, 3]).map((m) => m.id)).toEqual([4, 1, 3])
  })

  it('drops someone who is no longer active or in the শূরা', () => {
    expect(featuredShura(all, [2, 99]).map((m) => m.id)).toEqual([2])
  })
})
