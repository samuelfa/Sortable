import { test as base, expect } from '@playwright/test';

export const test = base.extend({
	page: async ({ page }, use, testInfo) => {
		const logs = [];

		// 1. Capturar errores JS de la página y de consola
		page.on('pageerror', (error) =>
			console.error(`[Browser Error] ${error.message}`)
		);
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				console.error(`[Browser Console Error] ${msg.text()}`);
			} else {
				logs.push(`[Browser ${msg.type()}] ${msg.text()}`);
			}
		});

		page.debugLog = (message) => {
			logs.push(`[Drag Math] ${message}`);
		};

		// 2. Interceptar navegaciones y validar HTTP 200 automáticamente
		page.on('response', (response) => {
			const status = response.status();
			const url = response.url();

			if (status >= 300) {
				const redirectTo = response.headers()['location'] || 'Desconocido';
				console.log(`\n🔴 HTTP ${status} en la petición:`);
				console.log(`   URL solicitada: ${url}`);
				console.log(`   Redirige a:     ${redirectTo}\n`);
			}
			expect(response.status()).toBe(200);
		});

		await use(page);

		if (testInfo.status !== testInfo.expectedStatus) {
			console.log(`\n❌ DEBUG LOGS FOR FAILED TEST: "${testInfo.title}"`);
			console.log('--------------------------------------------------');
			console.log(
				logs.length > 0 ? logs.join('\n') : 'No browser logs captured.'
			);
			console.log('--------------------------------------------------\n');

			// Attach logs directly to Playwright's HTML/GitHub Actions report
			await testInfo.attach('failure-debug-logs.txt', {
				body: logs.join('\n'),
				contentType: 'text/plain',
			});
		}
	},
});

export { expect };
