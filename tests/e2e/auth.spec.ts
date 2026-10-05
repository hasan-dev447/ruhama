import { expect, test, type Page } from '@playwright/test'

import {
  ACCOUNTS,
  currentUser,
  freshPhone,
  linkIn,
  SEED_PASSWORD,
  signInFresh,
  turnstileReady,
  uid,
  routeWithTestIp,
  waitForOutbox,
} from './helpers'

/** Who the browser is signed in as, straight from the auth API. */
const sessionEmail = async (page: Page) => (await currentUser(page))?.email ?? null

// revoking "all other sessions" would also end the shared sessions from global setup, so this test has its own account
const SESSIONS_ACCOUNT = 'sakib@ruhama.local'
// UI password logins count against that account's limit (8 per 15 minutes), so they use one nobody else needs
const LOGIN_ACCOUNT = 'rakib@ruhama.local'

test.beforeEach(async ({ page }) => {
  await routeWithTestIp(page)
})

test.describe('registration', () => {
  test('email sign-up needs a verified address, then signs the member in @mobile', async ({
    page,
  }) => {
    const email = `e2e-${uid()}@example.test`
    const since = Date.now()

    await page.goto('/register')
    await page.getByLabel('পূর্ণ নাম').fill('পরীক্ষা সদস্য')
    await page.getByLabel('ইমেইল', { exact: true }).fill(email)
    await page.getByLabel('পাসওয়ার্ড', { exact: true }).fill('Sabr-Shukr-2026')
    await page.getByRole('checkbox', { name: /আদব ও ইনসাফ নীতি/ }).check()
    await turnstileReady(page)
    await page.getByRole('button', { name: 'অ্যাকাউন্ট খুলুন' }).click()

    await expect(page.getByRole('heading', { name: 'ইমেইল যাচাই করুন' })).toBeVisible()
    expect(await sessionEmail(page)).toBeNull()

    // unverified accounts cannot sign in with the password yet
    await page.goto('/login')
    await page.getByLabel('ইমেইল', { exact: true }).fill(email)
    await page.getByLabel('পাসওয়ার্ড', { exact: true }).fill('Sabr-Shukr-2026')
    await page.getByRole('button', { name: 'লগইন', exact: true }).click()
    await expect(page.getByRole('alert').first()).toBeVisible()
    expect(await sessionEmail(page)).toBeNull()

    const mail = await waitForOutbox('email', email, since, { subject: /যাচাই/ })
    await page.goto(linkIn(mail.text, '/verify-email'))
    await expect.poll(() => sessionEmail(page)).toBe(email)
  })

  test('weak passwords and a missing pledge are explained in Bangla', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('পূর্ণ নাম').fill('পরীক্ষা')
    await page.getByLabel('ইমেইল', { exact: true }).fill(`e2e-${uid()}@example.test`)
    await page.getByLabel('পাসওয়ার্ড', { exact: true }).fill('123')
    await page.getByRole('button', { name: 'অ্যাকাউন্ট খুলুন' }).click()
    await expect(page.getByRole('alert').first()).toBeVisible()
    await expect(page).toHaveURL(/\/register/)
  })
})

test.describe('sign in', () => {
  test('with email and password @mobile', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('ইমেইল', { exact: true }).fill(LOGIN_ACCOUNT)
    await page.getByLabel('পাসওয়ার্ড', { exact: true }).fill(SEED_PASSWORD)
    await page.getByRole('button', { name: 'লগইন', exact: true }).click()
    await expect(page).toHaveURL(/\/dashboard/)
    expect(await sessionEmail(page)).toBe(LOGIN_ACCOUNT)
  })

  test('a wrong password is refused', async ({ page }) => {
    await page.goto('/login')
    // an address without an account gets the same answer as a wrong password (no account probing)
    await page.getByLabel('ইমেইল', { exact: true }).fill(`nobody-${uid()}@example.test`)
    await page.getByLabel('পাসওয়ার্ড', { exact: true }).fill('not-the-password')
    await page.getByRole('button', { name: 'লগইন', exact: true }).click()
    await expect(page.getByRole('alert').first()).toBeVisible()
    expect(await sessionEmail(page)).toBeNull()
  })

  test('with a magic link', async ({ page }) => {
    const since = Date.now()
    await page.goto('/login')
    await page.getByRole('button', { name: 'ইমেইলে লগইন লিংক নিন' }).click()
    await page.getByLabel('ইমেইল', { exact: true }).fill(ACCOUNTS.member2)
    await page.getByRole('button', { name: 'লগইন লিংক পাঠান' }).click()

    const mail = await waitForOutbox('email', ACCOUNTS.member2, since, { subject: /লগইন লিংক/ })
    await page.goto(linkIn(mail.text, '/magic-link/verify'))
    await expect.poll(() => sessionEmail(page)).toBe(ACCOUNTS.member2)
  })

  test('with a phone OTP, which also creates the account for a new number @mobile', async ({
    page,
  }) => {
    const phone = freshPhone()
    const e164 = `+88${phone}`
    const since = Date.now()

    await page.goto('/login?mode=phone')
    await page.getByLabel('মোবাইল নম্বর').fill(phone)
    await turnstileReady(page)
    await page.getByRole('button', { name: 'কোড পাঠান' }).click()
    await expect(page.getByRole('group', { name: /অঙ্কের কোড/ })).toBeVisible()

    const sms = await waitForOutbox('sms', e164, since)
    const code = sms.message?.match(/\d{6}/)?.[0]
    expect(code, 'OTP in the SMS').toBeTruthy()

    // a wrong code first: refused, the account stays signed out
    await page.getByLabel('অঙ্ক ১').fill(code === '000000' ? '111111' : '000000')
    await page.getByRole('button', { name: 'যাচাই করে লগইন করুন' }).click()
    await expect(page.getByRole('alert').first()).toBeVisible()

    await page.getByLabel('অঙ্ক ১').fill(code!)
    await page.getByRole('button', { name: 'যাচাই করে লগইন করুন' }).click()
    await expect(page).toHaveURL(/\/dashboard/)
    expect((await currentUser(page))?.phoneNumber).toBe(e164)
  })

  test('with Google or Facebook when configured', async ({ page }) => {
    await page.goto('/login')
    const google = page.getByRole('button', { name: /Google/ })
    const facebook = page.getByRole('button', { name: /Facebook/ })
    const configured = (await google.count()) + (await facebook.count())
    test.skip(
      configured === 0,
      'no OAuth provider configured (GOOGLE_CLIENT_ID / FACEBOOK_CLIENT_ID); the buttons are hidden, as intended',
    )

    // the provider's consent screen is the end of what can run unattended: stop there and check the request
    for (const [button, host] of [
      [google, 'accounts.google.com'],
      [facebook, 'facebook.com'],
    ] as const) {
      if (!(await button.count())) continue
      await page.route(new RegExp(host.replace('.', '\\.')), (route) =>
        route.fulfill({ status: 200, body: 'provider' }),
      )
      await button.click()
      await page.waitForURL(new RegExp(host.replace('.', '\\.')))
      const url = new URL(page.url())
      expect(url.searchParams.get('redirect_uri')).toMatch(
        /\/api\/auth\/callback\/(google|facebook)$/,
      )
      expect(url.searchParams.get('state')).toBeTruthy()
      await page.goto('/login')
    }
  })
})

test.describe('sessions', () => {
  test('signing out everywhere ends other sessions', async ({ browser, page }) => {
    const other = await browser.newContext()
    const otherPage = await other.newPage()
    await routeWithTestIp(otherPage)
    await signInFresh(otherPage, SESSIONS_ACCOUNT)
    await signInFresh(page, SESSIONS_ACCOUNT)

    await page.goto('/settings#sessions')
    await page.getByRole('button', { name: /অন্য সব ডিভাইস থেকে লগআউট/ }).click()
    await expect.poll(async () => currentUser(otherPage)).toBeNull()
    expect(await sessionEmail(page)).toBe(SESSIONS_ACCOUNT)
    await other.close()
  })
})
