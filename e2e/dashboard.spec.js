// @ts-check
import { test, expect } from '@playwright/test'

/**
 * E2E: Authenticated flows — Dashboard, Book modal, Edit vehicle, Calendar.
 * Run with real Supabase + test user; skip in CI unless E2E_AUTH_EMAIL is set.
 * See TESTING.md for "Test after develop" and optional E2E credentials.
 * When hasAuth, tests sign in with email/password (VITE_E2E_EMAIL_AUTH enables the form).
 */
const hasAuth = !!process.env.E2E_AUTH_EMAIL && !!process.env.E2E_AUTH_PASSWORD

async function ensureLoggedIn(page) {
  await page.goto('/')
  const calendarBtn = page.getByRole('button', { name: /calendar overview/i })
  const loginEmail = page.getByTestId('login-email')
  await Promise.race([
    calendarBtn.waitFor({ state: 'visible', timeout: 15000 }),
    loginEmail.waitFor({ state: 'visible', timeout: 15000 }),
  ]).catch(() => {})
  if (await loginEmail.isVisible()) {
    await loginEmail.fill(process.env.E2E_AUTH_EMAIL || '')
    await page.getByTestId('login-password').fill(process.env.E2E_AUTH_PASSWORD || '')
    await page.getByTestId('login-submit').click()
    // Wait for dashboard to be ready (Calendar Overview button visible); works regardless of base path
    await expect(calendarBtn).toBeVisible({ timeout: 20000 })
  }
}

test.describe('Dashboard (authenticated)', () => {
  test.skip(!hasAuth, 'Set E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD to run authenticated E2E')

  test('shows dashboard after login', async ({ page }) => {
    await ensureLoggedIn(page)
    await expect(page.getByRole('button', { name: /calendar overview/i })).toBeVisible({ timeout: 10000 })
  })

  test('vehicles list or empty state is visible', async ({ page }) => {
    await ensureLoggedIn(page)
    await expect(
      page.getByText('Loading fleet data...').or(page.getByText('No vehicles found'))
    ).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Book Vehicle modal (authenticated)', () => {
  test.skip(!hasAuth, 'Requires E2E auth')

  test('Book button opens booking modal', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.getByRole('button', { name: /book/i }).first().click({ timeout: 15000 })
    await expect(page.getByRole('heading', { name: /book vehicle/i })).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Calendar Overview (authenticated)', () => {
  test.skip(!hasAuth, 'Requires E2E auth')

  test('Calendar Overview shows Fleet Calendar', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.getByRole('button', { name: /calendar overview/i }).click({ timeout: 15000 })
    await expect(page.getByRole('heading', { name: /fleet calendar overview/i })).toBeVisible({ timeout: 5000 })
  })
})
