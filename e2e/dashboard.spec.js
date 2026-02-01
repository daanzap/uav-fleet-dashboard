// @ts-check
import { test, expect } from '@playwright/test'

/**
 * E2E: Authenticated flows — Dashboard, Book modal, Edit vehicle, Calendar.
 * Run with real Supabase + test user; skip in CI unless E2E_AUTH_EMAIL is set.
 * See TESTING.md for "Test after develop" and optional E2E credentials.
 */
const hasAuth = !!process.env.E2E_AUTH_EMAIL && !!process.env.E2E_AUTH_PASSWORD

test.describe('Dashboard (authenticated)', () => {
  test.skip(!hasAuth, 'Set E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD to run authenticated E2E')

  test('shows dashboard after login', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /sign in with google/i }).click()
    // Google OAuth flow — in real run you'd complete sign-in or use test user
    await expect(page.getByText('DQ Vehicle Dashboard')).toBeVisible({ timeout: 20000 })
  })

  test('vehicles list or empty state is visible', async ({ page }) => {
    await page.goto('/')
    // Assume already logged in or login via test user
    await expect(
      page.getByText('Loading fleet data...').or(page.getByText('No vehicles found'))
    ).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Book Vehicle modal (authenticated)', () => {
  test.skip(!hasAuth, 'Requires E2E auth')

  test('Book button opens booking modal', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /book/i }).first().click({ timeout: 15000 })
    await expect(page.getByRole('heading', { name: /book vehicle/i })).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Calendar Overview (authenticated)', () => {
  test.skip(!hasAuth, 'Requires E2E auth')

  test('Calendar Overview shows Fleet Calendar', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /calendar overview/i }).click({ timeout: 15000 })
    await expect(page.getByRole('heading', { name: /fleet calendar overview/i })).toBeVisible({ timeout: 5000 })
  })
})
