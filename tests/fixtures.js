import { test as base, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Drag-and-drop via raw mouse events.
 *
 * locator.dragTo() performs a single-step move that is unreliable here.
 * On desktop Chromium, Sortable sets dragEl.draggable = true on mousedown and
 * drives the drag through the browser's native HTML5 DnD loop, so a single
 * precise move must be used (extra intermediate events cross swap zones).
 * Mobile emulation never fires dragstart, so Sortable falls back to pointer
 * events, which need several move steps and a beat of settling to engage.
 */
function dragProfile() {
	const name = test.info().project.name;
	const isMobile = name === 'mobile-touch';
	// WebKit runs on the forced fallback path (see page fixture): it activates on
	// the first move and needs a follow-up move to process the insertion, so it
	// uses the same nudge pattern as mobile.
	const usesNudge = isMobile || name === 'webkit';
	return {
		steps: 1,
		// Settling after mousedown lets every engine's native HTML5 drag loop
		// engage before the move (WebKit and Chromium both race without it).
		afterDown: usesNudge ? 60 : 100,
		beforeUp: usesNudge ? 120 : 150,
		isMobile: usesNudge,
	};
}

export async function dragAndDrop(
	page,
	source,
	target,
	{
		sourcePosition = { x: 0.5, y: 0.5 },
		targetPosition = { x: 0.5, y: 0.5 },
	} = {}
) {
	const { steps, afterDown, beforeUp, isMobile } = dragProfile();
	const sourceBox = await source.boundingBox();
	const targetBox = await target.boundingBox();
	const startX = sourceBox.x + sourceBox.width * sourcePosition.x;
	const startY = sourceBox.y + sourceBox.height * sourcePosition.y;

	await page.mouse.move(startX, startY);
	await page.mouse.down();
	if (afterDown) await page.waitForTimeout(afterDown);
	if (isMobile) {
		// Tiny nudge that stays inside the source item: engages Sortable's
		// pointer fallback without hovering any other swap zone.
		await page.mouse.move(startX + 3, startY);
		await page.waitForTimeout(80);
	}
	await page.mouse.move(
		targetBox.x + targetBox.width * targetPosition.x,
		targetBox.y + targetBox.height * targetPosition.y,
		{
			steps,
		}
	);
	if (beforeUp) await page.waitForTimeout(beforeUp);
	await page.mouse.up();
}

export const test = base.extend({
	page: async ({ page }, use, testInfo) => {
		// Coverage collection for Istanbul
		const coverageDir = path.resolve('.nyc_output');
		if (process.env.COVERAGE === 'true') {
			if (!fs.existsSync(coverageDir)) {
				fs.mkdirSync(coverageDir, { recursive: true });
			}
		}

		// 1. Capture JS errors from page and console
		const logs = [];

		/*
		 * WebKit's native HTML5 drag races the synthetic input stream under
		 * parallel workers (drags silently drop). Force Sortable's deterministic
		 * pointer-fallback path there; other engines keep native DnD coverage.
		 */
		if (testInfo.project.name === 'webkit') {
			await page.addInitScript(() => {
				window.__sortableTestOptions = {
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

		page.debugLog = (message) => {
			logs.push(`[Drag Math] ${message}`);
		};

		// 2. Intercept navigations and validate HTTP 200 automatically
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

		// Collect Istanbul coverage from browser
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
					coverageObj: window.__coverage__,
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
