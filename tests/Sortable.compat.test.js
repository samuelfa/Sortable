import { test, expect } from '@playwright/test';

test.describe('Simple Sorting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/single-list.html');
  });

  test('Sort down list', async ({ page }) => {
    const list1 = page.locator('#list1');

    const dragStartPosition = list1.locator('> *').nth(0);
    const targetStartPosition = list1.locator('> *').nth(2);

    // Get initial text values
    const dragText = await dragStartPosition.innerText();
    const targetText = await targetStartPosition.innerText();

    // Drag first item to third position
    await dragStartPosition.dragTo(targetStartPosition);

    // Verify positions updated
    const dragEndPosition = list1.locator('> *').nth(2);
    const targetEndPosition = list1.locator('> *').nth(1);

    await expect(dragEndPosition).toHaveText(dragText);
    await expect(targetEndPosition).toHaveText(targetText);
  });

  test('Sort up list', async ({ page }) => {
    const list1 = page.locator('#list1');

    const dragStartPosition = list1.locator('> *').nth(2);
    const targetStartPosition = list1.locator('> *').nth(0);

    // Get initial text values
    const dragText = await dragStartPosition.innerText();
    const targetText = await targetStartPosition.innerText();

    // Drag third item to first position
    await dragStartPosition.dragTo(targetStartPosition);

    // Verify positions updated
    const dragEndPosition = list1.locator('> *').nth(0);
    const targetEndPosition = list1.locator('> *').nth(1);

    await expect(dragEndPosition).toHaveText(dragText);
    await expect(targetEndPosition).toHaveText(targetText);
  });
});
