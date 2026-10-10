// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@payloadcms/ui', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { RoleManager } from '@/payload/components/roles/role-manager'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const overview = (isSuper: boolean) => ({
  me: {
    id: 1,
    roles: isSuper ? ['super_admin'] : ['shura'],
    isSuper,
    canManage: true,
    canAssign: true,
    levels: isSuper ? {} : { integrations: 'none', articles: 'full', videos: 'full' },
    abilities: isSuper
      ? {}
      : { 'forum.moderate': false, 'roles.manage': true, 'users.roles': true },
  },
  matrix: isSuper
    ? {}
    : { shura: { menus: { integrations: 'none' }, abilities: { 'forum.moderate': false } } },
  fallback: {},
  counts: {
    super_admin: 1,
    shura: 2,
    editor: 1,
    reviewer: 3,
    author: 4,
    moderator: 1,
    scholar: 0,
    speaker: 2,
    member: 40,
  },
})

let root: Root | null = null
let host: HTMLElement

function mockFetch(isSuper: boolean) {
  const calls: { url: string; init?: RequestInit }[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init })
      if (url.endsWith('/api/v1/roles')) return Response.json(overview(isSuper))
      if (url.includes('/members'))
        return Response.json({
          docs: [
            {
              id: 7,
              name: 'Masud Hasan',
              contact: 'kk@example.com',
              username: 'masud',
              image: null,
              roles: ['reviewer', 'author'],
            },
          ],
          totalDocs: 1,
          hasNextPage: false,
        })
      if (init?.method === 'PUT') return Response.json({ changed: 1 })
      return Response.json({})
    }),
  )
  return calls
}

const flush = async () => {
  for (let i = 0; i < 5; i++) await act(async () => new Promise((r) => setTimeout(r, 0)))
}

async function mount() {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  await act(async () => root!.render(createElement(RoleManager)))
  await flush()
}

const roleButton = (label: string) =>
  [...host.querySelectorAll<HTMLButtonElement>('.rh-roles__role')].find(
    (b) => b.querySelector('strong')?.textContent === label,
  )!
const radios = (menu: string) => [
  ...host.querySelectorAll<HTMLButtonElement>(
    `[role="radiogroup"][aria-label="${menu}: অনুমতি"] [role="radio"]`,
  ),
]
const radio = (menu: string, label: string) => radios(menu).find((b) => b.textContent === label)!
const click = async (el: Element) => {
  await act(async () => (el as HTMLElement).click())
  await flush()
}

afterEach(() => {
  act(() => root?.unmount())
  root = null
  host?.remove()
  vi.unstubAllGlobals()
})

describe('RoleManager', () => {
  it('lists every role and saves a changed level for one', async () => {
    const calls = mockFetch(true)
    await mount()
    const names = [...host.querySelectorAll('.rh-roles__role strong')].map((s) => s.textContent)
    expect(names).toEqual([
      'সুপার অ্যাডমিন',
      'শূরা',
      'রিভিউয়ার',
      'সম্পাদক',
      'লেখক',
      'মডারেটর',
      'আলিম',
      'বক্তা',
      'সদস্য',
    ])
    await click(roleButton('লেখক'))
    expect(radio('ভিডিও', 'এডিট').getAttribute('aria-checked')).toBe('true')
    await click(radio('ভিডিও', 'দেখা'))
    expect(host.textContent).toContain('1টি পরিবর্তন সংরক্ষণ করা হয়নি')

    const save = [...host.querySelectorAll('button')].find(
      (b) => b.textContent === 'অনুমতি সংরক্ষণ করুন',
    )!
    await click(save)
    const put = calls.find((c) => c.init?.method === 'PUT')!
    expect(put.url).toBe('/api/v1/roles/author')
    expect(JSON.parse(String(put.init!.body)).menus.videos).toBe('view')
  })

  it('locks super admin, and shows শূরা read-only to a শূরা member', async () => {
    mockFetch(false)
    await mount()
    expect(host.textContent).toContain('শূরার অনুমতি শুধু সুপার অ্যাডমিন বদলাতে পারেন')
    await click(roleButton('সুপার অ্যাডমিন'))
    expect(host.textContent).toContain('বদলানো যায় না')
  })

  it('never offers more than the editor has', async () => {
    mockFetch(false)
    await mount()
    await click(roleButton('সম্পাদক'))
    // the শূরা member has no integrations access, so cannot give "এডিট"
    expect(radio('ইন্টিগ্রেশন', 'এডিট').disabled).toBe(true)
    // nor hand out forum moderation they lack
    const mod = host.querySelector<HTMLButtonElement>(
      '[role="switch"][aria-label="ফোরাম মডারেশন"]',
    )!
    expect(mod.disabled).toBe(true)
  })

  it('shows the people holding a role', async () => {
    mockFetch(true)
    await mount()
    await click(roleButton('রিভিউয়ার'))
    const tab = [...host.querySelectorAll('[role="tab"]')].find((t) =>
      t.textContent?.includes('সদস্য'),
    )!
    await click(tab)
    expect(host.textContent).toContain('Masud Hasan')
    expect(host.querySelector('[aria-label="Masud Hasan-এর রিভিউয়ার রোল সরান"]')).toBeTruthy()
  })
})
