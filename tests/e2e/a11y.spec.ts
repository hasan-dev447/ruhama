import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const PAGES = [
  '/',
  '/ilm',
  '/ikhtilaf',
  '/qa',
  '/courses',
  '/events',
  '/circles',
  '/videos',
  '/scholars',
  '/forum',
  '/quran',
  '/quran/al-fatihah',
  '/hadith',
  '/search?q=সবর',
  '/about',
  '/adab',
  '/join',
  '/contact',
  '/login',
  '/register',
  '/offline',
  '/this-page-does-not-exist',
]

for (const theme of ['light', 'dark'] as const) {
  test.describe(`accessibility (${theme})`, () => {
    // reduced motion: scroll reveals render final colours at once (and proves they honour the setting)
    test.use({ colorScheme: theme, reducedMotion: 'reduce' })
    for (const path of PAGES) {
      test(`${path} has no serious WCAG A/AA violations @mobile`, async ({ page }) => {
        await page.goto(path)
        // not networkidle: Turnstile and realtime keep connections open
        await page.locator('main').first().waitFor()
        await page.waitForLoadState('load')
        await page.waitForTimeout(500)
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          // third-party iframes (Turnstile, YouTube) are outside our control
          .exclude('iframe')
          .analyze()
        const serious = results.violations.filter(
          (v) => v.impact === 'serious' || v.impact === 'critical',
        )
        const report = serious
          .map(
            (v) =>
              `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes
                .slice(0, 5)
                .map((n) => n.target.join(' '))
                .join('\n  ')}`,
          )
          .join('\n')
        expect(serious, report).toEqual([])
      })
    }
  })
}
