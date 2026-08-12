import { test, expect } from './fixtures.js';

const leeway = 2; // Safety buffer for subpixel rounding in Linux CI
const itemHeight = 54; // px

/**
 * Auxiliary method to calculate exact 3-zone geometry, execute direct mouse drag,
 * and record detailed math telemetry to page.debugLog for failure diagnostics.
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {import('@playwright/test').Locator} source - Drag source element locator
 * @param {import('@playwright/test').Locator} target - Drag target element locator
 * @param {number} swapThreshold - SortableJS swapThreshold option (e.g., 0.6)
 * @param {'top' | 'center' | 'bottom'} zone - Target zone to drop into
 */
async function dragToThresholdWithDebug(
	page,
	source,
	target,
	swapThreshold,
	zone
) {
	const sourceBox = await source.boundingBox();
	const targetBox = await target.boundingBox();

	const dragSteps = 1; // Single step prevents path overshoot events in Playwright

	// 1. Calculate 3-zone geometry from target center (50% mark)
	const centerY = targetBox.y + targetBox.height / 2;
	const halfSwapZoneHeight = (targetBox.height * swapThreshold) / 2;

	const upperSwapBoundaryY = centerY - halfSwapZoneHeight;
	const lowerSwapBoundaryY = centerY + halfSwapZoneHeight;
	const targetBottomY = targetBox.y + targetBox.height;

	// 2. Compute exact midpoint target Y for the selected zone
	let targetY;
	let expectedBehavior;

	if (zone === 'top') {
		// Midpoint of the top buffer zone (0% to 20% height)
		targetY = targetBox.y + (upperSwapBoundaryY - targetBox.y) / 2;
		expectedBehavior = 'SHOULD NOT SWAP';
	} else if (zone === 'center') {
		// Midpoint of the central active swap zone (20% to 80% height)
		targetY = centerY;
		expectedBehavior = 'SHOULD SWAP';
	} else if (zone === 'bottom') {
		// Midpoint of the bottom buffer zone (80% to 100% height)
		targetY = lowerSwapBoundaryY + (targetBottomY - lowerSwapBoundaryY) / 2;
		expectedBehavior = 'SHOULD NOT SWAP';
	}

	const startX = sourceBox.x + sourceBox.width / 2;
	const startY = sourceBox.y + sourceBox.height / 2;
	const targetX = targetBox.x + targetBox.width / 2;

	const targetYPercentage = ((targetY - targetBox.y) / targetBox.height) * 100;

	// 3. Log comprehensive telemetry to page.debugLog
	if (page.debugLog) {
		page.debugLog(
			`=== SWAP THRESHOLD TELEMETRY (${zone.toUpperCase()} ZONE) ===`
		);
		page.debugLog(`Expected Behavior: ${expectedBehavior}`);
		page.debugLog(`swapThreshold option: ${swapThreshold}`);
		page.debugLog(
			`Source Box: top=${sourceBox.y}px, height=${sourceBox.height}px`
		);
		page.debugLog(
			`Target Box: top=${targetBox.y}px, height=${targetBox.height}px`
		);
		page.debugLog(`Target Center Y (50%): ${centerY}px`);
		page.debugLog(`Upper Swap Boundary Y (20%): ${upperSwapBoundaryY}px`);
		page.debugLog(`Lower Swap Boundary Y (80%): ${lowerSwapBoundaryY}px`);
		page.debugLog(
			`Actual Mouse Target Y: ${targetY}px (${targetYPercentage.toFixed(2)}% of target height)`
		);
	}

	// 4. Perform direct mouse move to target coordinate
	await page.mouse.move(startX, startY);
	await page.mouse.down();
	await page.mouse.move(targetX, targetY, { steps: dragSteps });
	await page.mouse.up();
}

/**
 * Auxiliary method for inverted swap testing (invertSwap: true).
 *
 * Inverted Swap Geometry:
 * - Central Region: Neutral non-swap buffer -> SHOULD NOT SWAP
 * - Top / Bottom Outer Edges: Active swap zones -> SHOULD SWAP
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {import('@playwright/test').Locator} source - Drag source element locator
 * @param {import('@playwright/test').Locator} target - Drag target element locator
 * @param {number} invertedSwapThreshold - Threshold parameter (e.g. 0.5 or 1.0)
 * @param {'center' | 'top' | 'bottom'} zone - Target zone to drop into
 */
async function dragToInvertedThresholdWithDebug(
	page,
	source,
	target,
	invertedSwapThreshold,
	zone
) {
	const sourceBox = await source.boundingBox();
	const targetBox = await target.boundingBox();

	const dragSteps = 1; // Single step prevents path overshoot events in Playwright

	const centerY = targetBox.y + targetBox.height / 2;
	const neutralBufferHalfHeight =
		(targetBox.height * invertedSwapThreshold) / 2;

	const topSwapBoundaryY = centerY - neutralBufferHalfHeight;
	const bottomSwapBoundaryY = centerY + neutralBufferHalfHeight;
	const targetBottomY = targetBox.y + targetBox.height;

	let targetY;
	let expectedBehavior;

	if (zone === 'center') {
		// Midpoint of target box (50% mark) -> Inside central neutral buffer
		targetY = centerY;
		expectedBehavior = 'SHOULD NOT SWAP';
	} else if (zone === 'top') {
		// Midpoint of top edge swap region (0% to topSwapBoundaryY)
		targetY = targetBox.y + (topSwapBoundaryY - targetBox.y) / 2;
		expectedBehavior = 'SHOULD SWAP';
	} else if (zone === 'bottom') {
		// Midpoint of bottom edge swap region (bottomSwapBoundaryY to targetBottomY)
		targetY = bottomSwapBoundaryY + (targetBottomY - bottomSwapBoundaryY) / 2;
		expectedBehavior = 'SHOULD SWAP';
	}

	const startX = sourceBox.x + sourceBox.width / 2;
	const startY = sourceBox.y + sourceBox.height / 2;
	const targetX = targetBox.x + targetBox.width / 2;

	const targetYPercentage = ((targetY - targetBox.y) / targetBox.height) * 100;

	if (page.debugLog) {
		page.debugLog(
			`=== INVERTED SWAP TELEMETRY (${zone.toUpperCase()} ZONE) ===`
		);
		page.debugLog(`Expected Behavior: ${expectedBehavior}`);
		page.debugLog(
			`invertSwap: true, invertedSwapThreshold: ${invertedSwapThreshold}`
		);
		page.debugLog(
			`Source Box: top=${sourceBox.y}px, height=${sourceBox.height}px`
		);
		page.debugLog(
			`Target Box: top=${targetBox.y}px, height=${targetBox.height}px`
		);
		page.debugLog(`Target Center Y (50%): ${centerY}px`);
		page.debugLog(`Top Swap Boundary Y: ${topSwapBoundaryY}px`);
		page.debugLog(`Bottom Swap Boundary Y: ${bottomSwapBoundaryY}px`);
		page.debugLog(
			`Actual Mouse Target Y: ${targetY}px (${targetYPercentage.toFixed(2)}% of target height)`
		);
	}

	await page.mouse.move(startX, startY);
	await page.mouse.down();
	await page.mouse.move(targetX, targetY, { steps: dragSteps });
	await page.mouse.up();
}

// Helper for manual mouse drag by relative distance (e.g. emptyInsertThreshold tests)
async function dragByOffset(
	page,
	element,
	deltaX,
	deltaY,
	offsetX = 0,
	offsetY = 0
) {
	const box = await element.boundingBox();
	const startX = box.x + offsetX;
	const startY = box.y + offsetY;

	await page.mouse.move(startX, startY);
	await page.mouse.down();
	await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 5 });
	await page.mouse.up();
}

test.describe('Simple Sorting', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/tests/single-list.html');
	});

	test('Sort down list', async ({ page }) => {
		const list1 = page.locator('#list1');

		const dragStartPosition = list1.locator('> *').nth(0);
		const targetStartPosition = list1.locator('> *').nth(2);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		await dragStartPosition.dragTo(targetStartPosition);

		const dragEndPosition = list1.locator('> *').nth(2);
		const targetEndPosition = list1.locator('> *').nth(1);

		await expect(dragEndPosition).toHaveText(dragText);
		await expect(targetEndPosition).toHaveText(targetText);
	});

	test('Sort up list', async ({ page }) => {
		const list1 = page.locator('#list1');

		const dragStartPosition = list1.locator('> *').nth(2);
		const targetStartPosition = list1.locator('> *').nth(0);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		await dragStartPosition.dragTo(targetStartPosition);

		const dragEndPosition = list1.locator('> *').nth(0);
		const targetEndPosition = list1.locator('> *').nth(1);

		await expect(dragEndPosition).toHaveText(dragText);
		await expect(targetEndPosition).toHaveText(targetText);
	});

	test('Swap threshold - Top buffer zone (should NOT swap)', async ({
		page,
	}) => {
		const list1 = page.locator('#list1');

		const dragStartPosition = list1.locator('> *').nth(0);
		const targetStartPosition = list1.locator('> *').nth(1);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		const swapThreshold = 0.6;

		await page.evaluate((threshold) => {
			Sortable.get(document.getElementById('list1')).option(
				'swapThreshold',
				threshold
			);
		}, swapThreshold);

		// Drag to the top buffer zone (0% to 20% height -> 67.4px Y)
		await dragToThresholdWithDebug(
			page,
			dragStartPosition,
			targetStartPosition,
			swapThreshold,
			'top'
		);

		// Assert elements have NOT swapped
		await expect(dragStartPosition).toHaveText(dragText);
		await expect(targetStartPosition).toHaveText(targetText);
	});

	test('Swap threshold - Central active zone (SHOULD swap)', async ({
		page,
	}) => {
		const list1 = page.locator('#list1');

		const dragStartPosition = list1.locator('> *').nth(0);
		const targetStartPosition = list1.locator('> *').nth(1);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		const swapThreshold = 0.6;

		await page.evaluate((threshold) => {
			Sortable.get(document.getElementById('list1')).option(
				'swapThreshold',
				threshold
			);
		}, swapThreshold);

		// Drag to the central active zone (20% to 80% height -> 89px Y)
		await dragToThresholdWithDebug(
			page,
			dragStartPosition,
			targetStartPosition,
			swapThreshold,
			'center'
		);

		const dragEndPosition = list1.locator('> *').nth(1);
		const targetEndPosition = list1.locator('> *').nth(0);

		// Assert elements HAVE swapped
		await expect(dragEndPosition).toHaveText(dragText);
		await expect(targetEndPosition).toHaveText(targetText);
	});

	test('Swap threshold - Bottom buffer zone (should NOT swap)', async ({
		page,
	}) => {
		const list1 = page.locator('#list1');

		const dragStartPosition = list1.locator('> *').nth(0);
		const targetStartPosition = list1.locator('> *').nth(1);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		const swapThreshold = 0.6;

		await page.evaluate((threshold) => {
			Sortable.get(document.getElementById('list1')).option(
				'swapThreshold',
				threshold
			);
		}, swapThreshold);

		// Drag to the bottom buffer zone (80% to 100% height -> 110.6px Y)
		await dragToThresholdWithDebug(
			page,
			dragStartPosition,
			targetStartPosition,
			swapThreshold,
			'bottom'
		);

		// Assert elements have NOT swapped
		await expect(dragStartPosition).toHaveText(dragText);
		await expect(targetStartPosition).toHaveText(targetText);
	});

	test('Invert swap - by defaull all is buffer zone (should NOT swap)', async ({
		page,
	}) => {
		const list1 = page.locator('#list1');

		const dragStartPosition = list1.locator('> *').nth(0);
		const targetStartPosition = list1.locator('> *').nth(1);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		await page.evaluate(() => {
			Sortable.get(document.getElementById('list1')).option('invertSwap', true);
		});

		// Default inverted threshold is 1.0 (50% central neutral buffer)
		const invertedSwapThreshold = 1.0;

		// Dragging into the center should NOT trigger a swap in inverted mode
		await dragToInvertedThresholdWithDebug(
			page,
			dragStartPosition,
			targetStartPosition,
			invertedSwapThreshold,
			'center'
		);

		// Assert elements HAVE NOT swapped
		await expect(dragStartPosition).toHaveText(dragText);
		await expect(targetStartPosition).toHaveText(targetText);
	});

	test('Inverted swap threshold - Central buffer zone (should NOT swap)', async ({
		page,
	}) => {
		const list1 = page.locator('#list1');

		const dragStartPosition = list1.locator('> *').nth(0);
		const targetStartPosition = list1.locator('> *').nth(1);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		const invertedSwapThreshold = 0.5;

		await page.evaluate((threshold) => {
			Sortable.get(document.getElementById('list1')).option('invertSwap', true);
			Sortable.get(document.getElementById('list1')).option(
				'invertedSwapThreshold',
				threshold
			);
		}, invertedSwapThreshold);

		// Dragging into center neutral buffer (25% to 75% height) should NOT swap
		await dragToInvertedThresholdWithDebug(
			page,
			dragStartPosition,
			targetStartPosition,
			invertedSwapThreshold,
			'center'
		);

		// Assert elements HAVE NOT swapped
		await expect(dragStartPosition).toHaveText(dragText);
		await expect(targetStartPosition).toHaveText(targetText);
	});

	test('Inverted swap threshold - Top edge zone (SHOULD swap)', async ({
		page,
	}) => {
		const list1 = page.locator('#list1');

		const dragStartPosition = list1.locator('> *').nth(0);
		const targetStartPosition = list1.locator('> *').nth(1);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		const invertedSwapThreshold = 0.5;

		await page.evaluate((threshold) => {
			Sortable.get(document.getElementById('list1')).option('invertSwap', true);
			Sortable.get(document.getElementById('list1')).option(
				'invertedSwapThreshold',
				threshold
			);
		}, invertedSwapThreshold);

		// Dragging into top edge active zone (0% to 25% height) SHOULD swap
		await dragToInvertedThresholdWithDebug(
			page,
			dragStartPosition,
			targetStartPosition,
			invertedSwapThreshold,
			'top'
		);

		const dragEndPosition = list1.locator('> *').nth(1);
		const targetEndPosition = list1.locator('> *').nth(0);

		// Assert elements HAVE swapped
		await expect(dragEndPosition).toHaveText(dragText);
		await expect(targetEndPosition).toHaveText(targetText);
	});
});

test.describe('Grouping', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/tests/dual-list.html');
	});

	test('Move to list of the same group', async ({ page }) => {
		const list1 = page.locator('#list1');
		const list2 = page.locator('#list2');

		const dragStartPosition = list1.locator('> *').nth(0);
		const targetStartPosition = list2.locator('> *').nth(0);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		await page.evaluate(() => {
			Sortable.get(document.getElementById('list2')).option('group', 'shared');
		});

		await dragStartPosition.dragTo(targetStartPosition, {
			sourcePosition: { x: 0, y: 0 },
			targetPosition: { x: 0, y: 0 },
		});

		const dragEndPosition = list2.locator('> *').nth(0);
		const targetEndPosition = list2.locator('> *').nth(1);

		await expect(dragEndPosition).toHaveText(dragText);
		await expect(targetEndPosition).toHaveText(targetText);
	});

	test('Do not move to list of different group', async ({ page }) => {
		const list1 = page.locator('#list1');
		const list2 = page.locator('#list2');

		const dragStartPosition = list1.locator('> *').nth(0);
		const targetStartPosition = list2.locator('> *').nth(0);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		await page.evaluate(() => {
			Sortable.get(document.getElementById('list2')).option('group', null);
		});

		await dragStartPosition.dragTo(targetStartPosition, {
			sourcePosition: { x: 0, y: 0 },
			targetPosition: { x: 0, y: 0 },
		});

		await expect(dragStartPosition).toHaveText(dragText);
		await expect(targetStartPosition).toHaveText(targetText);
	});

	test('Move to list with put:true', async ({ page }) => {
		const list1 = page.locator('#list1');
		const list2 = page.locator('#list2');

		const dragStartPosition = list1.locator('> *').nth(0);
		const targetStartPosition = list2.locator('> *').nth(0);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		await page.evaluate(() => {
			Sortable.get(document.getElementById('list2')).option('group', {
				put: true,
			});
		});

		await dragStartPosition.dragTo(targetStartPosition, {
			sourcePosition: { x: 0, y: 0 },
			targetPosition: { x: 0, y: 0 },
		});

		const dragEndPosition = list2.locator('> *').nth(0);
		const targetEndPosition = list2.locator('> *').nth(1);

		await expect(dragEndPosition).toHaveText(dragText);
		await expect(targetEndPosition).toHaveText(targetText);
	});

	test('Do not move from list with pull:false', async ({ page }) => {
		const list1 = page.locator('#list1');
		const list2 = page.locator('#list2');

		const dragStartPosition = list1.locator('> *').nth(0);
		const targetStartPosition = list2.locator('> *').nth(0);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		await page.evaluate(() => {
			Sortable.get(document.getElementById('list1')).option('group', {
				pull: false,
			});
		});

		await dragStartPosition.dragTo(targetStartPosition, {
			sourcePosition: { x: 0, y: 0 },
			targetPosition: { x: 0, y: 0 },
		});

		await expect(dragStartPosition).toHaveText(dragText);
		await expect(targetStartPosition).toHaveText(targetText);
	});

	test('Clone element if pull:"clone"', async ({ page }) => {
		const list1 = page.locator('#list1');
		const list2 = page.locator('#list2');

		const dragStartPosition = list1.locator('> *').nth(0);
		const targetStartPosition = list2.locator('> *').nth(0);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		await page.evaluate(() => {
			Sortable.get(document.getElementById('list1')).option('group', {
				pull: 'clone',
			});
			Sortable.get(document.getElementById('list2')).option('group', {
				put: true,
			});
		});

		await dragStartPosition.dragTo(targetStartPosition, {
			sourcePosition: { x: 0, y: 0 },
			targetPosition: { x: 0, y: 0 },
		});

		const dragEndPosition = list2.locator('> *').nth(0);
		const targetEndPosition = list2.locator('> *').nth(1);

		await expect(dragStartPosition).toHaveText(dragText); // clone remains in list1
		await expect(dragEndPosition).toHaveText(dragText); // copied into list2
		await expect(targetEndPosition).toHaveText(targetText);
	});
});

test.describe('Handles', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/tests/handles.html');
	});

	test('Do not allow dragging not using handle', async ({ page }) => {
		const list1 = page.locator('#list1');

		const dragStartPosition = list1.locator('> *').nth(0);
		const targetStartPosition = list1.locator('> *').nth(1);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		await dragStartPosition.dragTo(targetStartPosition);

		await expect(dragStartPosition).toHaveText(dragText);
		await expect(targetStartPosition).toHaveText(targetText);
	});

	test('Allow dragging using handle', async ({ page }) => {
		const list1 = page.locator('#list1');

		const dragStartPosition = list1.locator('> *').nth(0);
		const targetStartPosition = list1.locator('> *').nth(1);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		const handle = dragStartPosition.locator('.handle');
		await handle.dragTo(targetStartPosition);

		const dragEndPosition = list1.locator('> *').nth(1);
		const targetEndPosition = list1.locator('> *').nth(0);

		await expect(dragEndPosition).toHaveText(dragText);
		await expect(targetEndPosition).toHaveText(targetText);
	});
});

test.describe('Filter', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/tests/filter.html');
	});

	test('Do not allow dragging of filtered element', async ({ page }) => {
		const list1 = page.locator('#list1');

		const dragStartPosition = list1.locator('> .filtered').first();
		const targetStartPosition = list1.locator('> *:not(.filtered)').first();

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		await dragStartPosition.dragTo(targetStartPosition);

		await expect(dragStartPosition).toHaveText(dragText);
		await expect(targetStartPosition).toHaveText(targetText);
	});

	test('Allow dragging of non-filtered element', async ({ page }) => {
		const list1 = page.locator('#list1');

		const dragStartPosition = list1.locator('> :not(.filtered)').first();
		const targetStartPosition = list1.locator('> *').nth(1);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		await dragStartPosition.dragTo(targetStartPosition);

		const dragEndPosition = list1.locator('> *').nth(1);
		const targetEndPosition = list1.locator('> *').nth(0);

		await expect(dragEndPosition).toHaveText(dragText);
		await expect(targetEndPosition).toHaveText(targetText);
	});
});

test.describe('Nested', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/tests/nested.html');
	});

	test('Dragging from level 1 to level 0', async ({ page }) => {
		const list1 = page.locator('#list1');
		const list1n1 = page.locator('.n1').first();

		const dragStartPosition = list1n1.locator('> *').nth(0);
		const targetStartPosition = list1.locator('> *').nth(2);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		await dragStartPosition.dragTo(targetStartPosition, {
			targetPosition: { x: 10, y: 10 },
		});

		const dragEndPosition = list1.locator('> *').nth(2);
		const targetEndPosition = list1.locator('> *').nth(3);

		await expect(dragEndPosition).toHaveText(dragText);
		await expect(targetEndPosition).toHaveText(targetText);
	});

	test('Dragging from level 0 to level 2', async ({ page }) => {
		const list1 = page.locator('#list1');
		const list1n2 = page.locator('.n2').first();

		const dragStartPosition = list1.locator('> *').nth(1);
		const targetStartPosition = list1n2.locator('> *').nth(2);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		await dragStartPosition.dragTo(targetStartPosition, {
			targetPosition: { x: 10, y: 10 },
		});

		const dragEndPosition = list1n2.locator('> *').nth(2);
		const targetEndPosition = list1n2.locator('> *').nth(3);

		await expect(dragEndPosition).toHaveText(dragText);
		await expect(targetEndPosition).toHaveText(targetText);
	});
});

test.describe('Empty Insert', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/tests/empty-list.html');
	});

	test('Insert into empty list if within emptyInsertThreshold', async ({
		page,
	}) => {
		const list1 = page.locator('#list1');
		const list2 = page.locator('#list2');

		const threshold = await page.evaluate(() =>
			Sortable.get(document.getElementById('list2')).option(
				'emptyInsertThreshold'
			)
		);

		const dragStartPosition = list1.locator('> *').nth(0);
		const dragText = await dragStartPosition.innerText();

		const dragBox = await dragStartPosition.boundingBox();
		const list2Box = await list2.boundingBox();

		const deltaX = Math.round(list2Box.x - dragBox.x) - (threshold - 1);
		const deltaY = -(threshold - 1);

		await dragByOffset(page, dragStartPosition, deltaX, deltaY);

		const dragEndPosition = list2.locator('> *').nth(0);
		await expect(dragEndPosition).toHaveText(dragText);
	});

	test('Do not insert into empty list if outside emptyInsertThreshold', async ({
		page,
	}) => {
		const list1 = page.locator('#list1');
		const list2 = page.locator('#list2');

		const threshold = await page.evaluate(() =>
			Sortable.get(document.getElementById('list2')).option(
				'emptyInsertThreshold'
			)
		);

		const dragStartPosition = list1.locator('> *').nth(0);
		const dragText = await dragStartPosition.innerText();

		const dragBox = await dragStartPosition.boundingBox();
		const list2Box = await list2.boundingBox();

		const deltaX = Math.round(list2Box.x - dragBox.x) - (threshold + 1);
		const deltaY = -(threshold + 1);

		await dragByOffset(page, dragStartPosition, deltaX, deltaY);

		await expect(dragStartPosition).toHaveText(dragText);
	});
});
