// @ts-check
import { test, expect } from '@playwright/test'

/**
 * E2E: App loads, login, and unauthenticated behaviour.
 * Authenticated flows (dashboard, Book, Edit, Calendar) require test user — see TESTING.md.
 */
test.describe('App', () => {
  test('home redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login|\/uav-fleet-dashboard\/?$/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('login page is visible', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 15000 })
  })

  test('login page has Google sign-in button', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible({ timeout: 15000 })
  })

  test('unauthenticated user cannot see dashboard content', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
    await expect(page.getByText('DQ Vehicle Dashboard')).not.toBeVisible()
    await expect(page.getByRole('button', { name: /book/i })).not.toBeVisible()
  })
})

test.describe('Login page structure', () => {
  test('shows UAV Fleet Command subtitle', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('UAV Fleet Command')).toBeVisible({ timeout: 15000 })
  })
})
