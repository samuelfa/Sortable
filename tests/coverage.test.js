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

test.describe.serial('Code Coverage', () => {
	let coverageData = [];

	test.beforeAll(async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();

		await page.coverage.startJSCoverage({ resetOnNavigation: false });

		await page.goto('/tests/single-list.html');
		await page.waitForLoadState('networkidle');

		await page.waitForTimeout(500);

		await page.dragAndDrop(
			'#list1 > div:nth-child(1)',
			'#list1 > div:nth-child(3)'
		);
		await page.waitForTimeout(500);

		coverageData = await page.coverage.stopJSCoverage();

		await context.close();
	});

	test('should collect coverage data', () => {
		expect(coverageData.length).toBeGreaterThan(0);
	});

	test('should generate coverage report', async () => {
		const coverageMap = createCoverageMap({});

		for (const entry of coverageData) {
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
			path.join(outputDir, 'coverage.json'),
			JSON.stringify(coverageMap.toJSON(), null, 2)
		);

		console.log('\n--- Coverage Summary ---');
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
