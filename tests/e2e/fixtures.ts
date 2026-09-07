import { test as base, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

function dragProfile() {
	const name = test.info().project.name;
	const isMobile = name === 'mobile-touch';
	const usesNudge = isMobile || name === 'webkit';
	return {
		steps: usesNudge ? 5 : 1,
		afterDown: usesNudge ? 60 : 100,
		beforeUp: usesNudge ? 120 : 150,
		usesNudge,
	};
}

export async function dragAndDrop(
	page: any,
	source: any,
	target: any,
	options: { sourcePosition?: { x: number; y: number }; targetPosition?: { x: number; y: number } } = {}
) {
	const { steps, afterDown, beforeUp, usesNudge } = dragProfile();
	const sourceBox = await source.boundingBox();
	const targetBox = await target.boundingBox();

	if (!sourceBox || !targetBox) {
		throw new Error("Unable to obtain boundingBox for drag and drop targets.");
	}

	const sourcePos = options.sourcePosition || { x: 0.5, y: 0.5 };
	const startX = sourceBox.x + sourceBox.width * sourcePos.x;
	const startY = sourceBox.y + sourceBox.height * sourcePos.y;

	// Si se pasa targetPosition explícito, se usa sin modificar.
	// Si no, se calcula según la dirección para superar la mitad.
	let targetPosX = 0.5;
	let targetPosY = 0.5;

	if (options.targetPosition) {
		targetPosX = options.targetPosition.x;
		targetPosY = options.targetPosition.y;
	} else {
		const isMovingDown = targetBox.y > sourceBox.y;
		targetPosY = isMovingDown ? 0.8 : 0.2;
	}

	const endX = targetBox.x + targetBox.width * targetPosX;
	const endY = targetBox.y + targetBox.height * targetPosY;

	await page.mouse.move(startX, startY);
	await page.mouse.down();
	if (afterDown) await page.waitForTimeout(afterDown);

	if (usesNudge) {
		await page.mouse.move(startX + 3, startY);
		await page.waitForTimeout(80);
	}

	await page.mouse.move(endX, endY, { steps });
	if (beforeUp) await page.waitForTimeout(beforeUp);
	await page.mouse.up();
}

export const test = base.extend({
	page: async ({ page }, use, testInfo) => {
		const coverageDir = path.resolve('.nyc_output');
		if (process.env.COVERAGE === 'true') {
			if (!fs.existsSync(coverageDir)) {
				fs.mkdirSync(coverageDir, { recursive: true });
			}
		}

		const logs: string[] = [];

		if (testInfo.project.name === 'webkit') {
			await page.addInitScript(() => {
				(window as any).__sortableTestOptions = {
					forceFallback: true,
					supportPointer: false,
				};
			});
		}

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

		page.on("framenavigated", async (frame) => {
			if (frame === page.mainFrame() && !frame.url().startsWith("about:")) {
				try {
					await page.waitForFunction(() => typeof (window as any).Sortable !== "undefined", { timeout: 5000 });
				} catch (e) {
					console.error("⚠️ Sortable no se encontró tras navegar a: " + frame.url());
				}
			}
		});

		(page as any).debugLog = (message: string) => {
			logs.push(`[Drag Math] ${message}`);
		};

		page.on('response', (response) => {
			const status = response.status();
			const url = response.url();

			if (url.includes('favicon.ico')) return;

			if (status >= 300) {
				const redirectTo = response.headers()['location'] || 'Desconocido';
				console.log(`\n🔴 HTTP ${status} en la petición:`);
				console.log(`   URL solicitada: ${url}`);
				console.log(`   Redirige a:     ${redirectTo}\n`);
			}
			expect(response.status()).toBe(200);
		});

		await use(page);

		if (process.env.COVERAGE === 'true') {
			const result = await page.evaluate(() => {
				const keys = Object.getOwnPropertyNames(window);
				const covKeys = keys.filter(
					(k) => k.startsWith('cov_') || k === '__coverage__'
				);
				return {
					allKeys: Object.getOwnPropertyNames(window).filter(
						(k) => k.startsWith('cov_') || k === '__coverage__'
					),
					coverageObj: (window as any).__coverage__,
					covKeys: covKeys,
					globalKeys: Object.getOwnPropertyNames(globalThis).filter(
						(k) => k.startsWith('cov_') || k === '__coverage__'
					),
				};
			});

			const coverage = result.coverageObj;
			if (coverage && Object.keys(coverage).length > 0) {
				const coverageDir = path.resolve('.nyc_output');
				if (!fs.existsSync(coverageDir)) {
					fs.mkdirSync(coverageDir, { recursive: true });
				}
				const fileName = `coverage-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
				fs.writeFileSync(
					path.join(coverageDir, fileName),
					JSON.stringify(coverage)
				);
			}
		}
	},
});

export { expect };
