import { expect, test } from '@playwright/test'

import { ACCOUNTS, signIn, signInFresh, signOut } from './helpers'

/** Needs a production build (`npm run build && npm run start`): the service worker is not built in dev. */
test.describe('offline reading', () => {
  test.beforeEach(async ({ page }) => {
    // the app registers its worker only in a production build (a dev server may still serve an old sw.js)
    await page.goto('/')
    const registered = await page.evaluate(async () => {
      for (let i = 0; i < 20; i++) {
        if (await navigator.serviceWorker?.getRegistration()) return true
        await new Promise((r) => setTimeout(r, 250))
      }
      return false
    })
    test.skip(
      !registered,
      'service worker is only registered in a production build (npm run build && npm run start)',
    )
  })

  test('saved articles open offline, other pages show the offline screen', async ({
    page,
    context,
  }) => {
    await signIn(page, ACCOUNTS.member)
    const saved = await page.request.get('/api/v1/me/bookmarks/offline')
    const { articles } = (await saved.json()) as { articles: { url: string; title: string }[] }
    expect(articles.length, 'the seeded member has saved articles').toBeGreaterThan(0)

    await page.goto('/dashboard')
    await page.evaluate(() => navigator.serviceWorker.ready)
    // the page syncs saved articles shortly after load; wait until the worker reports them
    await expect
      .poll(
        () =>
          page.evaluate(async () => {
            const cache = await caches.open('rh-saved-articles-v1')
            return (await cache.keys()).length
          }),
        { timeout: 30_000 },
      )
      .toBeGreaterThan(articles.length) // articles plus the index

    await context.setOffline(true)
    await page.goto(articles[0].url)
    await expect(page.locator('h1').first()).toContainText(articles[0].title.slice(0, 12))

    await page.goto('/events')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('আপনি এখন অফলাইনে')
    await expect(page.getByRole('link', { name: articles[0].title })).toBeVisible()
    // and the listed copy opens without a connection
    await page.getByRole('link', { name: articles[0].title }).click()
    await expect(page).toHaveURL(new RegExp(`${articles[0].url}$`))
    await expect(page.locator('h1').first()).toContainText(articles[0].title.slice(0, 12))
    await context.setOffline(false)
  })

  test('signing out clears saved copies', async ({ page }) => {
    // its own session, so signing out leaves the shared one from global setup intact
    await signInFresh(page, ACCOUNTS.member)
    await page.goto('/dashboard')
    await page.evaluate(() => navigator.serviceWorker.ready)
    await expect
      .poll(
        () =>
          page.evaluate(
            async () => (await (await caches.open('rh-saved-articles-v1')).keys()).length,
          ),
        { timeout: 30_000 },
      )
      .toBeGreaterThan(0)
    await signOut(page)
    await page.reload()
    await expect
      .poll(
        () =>
          page.evaluate(
            async () => (await (await caches.open('rh-saved-articles-v1')).keys()).length,
          ),
        { timeout: 15_000 },
      )
      .toBe(0)
  })
})
