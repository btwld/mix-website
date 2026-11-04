import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const inventory = JSON.parse(readFileSync('docs/migration/pages.json', 'utf8'));
const representative = [
  '/', '/mix/', '/remix/', '/naked-ui/', '/mix/docs/', '/remix/docs/', '/naked-ui/docs/',
  '/mix/docs/guides/animations/', '/remix/docs/tutorials/settings-screen/',
  '/remix/docs/components/button/', '/naked-ui/docs/widget/slider/', '/naked-ui/docs/widget/dialog/',
];
for (const route of representative) expect(inventory.siteRoutes).toContain(route);

for (const width of [1440, 390]) test.describe(`reader navigation at ${width}px`, () => {
  test.use({ viewport: { width, height: 1000 }, isMobile: width < 600, hasTouch: width < 600 });

  test('real corpus routes render without page errors, missing assets or page overflow', async ({ page }) => {
    test.setTimeout(240_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    for (const route of representative) {
      expect((await page.goto(route))?.status(), route).toBe(200);
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route).toBe(true);
    }
    expect(errors).toEqual([]);
  });

  test('project entry points, sidebar order, project switcher and search work', async ({ page }) => {
    for (const name of ['Mix', 'Remix', 'Naked UI']) {
      await page.goto('/');
      const card = page.getByRole('region', { name, exact: true });
      await card.getByRole('link', { name: 'Get started', exact: true }).click();
      await expect(page.locator('h1')).toBeVisible();
      await expect(page).toHaveURL(/\/(mix|remix|naked-ui)\/docs\//);
    }
    await page.goto('/mix/docs/');
    await expect(page.locator('main a').filter({ hasText: 'Introduction' }).first()).toBeVisible();
    const cards = page.locator('main a[href^="/mix/docs/"]');
    expect(await cards.first().getAttribute('href')).toBe('/mix/docs/overview/getting-started/');
    if (width < 600) await page.getByRole('button', { name: 'Open Sidebar', exact: true }).click();
    await page.getByRole('button', { name: 'Projects', exact: true }).click();
    await page.locator('a[href="/naked-ui/docs/"]:visible').first().click();
    await expect(page).toHaveURL('/naked-ui/docs/');
    await page.getByRole('button', { name: /search/i }).filter({ visible: true }).first().click();
    await page.getByPlaceholder('Search Mix, Remix, and Naked UI').fill('showNakedAlertDialog');
    const result = page.locator('[data-result-url*="/naked-ui/docs/widget/dialog"]');
    await expect(result.first()).toBeVisible();
    await result.first().click();
    await expect(page).toHaveURL(/\/naked-ui\/docs\/widget\/dialog\//);
    await expect(page.locator('#shownakedalertdialog')).toBeAttached();
  });

  if (width < 600) test('wide comparison tables scroll locally to their final column', async ({ page }) => {
    await page.goto('/mix/docs/guides/animations/');
    await page.locator('table').first().evaluate(table => {
      let container = table.parentElement;
      while (container && !(/auto|scroll/.test(getComputedStyle(container).overflowX) && container.scrollWidth > container.clientWidth)) container = container.parentElement;
      if (!container || container === document.body || container === document.documentElement) throw new Error('Table has no local scrolling container');
      container.setAttribute('data-review-scroll', 'table');
    });
    const scroller = page.locator('[data-review-scroll="table"]');
    await scroller.scrollIntoViewIfNeeded();
    const bounds = (await scroller.boundingBox())!;
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.wheel(10_000, 0);
    await expect.poll(() => scroller.evaluate(container => {
      const last = container.querySelector('tr')?.lastElementChild?.getBoundingClientRect();
      return { moved: container.scrollLeft > 0, finalColumnVisible: !!last && last.right <= container.getBoundingClientRect().right + 1 };
    })).toEqual({ moved: true, finalColumnVisible: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
});
