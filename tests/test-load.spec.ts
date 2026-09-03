import { test, expect } from '@playwright/test';

test('Sortable loads', async ({ page }) => {
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.goto('http://localhost:8080/Sortable.js');
  await page.waitForFunction(() => typeof window.Sortable !== 'undefined', { timeout: 10000 });
  
  const sortableType = await page.evaluate(() => typeof window.Sortable);
  console.log('Sortable type:', typeof window.Sortable);
  expect(typeof window.Sortable).toBe('function');
});
