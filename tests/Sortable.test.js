import { test, expect } from './fixtures.js';

const leeway = 2; // Safety buffer for subpixel rounding in Linux CI
const itemHeight = 54; // px

// Helper to drag source element to target element with vertical offset from target center
/**
 * Drags source to target relative to the Wiki center-offset formula
 * and logs telemetry for error diagnostics.
 */
async function dragToThresholdWithDebug(page, source, target, swapThreshold, safetyMarginPx, isAboveThreshold) {
	const sourceBox = await source.boundingBox();
	const targetBox = await target.boundingBox();

	// Wiki Formula Calculations
	const centerPointY = targetBox.y + targetBox.height / 2;
	const boundaryOffsetFromCenter = (targetBox.height / 2) * (1 - swapThreshold);
	const boundaryY = centerPointY + boundaryOffsetFromCenter;

	// Target position calculation
	const targetY = isAboveThreshold ? boundaryY + safetyMarginPx : boundaryY - safetyMarginPx;
	const targetX = targetBox.x + targetBox.width / 2;

	const startX = sourceBox.x + sourceBox.width / 2;
	const startY = sourceBox.y + sourceBox.height / 2;

	const percentageOfTargetHeight = ((targetY - targetBox.y) / targetBox.height) * 100;

	// Telemetry logging (only outputted if test fails)
	if (page.logDebug) {
		page.logDebug(`--- DRAG ATTEMPT TELEMETRY ---`);
		page.logDebug(`Target expected behavior: ${isAboveThreshold ? 'SHOULD SWAP' : 'SHOULD NOT SWAP'}`);
		page.logDebug(`swapThreshold option: ${swapThreshold}`);
		page.logDebug(`safetyMarginPx: ${safetyMarginPx}px`);
		page.logDebug(`Source Box: top=${sourceBox.y}px, height=${sourceBox.height}px`);
		page.logDebug(`Target Box: top=${targetBox.y}px, height=${targetBox.height}px`);
		page.logDebug(`Target Center Y (50%): ${centerPointY}px`);
		page.logDebug(`Boundary Offset from Center: +${boundaryOffsetFromCenter}px`);
		page.logDebug(`Calculated Boundary Line Y (70%): ${boundaryY}px`);
		page.logDebug(`Actual Mouse Target Y: ${targetY}px (${percentageOfTargetHeight.toFixed(2)}% of target height)`);
	}

	// Perform precise drag
	await page.mouse.move(startX, startY);
	await page.mouse.down();
	await page.mouse.move(targetX, targetY, { steps: 1 });
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

	test('Swap threshold - Below limit (should NOT swap)', async ({ page }) => {
	const list1 = page.locator('#list1');

	const dragStartPosition = list1.locator('> *').nth(0);
	const targetStartPosition = list1.locator('> *').nth(1);

	const dragText = await dragStartPosition.innerText();
	const targetText = await targetStartPosition.innerText();

	const swapThreshold = 0.6;
	const safetyMarginPx = 4;

	await page.evaluate((threshold) => {
		Sortable.get(document.getElementById('list1')).option(
			'swapThreshold',
			threshold
		);
	}, swapThreshold);

	// Perform drag below boundary (isAboveThreshold = false)
	await dragToThresholdWithDebug(
		page,
		dragStartPosition,
		targetStartPosition,
		swapThreshold,
		safetyMarginPx,
		false
	);

	// Assert elements have NOT swapped
	await expect(dragStartPosition).toHaveText(dragText);
	await expect(targetStartPosition).toHaveText(targetText);
});

test('Swap threshold - Above limit (SHOULD swap)', async ({ page }) => {
	const list1 = page.locator('#list1');

	const dragStartPosition = list1.locator('> *').nth(0);
	const targetStartPosition = list1.locator('> *').nth(1);

	const dragText = await dragStartPosition.innerText();
	const targetText = await targetStartPosition.innerText();

	const swapThreshold = 0.6;
	const safetyMarginPx = 4;

	await page.evaluate((threshold) => {
		Sortable.get(document.getElementById('list1')).option(
			'swapThreshold',
			threshold
		);
	}, swapThreshold);

	// Perform drag above boundary (isAboveThreshold = true)
	await dragToThresholdWithDebug(
		page,
		dragStartPosition,
		targetStartPosition,
		swapThreshold,
		safetyMarginPx,
		true
	);

	const dragEndPosition = list1.locator('> *').nth(1);
	const targetEndPosition = list1.locator('> *').nth(0);

	// Assert elements HAVE swapped
	await expect(dragEndPosition).toHaveText(dragText);
	await expect(targetEndPosition).toHaveText(targetText);
});
	
	

	test('Invert swap', async ({ page }) => {
		const list1 = page.locator('#list1');

		const dragStartPosition = list1.locator('> *').nth(0);
		const targetStartPosition = list1.locator('> *').nth(1);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		await page.evaluate(() => {
			Sortable.get(document.getElementById('list1')).option('invertSwap', true);
		});

		// Before inverted threshold - should NOT swap
		await dragToWithOffsetY(
			dragStartPosition,
			targetStartPosition,
			Math.round(itemHeight / 2 - leeway)
		);
		await expect(dragStartPosition).toHaveText(dragText);
		await expect(targetStartPosition).toHaveText(targetText);

		// Past inverted threshold - SHOULD swap
		await dragToWithOffsetY(
			dragStartPosition,
			targetStartPosition,
			Math.round(itemHeight / 2 + leeway)
		);

		const dragEndPosition = list1.locator('> *').nth(1);
		const targetEndPosition = list1.locator('> *').nth(0);

		await expect(dragEndPosition).toHaveText(dragText);
		await expect(targetEndPosition).toHaveText(targetText);
	});

	test('Inverted swap threshold', async ({ page }) => {
		const list1 = page.locator('#list1');

		const dragStartPosition = list1.locator('> *').nth(0);
		const targetStartPosition = list1.locator('> *').nth(1);

		const dragText = await dragStartPosition.innerText();
		const targetText = await targetStartPosition.innerText();

		await page.evaluate(() => {
			Sortable.get(document.getElementById('list1')).option('invertSwap', true);
			Sortable.get(document.getElementById('list1')).option(
				'invertedSwapThreshold',
				0.5
			);
		});

		await dragToWithOffsetY(
			dragStartPosition,
			targetStartPosition,
			Math.round(itemHeight - (itemHeight / 2) * 0.5 - leeway)
		);
		await expect(dragStartPosition).toHaveText(dragText);
		await expect(targetStartPosition).toHaveText(targetText);

		await dragToWithOffsetY(
			dragStartPosition,
			targetStartPosition,
			Math.round(itemHeight - (itemHeight / 2) * 0.5 + leeway)
		);

		const dragEndPosition = list1.locator('> *').nth(1);
		const targetEndPosition = list1.locator('> *').nth(0);

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
