import { expect, test } from '@playwright/test'

import {
  ACCOUNTS,
  api,
  asUser,
  freshPhone,
  signIn,
  turnstileReady,
  routeWithTestIp,
} from './helpers'

const EVENT = '/events/tazkiyah-majlis-diseases-of-the-heart' // in person, separate seating, guests allowed
const CODE = /RH-[০-৯]{4}-[০-৯]{3}/

type Reg = { id: number; phone: string }
const seatsTaken = async (page: import('@playwright/test').Page) => {
  const res = await api<{ docs: { seatsTaken: number }[] }>(
    page,
    'GET',
    '/api/events?where[slug][equals]=tazkiyah-majlis-diseases-of-the-heart&depth=0&limit=1',
  )
  return res.body.docs[0]!.seatsTaken
}

test.describe('event registration', () => {
  test('a guest registers with Turnstile, gets a code, and the same number cannot book twice @mobile', async ({
    browser,
    page,
  }) => {
    const phone = freshPhone()
    const admin = await asUser(browser, ACCOUNTS.admin)
    const seatsBefore = await seatsTaken(admin.page)
    await routeWithTestIp(page)

    try {
      await page.goto(EVENT)
      await page.getByLabel('পূর্ণ নাম').fill('অতিথি পরীক্ষক')
      await page.getByLabel('মোবাইল নম্বর').fill(phone)
      await page.getByRole('radio', { name: 'বোনদের অংশ' }).check()
      await page.getByLabel('সঙ্গে আরও কতজন আসবেন').selectOption('1')
      await turnstileReady(page)
      await page.getByRole('button', { name: 'রেজিস্ট্রেশন নিশ্চিত করুন' }).click()

      await expect(page.getByRole('heading', { name: 'রেজিস্ট্রেশন সম্পন্ন' })).toBeVisible()
      await expect(page.getByText(CODE)).toBeVisible()
      // the registrant plus one companion
      await expect.poll(() => seatsTaken(admin.page)).toBe(seatsBefore + 2)

      // the calendar file is offered
      const ics = await page.request.get('/api/v1/events/tazkiyah-majlis-diseases-of-the-heart/ics')
      expect(ics.headers()['content-type']).toContain('text/calendar')
      expect(await ics.text()).toContain('BEGIN:VEVENT')

      // a second booking with the same number returns the existing code instead of taking more seats
      await page.goto(EVENT)
      await page.getByLabel('পূর্ণ নাম').fill('অতিথি পরীক্ষক')
      await page.getByLabel('মোবাইল নম্বর').fill(phone)
      await page.getByRole('radio', { name: 'বোনদের অংশ' }).check()
      await turnstileReady(page)
      await page.getByRole('button', { name: 'রেজিস্ট্রেশন নিশ্চিত করুন' }).click()
      await expect(
        page.getByText('এই নম্বর দিয়ে আগেই রেজিস্ট্রেশন করা ছিল', { exact: false }),
      ).toBeVisible()
      expect(await seatsTaken(admin.page)).toBe(seatsBefore + 2)
    } finally {
      // remove the test booking; the collection hook gives the seats back
      const regs = await api<{ docs: Reg[] }>(
        admin.page,
        'GET',
        `/api/event-registrations?where[phone][like]=${phone.slice(-8)}&depth=0`,
      )
      for (const r of regs.body.docs)
        await api(admin.page, 'DELETE', `/api/event-registrations/${r.id}`)
      await expect.poll(() => seatsTaken(admin.page)).toBe(seatsBefore)
      await admin.context.close()
    }
  })

  test('a member registers from their account and can cancel', async ({ browser, page }) => {
    const admin = await asUser(browser, ACCOUNTS.admin)
    const seatsBefore = await seatsTaken(admin.page)
    await routeWithTestIp(page)
    await signIn(page, ACCOUNTS.member3)
    await page.goto(EVENT)

    // an earlier run may have left a booking: cancel it first
    const cancel = page.getByRole('button', { name: 'রেজিস্ট্রেশন বাতিল করুন' })
    if (await cancel.isVisible().catch(() => false)) {
      await cancel.click()
      await expect(page.getByRole('button', { name: 'রেজিস্ট্রেশন নিশ্চিত করুন' })).toBeVisible()
    }
    const base = await seatsTaken(admin.page)

    await page.getByLabel('মোবাইল নম্বর').fill(freshPhone())
    await page.getByRole('radio', { name: 'বোনদের অংশ' }).check()
    await page.getByRole('button', { name: 'রেজিস্ট্রেশন নিশ্চিত করুন' }).click()
    await expect(page.getByText(CODE)).toBeVisible()
    await expect.poll(() => seatsTaken(admin.page)).toBe(base + 1)

    // it shows up on the dashboard
    await page.goto('/dashboard')
    await expect(page.getByText('তাযকিয়া', { exact: false }).first()).toBeVisible()

    await page.goto(EVENT)
    await page.getByRole('button', { name: 'রেজিস্ট্রেশন বাতিল করুন' }).click()
    await expect(page.getByRole('button', { name: 'রেজিস্ট্রেশন নিশ্চিত করুন' })).toBeVisible()
    await expect.poll(() => seatsTaken(admin.page)).toBe(base)
    expect(base).toBeLessThanOrEqual(seatsBefore)
    await admin.context.close()
  })
})
