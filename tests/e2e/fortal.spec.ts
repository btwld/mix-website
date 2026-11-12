import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const FORTAL = '/remix/examples/fortal/';
// Every font the app declares, icons included. A dropped font request leaves
// icons as empty boxes, so each one must be fetched and answered.
const fonts: string[] = JSON.parse(readFileSync(`public${FORTAL}assets/FontManifest.json`, 'utf8'))
  .flatMap((family: { fonts: { asset: string }[] }) => family.fonts.map(font => `${FORTAL}assets/${font.asset}`));

/**
 * Watches the Fortal document for errors and for the font requests it makes.
 * A page being left cancels its own requests; those are not the Fortal site's.
 */
function watch(page: Page) {
  const problems: string[] = [];
  const loaded = new Map<string, number>();
  let here = page.url().includes(FORTAL);
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) here = frame.url().includes(FORTAL); });
  page.on('console', message => { if (here && message.type() === 'error') problems.push(message.text()); });
  page.on('pageerror', error => { if (here) problems.push(String(error)); });
  page.on('requestfailed', request => { if (request.url().includes(FORTAL)) problems.push(`${request.url()}: ${request.failure()?.errorText}`); });
  page.on('response', response => {
    const { pathname } = new URL(response.url());
    if (pathname.startsWith(`${FORTAL}assets/`)) loaded.set(decodeURI(pathname), response.status());
    if (here && response.status() >= 400) problems.push(`${response.status()} ${response.url()}`);
  });
  return { problems, loaded };
}

/** The app is running: its view is in place and every declared font arrived. */
async function expectRunning(page: Page, { problems, loaded }: ReturnType<typeof watch>) {
  await expect(page.locator('flutter-view, flt-glass-pane').first()).toBeAttached({ timeout: 90_000 });
  expect(await page.evaluate(() => document.baseURI)).toMatch(/\/fortal\/$/);
  await expect.poll(() => fonts.filter(font => loaded.get(font) === 200).length, { timeout: 60_000 }).toBe(fonts.length);
  expect(problems, problems.join('\n').slice(0, 2000)).toEqual([]);
}

test.describe('Fortal site', () => {
  test('declares its icon and text fonts', () => {
    expect(fonts.some(font => /remix_ui_icons/.test(font))).toBe(true);
    expect(fonts.some(font => /Geist-Regular\.ttf$/.test(font))).toBe(true);
    expect(fonts.some(font => /RobotoMono\.ttf$/.test(font))).toBe(true);
  });

  for (const [name, viewport] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]] as const) {
    test(`loads at its own base href on a ${name} screen with its fonts and no errors`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const watched = watch(page);
      const response = await page.goto(FORTAL);
      expect(response?.status()).toBe(200);
      expect(response?.headers()['cache-control']).toBe('public, max-age=0, must-revalidate');
      expect(response?.headers()['x-robots-tag']).toBe('noindex, nofollow');
      await expectRunning(page, watched);
    });
  }

  test('serves its WebAssembly build and its licences', async ({ request }) => {
    for (const [file, type] of [['main.dart.wasm', 'application/wasm'], ['main.dart.js', 'javascript'], ['flutter_bootstrap.js', 'javascript']]) {
      const response = await request.get(`${FORTAL}${file}`);
      expect(response.status(), file).toBe(200);
      expect(response.headers()['content-type'], file).toContain(type);
    }
    for (const file of ['Geist-OFL.txt', 'RobotoMono-OFL.txt', 'web-ocean-MIT.txt', 'photo-credit.md']) {
      expect((await request.get(`${FORTAL}licenses/${file}`)).status(), file).toBe(200);
    }
  });
});

test.describe('links to the Fortal site', () => {
  // The docs menu opens Flutter apps in a new tab, as it does the catalog.
  for (const [route, name, newTab] of [
    ['/', 'Fortal, a design system built with Remix', false],
    ['/remix/', 'See the Fortal design system', false],
    ['/remix/docs/', 'Fortal design system', true],
  ] as const) {
    test(`${route} links to it and the link lands there`, async ({ page, context }) => {
      await page.goto(route);
      const link = page.getByRole('link', { name, exact: true }).first();
      await expect(link).toHaveAttribute('href', FORTAL);
      await link.scrollIntoViewIfNeeded();
      if (newTab) {
        const opened = context.waitForEvent('page');
        await link.click();
        const tab = await opened;
        const watched = watch(tab);
        await expect(tab).toHaveURL(new RegExp(`${FORTAL}$`));
        await expectRunning(tab, watched);
        return;
      }
      const watched = watch(page);
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${FORTAL}$`));
      await expectRunning(page, watched);
    });
  }
});
