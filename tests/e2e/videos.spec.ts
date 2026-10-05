import { expect, test } from '@playwright/test'

const VIDEO = '/videos/iman-in-qadar-effort-and-trust'
const frame = 'iframe.yt-frame'

test.describe('video player', () => {
  test('loads YouTube only on play (privacy-friendly facade)', async ({ page }) => {
    await page.goto(VIDEO)
    await expect(page.locator(frame)).toHaveCount(0)
    await page.locator('.player__play').click()
    await expect(page.locator(frame)).toHaveAttribute(
      'src',
      /^https:\/\/www\.youtube-nocookie\.com\/embed\//,
    )
  })

  test('a chapter starts playback at its time and makes the link shareable @mobile', async ({
    page,
  }) => {
    await page.goto(VIDEO)
    const chapters = page.locator('button.chapter')
    await expect(chapters).toHaveCount(7)
    // retried until hydration has attached the handlers (the dev server may still be compiling)
    await expect(async () => {
      await chapters.nth(2).click()
      await expect(page).toHaveURL(/[?&]t=\d+/, { timeout: 1000 })
    }).toPass()
    await expect(chapters.nth(2)).toHaveAttribute('aria-current', 'true')
    await expect(page).toHaveURL(/[?&]t=\d+/)
    const t = new URL(page.url()).searchParams.get('t')
    await expect(page.locator(frame)).toHaveAttribute('src', new RegExp(`[?&]start=${t}(&|$)`))
  })

  test('?t= in the address starts from that position', async ({ page }) => {
    await page.goto(`${VIDEO}?t=90`)
    await page.locator('.player__play').click()
    await expect(page.locator(frame)).toHaveAttribute('src', /[?&]start=90(&|$)/)
  })
})
