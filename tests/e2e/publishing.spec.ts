import { expect, test, type Page } from '@playwright/test'

import { ACCOUNTS, api, asUser, lexical, uid } from './helpers'

type Article = { id: number; slug: string; reviewStatus: string; _status: string }

/** Click one review-panel action on the article's admin page and wait for the panel to settle. */
async function reviewAction(page: Page, id: number, label: string) {
  await page.goto(`/admin/collections/articles/${id}`)
  const button = page.getByRole('button', { name: label })
  await expect(button).toBeVisible({ timeout: 30_000 })
  await button.click()
  await expect(page.getByRole('button', { name: 'অপেক্ষা করুন…' })).toHaveCount(0, {
    timeout: 30_000,
  })
}

const statusOf = async (page: Page, id: number) =>
  (await api<Article>(page, 'GET', `/api/articles/${id}?draft=true&depth=0`)).body

test.describe('editorial workflow', () => {
  test.setTimeout(180_000)

  test('an article is published only after two different reviewers approve, and public pages refresh', async ({
    browser,
    page,
  }) => {
    const title = `পরীক্ষামূলক প্রবন্ধ ${uid()}`
    const author = await asUser(browser, ACCOUNTS.author)
    const reviewer1 = await asUser(browser, ACCOUNTS.reviewer1)
    const reviewer2 = await asUser(browser, ACCOUNTS.reviewer2)
    const publisher = await asUser(browser, ACCOUNTS.publisher)
    let id = 0

    try {
      // warm the public listing so the later check proves cache revalidation, not a first render
      await page.goto('/ilm')
      await expect(page.getByText(title)).toHaveCount(0)

      const categories = await api<{ docs: { id: number }[] }>(
        author.page,
        'GET',
        '/api/categories?limit=1&depth=0&where[usedFor][contains]=articles',
      )
      const people = await api<{ docs: { id: number }[] }>(
        author.page,
        'GET',
        '/api/people?limit=1&depth=0',
      )
      const created = await api<{ doc: Article }>(author.page, 'POST', '/api/articles?draft=true', {
        title,
        excerpt: 'স্বয়ংক্রিয় পরীক্ষার জন্য লেখা একটি সংক্ষিপ্ত প্রবন্ধ।',
        content: lexical(
          'এটি সম্পাদকীয় প্রক্রিয়ার পরীক্ষা।',
          'দুইজন রিভিউয়ারের অনুমোদন ছাড়া এটি প্রকাশিত হবে না।',
        ),
        category: categories.body.docs[0]!.id,
        author: people.body.docs[0]!.id,
      })
      id = created.body.doc.id
      const slug = created.body.doc.slug
      expect((await statusOf(author.page, id)).reviewStatus).toBe('draft')

      // the author cannot publish their own draft directly
      const direct = await api(
        author.page,
        'POST',
        `/api/v1/review/articles/${id}`,
        { action: 'publish' },
        [403],
      )
      expect(direct.status).toBe(403)

      await reviewAction(author.page, id, 'রিভিউর জন্য পাঠান')
      expect((await statusOf(author.page, id)).reviewStatus).toBe('in_review')

      await reviewAction(reviewer1.page, id, 'অনুমোদন দিন')
      expect((await statusOf(reviewer1.page, id)).reviewStatus).toBe('in_review')

      // one approval is not enough, even for a publisher, and the same reviewer cannot approve twice
      const early = await api(
        publisher.page,
        'POST',
        `/api/v1/review/articles/${id}`,
        { action: 'publish' },
        [403],
      )
      expect(early.status).toBe(403)
      const twice = await api(
        reviewer1.page,
        'POST',
        `/api/v1/review/articles/${id}`,
        { action: 'approve' },
        [403],
      )
      expect(twice.status).toBe(403)

      await reviewAction(reviewer2.page, id, 'অনুমোদন দিন')
      expect((await statusOf(reviewer2.page, id)).reviewStatus).toBe('approved')

      // still a draft to the public until the final publish
      expect((await page.request.get(`/ilm/${slug}`)).status()).toBe(404)

      await reviewAction(publisher.page, id, 'চূড়ান্ত প্রকাশ')
      const published = await statusOf(publisher.page, id)
      expect(published._status).toBe('published')
      expect(published.reviewStatus).toBe('published')

      // the publish hook revalidated the cached pages: the article and the listing show it at once
      await page.goto(`/ilm/${slug}`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
      await page.goto('/ilm')
      await expect(page.getByText(title).first()).toBeVisible()
    } finally {
      if (id) {
        await api(
          publisher.page,
          'POST',
          `/api/v1/review/articles/${id}`,
          { action: 'unpublish' },
          [403, 404],
        )
        const admin = await asUser(browser, ACCOUNTS.admin)
        await api(admin.page, 'DELETE', `/api/articles/${id}`, undefined, [404])
        await admin.context.close()
      }
      for (const u of [author, reviewer1, reviewer2, publisher]) await u.context.close()
    }
  })

  test('requested changes send the article back to its author', async ({ browser }) => {
    const author = await asUser(browser, ACCOUNTS.author)
    const reviewer = await asUser(browser, ACCOUNTS.reviewer2)
    const admin = await asUser(browser, ACCOUNTS.admin)
    const categories = await api<{ docs: { id: number }[] }>(
      author.page,
      'GET',
      '/api/categories?limit=1&depth=0&where[usedFor][contains]=articles',
    )
    const people = await api<{ docs: { id: number }[] }>(
      author.page,
      'GET',
      '/api/people?limit=1&depth=0',
    )
    const { body } = await api<{ doc: Article }>(author.page, 'POST', '/api/articles?draft=true', {
      title: `সংশোধনের পরীক্ষা ${uid()}`,
      excerpt: 'পরিবর্তনের অনুরোধের পরীক্ষা।',
      content: lexical('খসড়া লেখা।'),
      category: categories.body.docs[0]!.id,
      author: people.body.docs[0]!.id,
    })
    const id = body.doc.id
    try {
      await api(author.page, 'POST', `/api/v1/review/articles/${id}`, { action: 'submit' })
      await api(reviewer.page, 'POST', `/api/v1/review/articles/${id}`, {
        action: 'request_changes',
        note: 'দলিল যোগ করুন।',
      })
      expect((await statusOf(author.page, id)).reviewStatus).toBe('needs_changes')
      // the author was told why
      const inbox = await api<{ docs: { text: string }[] }>(
        author.page,
        'GET',
        '/api/v1/me/notifications?limit=5',
      )
      expect(
        inbox.body.docs.some(
          (n) => n.text.includes('দলিল যোগ করুন') || n.text.includes('পরিবর্তন'),
        ),
      ).toBe(true)
    } finally {
      await api(admin.page, 'DELETE', `/api/articles/${id}`, undefined, [404])
      for (const u of [author, reviewer, admin]) await u.context.close()
    }
  })
})
