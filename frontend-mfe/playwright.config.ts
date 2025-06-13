import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? 
    // In CI, serve the built files
    [
      {
        command: 'pnpm --filter @restaurant/shell-app preview',
        port: 3000,
        reuseExistingServer: false,
        timeout: 120 * 1000,
      },
      {
        command: 'pnpm --filter @restaurant/menu-mfe preview',
        port: 3001,
        reuseExistingServer: false,
        timeout: 120 * 1000,
      },
      {
        command: 'pnpm --filter @restaurant/orders-mfe preview',
        port: 3002,
        reuseExistingServer: false,
        timeout: 120 * 1000,
      },
      {
        command: 'pnpm --filter @restaurant/kitchen-mfe preview',
        port: 3003,
        reuseExistingServer: false,
        timeout: 120 * 1000,
      },
      {
        command: 'pnpm --filter @restaurant/inventory-mfe preview',
        port: 3004,
        reuseExistingServer: false,
        timeout: 120 * 1000,
      },
      {
        command: 'pnpm --filter @restaurant/reservations-mfe preview',
        port: 3005,
        reuseExistingServer: false,
        timeout: 120 * 1000,
      },
    ] :
    // In development, use dev servers
    [
      {
        command: 'pnpm dev:shell',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120 * 1000,
      },
      {
        command: 'pnpm dev:menu',
        url: 'http://localhost:3001',
        reuseExistingServer: true,
        timeout: 120 * 1000,
      },
      {
        command: 'pnpm dev:orders',
        url: 'http://localhost:3002',
        reuseExistingServer: true,
        timeout: 120 * 1000,
      },
      {
        command: 'pnpm dev:kitchen',
        url: 'http://localhost:3003',
        reuseExistingServer: true,
        timeout: 120 * 1000,
      },
      {
        command: 'pnpm dev:inventory',
        url: 'http://localhost:3004',
        reuseExistingServer: true,
        timeout: 120 * 1000,
      },
      {
        command: 'pnpm dev:reservations',
        url: 'http://localhost:3005',
        reuseExistingServer: true,
        timeout: 120 * 1000,
      },
    ],
});