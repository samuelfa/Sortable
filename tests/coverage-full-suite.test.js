import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import v8toIstanbul from 'v8-to-istanbul';
import libCoverage from 'istanbul-lib-coverage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { createCoverageMap } = libCoverage;

test.describe.configure({ retries: 0 });

let globalCoverageData = [];

test.describe.serial('Full Suite Code Coverage', () => {
	test.beforeAll(async ({ browserName }) => {
		test.skip(
			browserName !== 'chromium',
			'Coverage API only supported on Chromium'
		);
	});

	test('setup: start coverage collector', async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		await page.coverage.startJSCoverage({ resetOnNavigation: false });
		await page.goto('/tests/single-list.html');
		await page.waitForLoadState('networkidle');
		await page.close();
		await context.close();
	});

	test('Simple Sorting - Sort down list', async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		await page.coverage.startJSCoverage({ resetOnNavigation: false });
		await page.goto('/tests/single-list.html');
		await page.waitForLoadState('networkidle');
		await page.dragAndDrop(
			'#list1 > div:nth-child(1)',
			'#list1 > div:nth-child(3)'
		);
		await page.waitForTimeout(200);
		const data = await page.coverage.stopJSCoverage();
		globalCoverageData.push(...data);
		await context.close();
	});

	test('Simple Sorting - Sort up list', async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		await page.coverage.startJSCoverage({ resetOnNavigation: false });
		await page.goto('/tests/single-list.html');
		await page.waitForLoadState('networkidle');
		await page.dragAndDrop(
			'#list1 > div:nth-child(3)',
			'#list1 > div:nth-child(1)'
		);
		await page.waitForTimeout(200);
		const data = await page.coverage.stopJSCoverage();
		globalCoverageData.push(...data);
		await context.close();
	});

	test('Swap threshold - Central active zone', async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		await page.coverage.startJSCoverage({ resetOnNavigation: false });
		await page.goto('/tests/single-list.html');
		await page.waitForLoadState('networkidle');
		await page.dragAndDrop(
			'#list1 > div:nth-child(1)',
			'#list1 > div:nth-child(2)'
		);
		await page.waitForTimeout(200);
		const data = await page.coverage.stopJSCoverage();
		globalCoverageData.push(...data);
		await context.close();
	});

	test('Invert swap - Past outer edge', async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		await page.coverage.startJSCoverage({ resetOnNavigation: false });
		await page.goto('/tests/single-list.html');
		await page.waitForLoadState('networkidle');
		await page.dragAndDrop(
			'#list1 > div:nth-child(1)',
			'#list1 > div:nth-child(5)'
		);
		await page.waitForTimeout(200);
		const data = await page.coverage.stopJSCoverage();
		globalCoverageData.push(...data);
		await context.close();
	});

	test('Grouping - Move to same group', async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		await page.coverage.startJSCoverage({ resetOnNavigation: false });
		await page.goto('/tests/dual-list.html');
		await page.waitForLoadState('networkidle');
		await page.dragAndDrop(
			'#list1 > div:nth-child(1)',
			'#list2 > div:nth-child(2)'
		);
		await page.waitForTimeout(200);
		const data = await page.coverage.stopJSCoverage();
		globalCoverageData.push(...data);
		await context.close();
	});

	test('Handles - Allow dragging using handle', async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		await page.coverage.startJSCoverage({ resetOnNavigation: false });
		await page.goto('/tests/handles.html');
		await page.waitForLoadState('networkidle');
		await page.dragAndDrop('#list1 .handle', '#list1 > div:nth-child(3)');
		await page.waitForTimeout(200);
		const data = await page.coverage.stopJSCoverage();
		globalCoverageData.push(...data);
		await context.close();
	});

	test('Filter - Allow dragging non-filtered', async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		await page.coverage.startJSCoverage({ resetOnNavigation: false });
		await page.goto('/tests/filter.html');
		await page.waitForLoadState('networkidle');
		await page.dragAndDrop(
			'#list1 > div:nth-child(2)',
			'#list1 > div:nth-child(4)'
		);
		await page.waitForTimeout(200);
		const data = await page.coverage.stopJSCoverage();
		globalCoverageData.push(...data);
		await context.close();
	});

	test('Nested - Dragging level 1 to level 0', async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		await page.coverage.startJSCoverage({ resetOnNavigation: false });
		await page.goto('/tests/nested.html');
		await page.waitForLoadState('networkidle');
		await page.dragAndDrop(
			'.list .n1 > div:nth-child(1)',
			'.list > div:nth-child(2)'
		);
		await page.waitForTimeout(200);
		const data = await page.coverage.stopJSCoverage();
		globalCoverageData.push(...data);
		await context.close();
	});

	test('should generate coverage report', async () => {
		const coverageMap = createCoverageMap({});

		for (const entry of globalCoverageData) {
			if (!entry.source || !entry.functions) continue;

			const converter = v8toIstanbul(entry.url, 0, {
				source: entry.source,
			});

			await converter.load();
			converter.applyCoverage(entry.functions);

			const istanbulReport = converter.toIstanbul();
			coverageMap.merge(istanbulReport);
		}

		const outputDir = path.join(__dirname, '..', 'coverage');
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		fs.writeFileSync(
			path.join(outputDir, 'coverage-full-suite.json'),
			JSON.stringify(coverageMap.toJSON(), null, 2)
		);

		console.log('\n--- Full Suite Coverage Summary ---');
		const summary = coverageMap.getCoverageSummary();
		console.log(
			`Statements: ${summary.statements.pct}% (${summary.statements.covered}/${summary.statements.total})`
		);
		console.log(
			`Branches: ${summary.branches.pct}% (${summary.branches.covered}/${summary.branches.total})`
		);
		console.log(
			`Functions: ${summary.functions.pct}% (${summary.functions.covered}/${summary.functions.total})`
		);
		console.log(
			`Lines: ${summary.lines.pct}% (${summary.lines.covered}/${summary.lines.total})`
		);

		expect(summary.statements.pct).toBeGreaterThan(0);
	});
});
