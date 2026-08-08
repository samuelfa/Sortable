import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel to speed up execution */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI to ensure stability */
  workers: process.env.CI ? 1 : undefined,
  
  /* Detailed HTML reporter */
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    headless: true,

    /* Base URL for the local testing server */
    baseURL: 'http://localhost:8080/tests',

    /* Collect trace when retrying the failed test for easier debugging */
    trace: 'on-first-retry',

    /* Enable touch events (essential for SortableJS mobile testing) */
    hasTouch: true,
  },

  webServer: {
    command: 'npx serve . -p 8080',
    port: 8080,
    reuseExistingServer: !process.env.CI,
    timeout: 10 * 1000,
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
  ],

  /* Automatically spin up the local dev server before starting the tests */
  webServer: {
    command: 'npx http-server . -p 8080 -c-1',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
