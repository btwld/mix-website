import { readFileSync } from 'node:fs';
import { expect, test, type Request } from '@playwright/test';

const inventory = JSON.parse(readFileSync('docs/migration/pages.json', 'utf8'));
const representative = [
  '/', '/mix/', '/remix/', '/naked-ui/', '/mix/docs/', '/remix/docs/', '/naked-ui/docs/',
  '/mix/docs/guides/animations/', '/remix/docs/tutorials/settings-screen/',
  '/remix/docs/components/button/', '/naked-ui/docs/widget/slider/', '/naked-ui/docs/widget/dialog/',
  '/remix/docs/open-code/install/', '/remix/docs/open-code/cli/', '/remix/docs/components/calendar/',
];
for (const route of representative) expect(inventory.siteRoutes).toContain(route);

for (const width of [1440, 390]) test.describe(`reader navigation at ${width}px`, () => {
  test.use({ viewport: { width, height: 1000 }, isMobile: width < 600, hasTouch: width < 600 });

  test('real corpus routes render without page errors, missing assets or page overflow', async ({ context }) => {
    test.setTimeout(240_000);
    for (const route of representative) {
      // Audit each direct load independently. WebKit reports cancelled imports
      // and prefetches as page errors when a later goto tears down the document.
      // Settle the active page and assert every error before closing it; do not
      // discard matching console messages from a document that is still in use.
      const page = await context.newPage();
      const errors: string[] = [];
      const successfulHeadProbes = new WeakSet<Request>();
      page.on('pageerror', error => errors.push(String(error)));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('response', response => {
        if (response.request().method() === 'HEAD' && response.ok()) successfulHeadProbes.add(response.request());
        if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
      });
      page.on('requestfailed', request => {
        // Chromium reports some successful static HEAD probes as aborted.
        // Require that observed success; failed probes and every failed GET
        // (including scripts, images and data) still fail this audit.
        if (request.failure()?.errorText === 'net::ERR_ABORTED' && successfulHeadProbes.has(request)) return;
        errors.push(`${request.failure()?.errorText} ${request.url()}`);
      });
      try {
        expect((await page.goto(route))?.status(), route).toBe(200);
        await expect(page.locator('h1')).toBeVisible();
        await page.waitForLoadState('networkidle');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route).toBe(true);
        expect(errors, route).toEqual([]);
      } finally {
        await page.close();
      }
    }
  });

  test('project entry points, sidebar order, project switcher and search work', async ({ page }) => {
    for (const project of ['mix', 'remix', 'naked-ui']) {
      await page.goto('/');
      await page.locator('.v2-docs-menu summary').click();
      await page.locator(`.v2-docs-panel a[href="/${project}/docs/"]`).click();
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

});

test('Remix tutorial ZIP downloads its published bytes without route prefetch', async ({ page }) => {
  const asset = '/remix/assets/remix-cli-tutorial/sample-projects.zip';
  const assetRequests: string[] = [];
  page.on('request', request => {
    if (new URL(request.url()).pathname.startsWith(asset)) assetRequests.push(request.url());
  });
  await page.goto('/remix/docs/tutorials/settings-screen/');
  const link = page.getByRole('link', { name: 'sample download', exact: true });
  await expect(link).toHaveAttribute('href', asset);
  await link.scrollIntoViewIfNeeded();
  await link.hover();
  await page.waitForLoadState('networkidle');
  expect(assetRequests, 'assets must not be prefetched as Next routes').toEqual([]);
  const pendingDownload = page.waitForEvent('download');
  await link.click();
  const download = await pendingDownload;
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toBe('sample-projects.zip');
  expect(readFileSync((await download.path())!).equals(readFileSync(`public${asset}`))).toBe(true);
  expect(assetRequests.map(url => new URL(url).pathname)).toEqual([asset]);
  await expect(page).toHaveURL('/remix/docs/tutorials/settings-screen/');
});

test.describe('table scrolling at 390px', () => {
  // Playwright rejects mouse.wheel in mobile WebKit. Use its supported wheel
  // input at the same narrow, touch-capable viewport; actual mobile navigation
  // remains covered above. This still exercises browser scrolling, not scrollLeft.
  test.use({ viewport: { width: 390, height: 1000 }, hasTouch: true, isMobile: false });
  test('wide comparison tables scroll locally to their final column', async ({ page }) => {
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
