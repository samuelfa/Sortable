import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 2 : undefined,
	timeout: 10 * 1000,
	expect: {
		timeout: 5 * 1000,
	},
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		headless: true,
		viewport: { width: 1280, height: 1000 },
		baseURL: 'http://localhost:8080',
		trace: 'on-first-retry',
		actionTimeout: 5 * 1000,
		navigationTimeout: 5 * 1000,
	},
	webServer: {
		command: 'npx serve . -p 8080',
		port: 8080,
		reuseExistingServer: false,
		timeout: 30 * 1000,
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
			hasTouch: false,
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
			hasTouch: false,
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
			hasTouch: false,
		},
		{
			name: 'mobile-touch',
			use: {
				...devices['Pixel 5'],
				hasTouch: true,
				viewport: { width: 393, height: 1400 },
			},
		},
	],
});
