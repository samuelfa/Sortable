import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    // 1. Capturar errores JS de la página y de consola
    page.on('pageerror', error => console.error(`[Browser Error] ${error.message}`));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`[Browser Console Error] ${msg.text()}`);
      }
    });

    // 2. Interceptar navegaciones y validar HTTP 200 automáticamente
    page.on('response', response => {
      const isDocument = response.request().resourceType() === 'document';
      if (isDocument) {
        expect(response.status()).toBe(200);
      }
    });

    await use(page);
  },
});

export { expect };
