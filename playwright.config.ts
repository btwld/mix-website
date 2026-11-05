import { defineConfig, devices } from '@playwright/test';

// Runs against a production server (`pnpm build && pnpm start -p 3100`) or
// any deployed origin via E2E_BASE_URL, e.g. a temporary App Hosting URL.
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3100';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  expect: { timeout: 45_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  use: {
    baseURL,
    // Keep evidence for every failure (plan phase 2 exit check).
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'pnpm start -p 3100',
    url: `${baseURL}/`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
