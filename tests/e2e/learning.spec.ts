import { expect, test, type Page } from '@playwright/test'

import { ACCOUNTS, signIn, routeWithTestIp } from './helpers'

const LESSON = '/courses/six-pillars-of-iman/what-is-iman'
const progressValue = async (page: Page) =>
  Number(
    await page
      .getByRole('progressbar', { name: 'কোর্স অগ্রগতি' })
      .first()
      .getAttribute('aria-valuenow'),
  )
const completeButton = (page: Page) =>
  page.getByRole('button', {
    name: /পাঠ সম্পন্ন হিসেবে চিহ্নিত করুন|সম্পন্ন হয়েছে · আবার অসম্পন্ন করুন/,
  })

test.describe('lesson progress', () => {
  test('guests are asked to sign in before progress is saved', async ({ page }) => {
    await page.goto(LESSON)
    await expect(page.getByRole('link', { name: /অগ্রগতি সংরক্ষণে লগইন করুন/ })).toBeVisible()
  })

  test('completing a lesson raises course progress, survives a reload and can be undone @mobile', async ({
    page,
  }) => {
    await routeWithTestIp(page)
    await signIn(page, ACCOUNTS.member2)
    await page.goto(LESSON)
    const button = completeButton(page)
    await expect(button).toBeVisible()

    // start from "not done" whatever earlier runs left behind
    if ((await button.getAttribute('aria-pressed')) === 'true') {
      await button.click()
      await expect(page.getByText('অগ্রগতি সংরক্ষণ করা যায়নি')).toHaveCount(0)
      // read the starting point from the server, not from the optimistic state
      await expect
        .poll(async () => (await (await page.request.get('/api/v1/me/enrollments')).text()).length)
        .toBeGreaterThan(0)
      await page.waitForTimeout(500)
      await page.reload()
      await expect(completeButton(page)).toHaveAttribute('aria-pressed', 'false')
    }
    await expect.poll(() => progressValue(page)).toBeGreaterThanOrEqual(0)
    const before = await progressValue(page)

    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => progressValue(page)).toBeGreaterThan(before)
    const after = await progressValue(page)

    // saved on the server, not just in this tab
    await page.reload()
    await expect(completeButton(page)).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => progressValue(page)).toBe(after)
    const outline = await page.request.get('/api/v1/me/enrollments')
    expect(outline.ok()).toBe(true)

    // the dashboard shows the same course progress
    await page.goto('/dashboard')
    await expect(page.getByText(`${after.toLocaleString('bn-BD')}%`).first()).toBeVisible()

    await page.goto(LESSON)
    await completeButton(page).click()
    await expect(completeButton(page)).toHaveAttribute('aria-pressed', 'false')
    await expect.poll(() => progressValue(page)).toBe(before)
  })
})
