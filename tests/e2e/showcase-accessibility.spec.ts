import { expect, test } from '@playwright/test';

test('phone source remains readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#hello .v2-code')).toBeVisible();
  await expect(page.locator('#mix-states .v2-code')).toBeVisible();
  await expect(page.locator('#hello .v2-bench-tabs')).toBeHidden();
  await context.close();
});

test('short desktop windows can scroll through all preview notes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 500 });
  await page.goto('/');
  const side = page.locator('#remix .v2-bench-side');
  await expect(side).toHaveCSS('overflow-y', 'auto');
  const lastLink = side.locator('a').last();
  await lastLink.scrollIntoViewIfNeeded();
  await expect(lastLink).toBeInViewport();
});
