import { test, expect, dragAndDrop } from './fixtures.js';

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

	// Desktop: single precise move (native DnD path; extra events cross swap zones).
	// Mobile: several steps + settling so Sortable's pointer fallback engages.
	const isMobile = test.info().project.name === 'mobile-touch';
	const dragSteps = 1;
	const settleAfterDown = isMobile ? 60 : 0;
	const settleBeforeUp = isMobile ? 120 : 0;

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
	if (settleAfterDown) await page.waitForTimeout(settleAfterDown);
	if (isMobile) {
		// Tiny nudge that stays inside the source item: engages Sortable's
		// pointer fallback without hovering any other swap zone.
		await page.mouse.move(startX + 3, startY);
		await page.waitForTimeout(80);
	}
	await page.mouse.move(targetX, targetY, { steps: dragSteps });
	if (settleBeforeUp) await page.waitForTimeout(settleBeforeUp);
	await page.mouse.up();
}

/**
 * Auxiliary method for inverted swap testing (invertSwap: true).
 *
 * Inverted Swap Geometry:
 * - Central Region: Neutral non-swap buffer -> SHOULD NOT SWAP
 * - Top / Bottom Outer Edges: Active swap zones -> SHOULD SWAP
 * - Past Outer Edge: Past element boundary -> SHOULD SWAP
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {import('@playwright/test').Locator} source - Drag source element locator
 * @param {import('@playwright/test').Locator} target - Drag target element locator
 * @param {number} invertedSwapThreshold - Threshold parameter (e.g. 0.5 or 1.0)
 * @param {'center' | 'top' | 'bottom' | 'past_edge'} zone - Target zone to drop into
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

	// Desktop: single precise move (native DnD path; extra events cross swap zones).
	// Mobile: several steps + settling so Sortable's pointer fallback engages.
	const isMobile = test.info().project.name === 'mobile-touch';
	const dragSteps = 1;
	const settleAfterDown = isMobile ? 60 : 0;
	const settleBeforeUp = isMobile ? 120 : 0;
	const safetyMarginPx = 4; // Safety buffer when dragging past outer edges

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
	} else if (zone === 'past_edge') {
		// Position past the bottom edge of the target element
		targetY = targetBottomY + safetyMarginPx;
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
	if (settleAfterDown) await page.waitForTimeout(settleAfterDown);
	if (isMobile) {
		// Tiny nudge that stays inside the source item: engages Sortable's
		// pointer fallback without hovering any other swap zone.
		await page.mouse.move(startX + 3, startY);
		await page.waitForTimeout(80);
	}
	await page.mouse.move(targetX, targetY, { steps: dragSteps });
	if (settleBeforeUp) await page.waitForTimeout(settleBeforeUp);
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

		await dragAndDrop(page, dragStartPosition, targetStartPosition);

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

		await dragAndDrop(page, dragStartPosition, targetStartPosition);

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

	test('Invert swap - Past outer edge (SHOULD swap)', async ({ page }) => {
		const list1 = page.locator('#list1');

		const dragStartPosition = list1.locator('> *').nth(0);
		const targetStartPosition = list1.locator('> *').nth(1);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		await page.evaluate(() => {
			Sortable.get(document.getElementById('list1')).option('invertSwap', true);
		});

		// Default threshold = 1.0.
		// Swapping ONLY occurs when crossing PAST the target element's outer edge.
		await dragToInvertedThresholdWithDebug(
			page,
			dragStartPosition,
			targetStartPosition,
			1.0,
			'past_edge'
		);

		const dragEndPosition = list1.locator('> *').nth(1);
		const targetEndPosition = list1.locator('> *').nth(0);

		await expect(dragEndPosition).toHaveText(dragText);
		await expect(targetEndPosition).toHaveText(targetText);
	});
});

test.describe('Inverted Swap Threshold Matrix', () => {
	const invertedSwapThreshold = 0.5;

	test.beforeEach(async ({ page }) => {
		await page.goto('/tests/single-list.html');
		await page.evaluate((threshold) => {
			Sortable.get(document.getElementById('list1')).option('invertSwap', true);
			Sortable.get(document.getElementById('list1')).option(
				'invertedSwapThreshold',
				threshold
			);
		}, invertedSwapThreshold);
	});

	test('Inverted swap threshold - Central buffer zone (should NOT swap)', async ({
		page,
	}) => {
		const list1 = page.locator('#list1');

		const dragStartPosition = list1.locator('> *').nth(0);
		const targetStartPosition = list1.locator('> *').nth(1);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

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

	// 1. DOWNWARD DRAG - TOP ZONE (NO SWAP)
	test('Downward drag to top zone (should NOT swap)', async ({ page }) => {
		const list1 = page.locator('#list1');
		const dragStartPosition = list1.locator('> *').nth(0);
		const targetStartPosition = list1.locator('> *').nth(1);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		/*
		 * DOWNWARD DRAG TO TOP ZONE:
		 * Dragging Item 0 down to the top region of Item 1 tells SortableJS
		 * to place Item 0 BEFORE Item 1. Since Item 0 is already before Item 1,
		 * the DOM order remains unchanged.
		 */
		await dragToInvertedThresholdWithDebug(
			page,
			dragStartPosition,
			targetStartPosition,
			invertedSwapThreshold,
			'top'
		);

		await expect(dragStartPosition).toHaveText(dragText);
		await expect(targetStartPosition).toHaveText(targetText);
	});

	// 2. DOWNWARD DRAG - BOTTOM ZONE (SHOULD SWAP)
	test('Downward drag to bottom zone (SHOULD swap)', async ({ page }) => {
		const list1 = page.locator('#list1');
		const dragStartPosition = list1.locator('> *').nth(0);
		const targetStartPosition = list1.locator('> *').nth(1);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		/*
		 * DOWNWARD DRAG TO BOTTOM ZONE:
		 * Dragging Item 0 down past the 75% threshold line of Item 1 tells SortableJS
		 * to place Item 0 AFTER Item 1, executing a valid DOM swap.
		 */
		await dragToInvertedThresholdWithDebug(
			page,
			dragStartPosition,
			targetStartPosition,
			invertedSwapThreshold,
			'bottom'
		);

		const dragEndPosition = list1.locator('> *').nth(1);
		const targetEndPosition = list1.locator('> *').nth(0);

		await expect(dragEndPosition).toHaveText(dragText);
		await expect(targetEndPosition).toHaveText(targetText);
	});

	// 3. UPWARD DRAG - BOTTOM ZONE (NO SWAP)
	test('Upward drag to bottom zone (should NOT swap)', async ({ page }) => {
		const list1 = page.locator('#list1');
		const dragStartPosition = list1.locator('> *').nth(1);
		const targetStartPosition = list1.locator('> *').nth(0);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		/*
		 * UPWARD DRAG TO BOTTOM ZONE:
		 * Dragging Item 1 up to the bottom region of Item 0 tells SortableJS
		 * to place Item 1 AFTER Item 0. Since Item 1 is already after Item 0,
		 * no swap occurs.
		 */
		await dragToInvertedThresholdWithDebug(
			page,
			dragStartPosition,
			targetStartPosition,
			invertedSwapThreshold,
			'bottom'
		);

		await expect(dragStartPosition).toHaveText(dragText);
		await expect(targetStartPosition).toHaveText(targetText);
	});

	// 4. UPWARD DRAG - TOP ZONE (SHOULD SWAP)
	test('Upward drag to top zone (SHOULD swap)', async ({ page }) => {
		const list1 = page.locator('#list1');
		const dragStartPosition = list1.locator('> *').nth(1);
		const targetStartPosition = list1.locator('> *').nth(0);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		/*
		 * UPWARD DRAG TO TOP ZONE:
		 * Dragging Item 1 up past the 25% threshold line of Item 0 tells SortableJS
		 * to place Item 1 BEFORE Item 0, executing a valid upward DOM swap.
		 */
		await dragToInvertedThresholdWithDebug(
			page,
			dragStartPosition,
			targetStartPosition,
			invertedSwapThreshold,
			'top'
		);

		const dragEndPosition = list1.locator('> *').nth(0);
		const targetEndPosition = list1.locator('> *').nth(1);

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

		await dragAndDrop(page, dragStartPosition, targetStartPosition, {
			targetPosition: { x: 0.5, y: 0.15 },
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

		await dragAndDrop(page, dragStartPosition, targetStartPosition);

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

		await dragAndDrop(page, dragStartPosition, targetStartPosition, {
			targetPosition: { x: 0.5, y: 0.15 },
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

		await dragAndDrop(page, dragStartPosition, targetStartPosition);

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

		await dragAndDrop(page, dragStartPosition, targetStartPosition, {
			targetPosition: { x: 0.5, y: 0.15 },
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

		await dragAndDrop(page, dragStartPosition, targetStartPosition);

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
		await dragAndDrop(page, handle, targetStartPosition);

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

		await dragAndDrop(page, dragStartPosition, targetStartPosition);

		await expect(dragStartPosition).toHaveText(dragText);
		await expect(targetStartPosition).toHaveText(targetText);
	});

	test('Allow dragging of non-filtered element', async ({ page }) => {
		const list1 = page.locator('#list1');

		const dragStartPosition = list1.locator('> :not(.filtered)').first();
		const targetStartPosition = list1.locator('> *').nth(1);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		await dragAndDrop(page, dragStartPosition, targetStartPosition);

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

		// Origin: Item 2.1 (inside .n1)
		const dragStartPosition = list1n1.locator('> *').nth(0);
		// Target: Item 1.3 (inside #list1)
		const targetStartPosition = list1.locator('> *').nth(2);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		const sourceBox = await dragStartPosition.boundingBox();
		const targetBox = await targetStartPosition.boundingBox();

		// Calculate exact centers to bypass Playwright pointer interception
		const startX = sourceBox.x + sourceBox.width / 2;
		const startY = sourceBox.y + sourceBox.height / 2;

		/*
		 * Due to invertSwap: true on all lists, dropping past the midpoint (80%) of
		 * Item 1.3 inserts dragEl AFTER the target into level 0.
		 */
		const targetX = targetBox.x + targetBox.width / 2;
		const targetY = targetBox.y + targetBox.height * 0.8; // 80% mark of Item 1.3

		await page.mouse.move(startX, startY);
		await page.mouse.down();
		/*
		 * Chromium initiates a native HTML5 drag (dragEl.draggable = true); give the
		 * browser's drag loop time to engage, otherwise the next synthetic events
		 * are swallowed and the drag never completes.
		 */
		await page.waitForTimeout(100);
		await page.mouse.move(targetX, targetY, { steps: 5 });
		await page.waitForTimeout(150);
		await page.mouse.up();

		const dragEndPosition = list1.locator('> *').nth(3);
		const targetEndPosition = list1.locator('> *').nth(2);

		await expect(dragEndPosition).toHaveText(dragText);
		await expect(targetEndPosition).toHaveText(targetText);
	});

	test('Dragging from level 0 to level 2', async ({ page }) => {
		const list1 = page.locator('#list1');
		const list1n2 = page.locator('.n2').first();

		// Origin: Item 1.2 (inside #list1)
		const dragStartPosition = list1.locator('> *').nth(1);
		// Target: Item 3.3 (inside .n2)
		const targetStartPosition = list1n2.locator('> *').nth(2);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		const sourceBox = await dragStartPosition.boundingBox();
		const targetBox = await targetStartPosition.boundingBox();

		const startX = sourceBox.x + sourceBox.width / 2;
		const startY = sourceBox.y + sourceBox.height / 2;

		const targetX = targetBox.x + targetBox.width / 2;
		const targetY = targetBox.y + targetBox.height * 0.8;

		await page.mouse.move(startX, startY);
		await page.mouse.down();
		await page.waitForTimeout(100); // see note in 'Dragging from level 1 to level 0'
		await page.mouse.move(targetX, targetY, { steps: 5 });
		await page.waitForTimeout(150);
		await page.mouse.up();

		// Dropping past the midpoint (80%) inserts dragEl AFTER the target
		const dragEndPosition = list1n2.locator('> *').nth(3);
		const targetEndPosition = list1n2.locator('> *').nth(2);

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
