import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E config for DeltaQuad Fleet Manager.
 * Local dev: http://localhost:5173/uav-fleet-dashboard/
 * E2E uses port 5175 (separate from dev so both can run).
 * @see TESTING.md
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5175/uav-fleet-dashboard/',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npx vite --port 5175',
    url: 'http://localhost:5175/uav-fleet-dashboard/',
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      // Expose email login form for E2E when test credentials are set
      VITE_E2E_EMAIL_AUTH: process.env.E2E_AUTH_EMAIL ? '1' : '',
    },
  },
})
