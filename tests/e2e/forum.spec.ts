import { expect, test, type Browser, type Page } from '@playwright/test'

import { ACCOUNTS, api, asUser, uid } from './helpers'

const THREAD = '/forum/2/my-experience-controlling-anger'

/** A fresh reply by the (trusted) seeded member, so each test works on its own post. */
async function postReply(page: Page, text: string): Promise<number> {
  await page.goto(THREAD)
  await page.getByPlaceholder('নিজের অভিজ্ঞতা বা দলিলসহ পরামর্শ লিখুন').fill(text)
  await page.getByRole('button', { name: 'উত্তর প্রকাশ করুন' }).click()
  await expect(page.getByText('উত্তর প্রকাশিত হয়েছে')).toBeVisible()
  const res = await api<{ docs: { id: number }[] }>(
    page,
    'GET',
    `/api/forum-posts?where[body][equals]=${encodeURIComponent(text)}&depth=0&limit=1`,
  )
  return res.body.docs[0]!.id
}

/** Report one reply through the thread page's dialog. */
async function report(page: Page, postId: number, authorName: string, reason: string) {
  await page.goto(`${THREAD}#post-${postId}`)
  await page
    .locator(`#post-${postId}`)
    .getByRole('button', { name: `${authorName}-এর উত্তর রিপোর্ট করুন` })
    .click()
  const dialog = page.getByRole('dialog', { name: 'পোস্টটি রিপোর্ট করুন' })
  await dialog.getByText(reason).click()
  await dialog.getByRole('button', { name: 'রিপোর্ট পাঠান' }).click()
  await expect(page.getByText('রিপোর্ট পাঠানো হয়েছে')).toBeVisible()
}

async function publicThreadText(browser: Browser) {
  const guest = await browser.newContext()
  const page = await guest.newPage()
  await page.goto(THREAD)
  const text = (await page.locator('main').innerText()) ?? ''
  await guest.close()
  return text
}

test.describe('forum reports', () => {
  test.setTimeout(120_000)

  test('a member reports a reply and a moderator hides it from the queue', async ({ browser }) => {
    const text = `পরীক্ষামূলক উত্তর ${uid()}: সবর ও দোয়া একসাথে।`
    const author = await asUser(browser, ACCOUNTS.member)
    const reporter = await asUser(browser, ACCOUNTS.member2)
    const moderator = await asUser(browser, ACCOUNTS.moderator)
    const admin = await asUser(browser, ACCOUNTS.admin)
    let postId = 0
    try {
      postId = await postReply(author.page, text)
      expect(await publicThreadText(browser)).toContain(text)

      // the author cannot report their own reply; another member can
      await author.page.goto(`${THREAD}#post-${postId}`)
      await expect(
        author.page.locator(`#post-${postId}`).getByRole('button', { name: /রিপোর্ট করুন/ }),
      ).toHaveCount(0)
      await report(reporter.page, postId, 'আব্দুল্লাহ আল মামুন', 'উৎসবিহীন বা ভুল দলিল')

      // members never see the queue
      expect((await reporter.page.goto('/forum/moderation'))?.status()).toBe(404)

      await moderator.page.goto('/forum/moderation')
      const row = moderator.page.locator('.setting-row', { hasText: text.slice(0, 30) })
      await expect(row).toBeVisible()
      await expect(row).toContainText('উৎসবিহীন বা ভুল দলিল')
      await row.getByRole('button', { name: 'লুকান' }).click()
      await expect(moderator.page.getByText('সিদ্ধান্ত সংরক্ষিত হয়েছে')).toBeVisible()
      await expect(
        moderator.page.locator('.setting-row', { hasText: text.slice(0, 30) }),
      ).toHaveCount(0)

      // hidden for everyone else, and the decision is on record
      await expect.poll(() => publicThreadText(browser)).not.toContain(text)
      const reports = await api<{ docs: { status: string }[] }>(
        admin.page,
        'GET',
        `/api/reports?where[post][equals]=${postId}&depth=0`,
      )
      expect(reports.body.docs.every((r) => r.status === 'actioned')).toBe(true)
    } finally {
      if (postId) {
        const reports = await api<{ docs: { id: number }[] }>(
          admin.page,
          'GET',
          `/api/reports?where[post][equals]=${postId}&depth=0`,
        )
        for (const r of reports.body.docs)
          await api(admin.page, 'DELETE', `/api/reports/${r.id}`, undefined, [404])
        await api(admin.page, 'DELETE', `/api/forum-posts/${postId}`, undefined, [404])
      }
      for (const u of [author, reporter, moderator, admin]) await u.context.close()
    }
  })

  test('enough reports hide a reply automatically until a moderator decides @mobile', async ({
    browser,
  }) => {
    const text = `স্বয়ংক্রিয় লুকানোর পরীক্ষা ${uid()}`
    const author = await asUser(browser, ACCOUNTS.member)
    const reporters = await Promise.all(
      [ACCOUNTS.member2, ACCOUNTS.member3, ACCOUNTS.newMember].map((e) => asUser(browser, e)),
    )
    const moderator = await asUser(browser, ACCOUNTS.moderator)
    const admin = await asUser(browser, ACCOUNTS.admin)
    let postId = 0
    try {
      postId = await postReply(author.page, text)
      for (const r of reporters)
        await report(r.page, postId, 'আব্দুল্লাহ আল মামুন', 'স্প্যাম বা বিজ্ঞাপন')
      await expect.poll(() => publicThreadText(browser)).not.toContain(text)

      // the moderator restores it: reports dismissed, visible again
      await moderator.page.goto('/forum/moderation')
      const card = moderator.page.locator('article', { hasText: text })
      await expect(card).toContainText('রিপোর্টের কারণে লুকানো')
      await card.getByRole('button', { name: 'আবার দেখান' }).click()
      await expect(moderator.page.getByText('সিদ্ধান্ত সংরক্ষিত হয়েছে')).toBeVisible()
      await expect.poll(() => publicThreadText(browser)).toContain(text)
    } finally {
      if (postId) {
        const reports = await api<{ docs: { id: number }[] }>(
          admin.page,
          'GET',
          `/api/reports?where[post][equals]=${postId}&depth=0`,
        )
        for (const r of reports.body.docs)
          await api(admin.page, 'DELETE', `/api/reports/${r.id}`, undefined, [404])
        await api(admin.page, 'DELETE', `/api/forum-posts/${postId}`, undefined, [404])
      }
      for (const u of [author, ...reporters, moderator, admin]) await u.context.close()
    }
  })
})
