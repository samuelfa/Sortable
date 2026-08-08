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

	timeout: 10 * 1000,

	expect: {
		timeout: 5 * 1000,
	},
	/* Detailed HTML reporter */
	reporter: process.env.CI ? 'github' : 'list',

	use: {
		headless: true,
        viewport: { width: 1280, height: 720 },
		/* Base URL for the local testing server */
		baseURL: 'http://localhost:8080',

		/* Collect trace when retrying the failed test for easier debugging */
		trace: 'on-first-retry',
		actionTimeout: 5 * 1000,
		navigationTimeout: 5 * 1000,
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
			hasTouch: false, // Forzar comportamiento de ratón/escritorio
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
			hasTouch: false, // Forzar comportamiento de ratón/escritorio
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
			hasTouch: false, // Forzar comportamiento de ratón/escritorio
		},
		{
            name: 'mobile-touch',
            use: { ...devices['Pixel 5'] }, // Emula pantalla táctil y eventos touch reales
            hasTouch: true,
      },
    },
	],
});
