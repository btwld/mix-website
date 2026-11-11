import { readFileSync, readdirSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';

// The staged build under test; the server must have been built from the same lock.
const site = JSON.parse(readFileSync(new URL('../../.generated/site-inputs.json', import.meta.url), 'utf8'));
const previewsBase: string = site.mix.previewsBase;
const ANIMATIONS = [0, 1, 2, 3, 4].map(index => `guides/animations.${index}`);

const previewHost = (page: Page, id: string) =>
  page.locator(`[data-testid="flutter-preview"][data-preview-id="${id}"] [role="application"]`);

async function expectReady(page: Page, id: string) {
  const host = previewHost(page, id);
  await host.scrollIntoViewIfNeeded();
  await expect(host).toHaveAttribute('data-state', 'ready');
  await expect(host.locator('flutter-view')).toHaveCount(1);
  return host;
}

/** Wait until two consecutive captures match, so later differences come from the action. */
async function settled(host: Locator) {
  let previous = await host.screenshot();
  for (let attempt = 0; attempt < 20; attempt++) {
    await host.page().waitForTimeout(400);
    const current = await host.screenshot();
    if (current.equals(previous)) return current;
    previous = current;
  }
  throw new Error('Preview never settled');
}

async function changesAfter(host: Locator, action: () => Promise<void>) {
  // Park the pointer away from the preview: WebKit applies hover when content
  // scrolls under a still pointer, which would pre-empt the action.
  await host.scrollIntoViewIfNeeded();
  await host.page().mouse.move(1, 1);
  const before = await settled(host);
  const changed = (async () => {
    const deadline = Date.now() + 3_000;
    while (Date.now() < deadline) {
      if (!(await host.screenshot()).equals(before)) return true;
      await host.page().waitForTimeout(40);
    }
    return false;
  })();
  await action();
  expect(await changed, 'preview changes during the interaction').toBe(true);
}

test.describe('direct loads', () => {
  for (const [path, heading] of [
    // The landings carry their restored editorial headings; /mix/ and
    // /naked-ui/ stay named after their project.
    ['/', 'An Expressive Styling System for Flutter'],
    ['/mix/', 'Mix'], ['/remix/', 'The behavior is built in. Style Flutter your way.'], ['/naked-ui/', 'Naked UI'],
    ['/mix/docs/widgets/box/', 'Box'], ['/mix/docs/guides/animations/', 'Animations'],
    ['/remix/docs/components/button/', 'Button'], ['/naked-ui/docs/widget/button/', 'NakedButton'],
  ]) {
    test(`${path} renders`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      expect(response?.headers()['x-robots-tag']).toBe('noindex, nofollow');
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    });
  }

  test('missing routes return a real 404', async ({ page }) => {
    for (const path of ['/no-such-page/', '/mix/docs/no-such-page/', `${previewsBase}/missing.js`]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(404);
    }
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  });

  test('Mix headings keep their legacy anchor IDs', async ({ page }) => {
    await page.goto('/mix/docs/widgets/box/');
    for (const id of ['interactive-preview', 'constructor']) await expect(page.locator(`h2#${id}`)).toHaveCount(1);
    await page.goto('/mix/docs/guides/animations/');
    for (const id of ['choosing-the-right-type', 'case-2-variant-triggered']) await expect(page.locator(`#${id}`)).toHaveCount(1);
  });
});

test.describe('Mix previews', () => {
  test('all five Animations previews render in one shared engine and respond', async ({ page }) => {
    const entrypoints: string[] = [];
    page.on('request', request => { if (/\/main\.dart\.(wasm|js|mjs)$/.test(request.url())) entrypoints.push(request.url()); });
    await page.goto('/mix/docs/guides/animations/');
    const hosts: Locator[] = [];
    for (const id of ANIMATIONS) hosts.push(await expectReady(page, id));

    // One bootstrap script, one engine, one view per preview.
    await expect(page.locator(`script[src="${previewsBase}/flutter_bootstrap.js"]`)).toHaveCount(1);
    expect(await page.evaluate(() => typeof window.flutterApp?.addView)).toBe('function');
    await expect(page.locator('flutter-view')).toHaveCount(5);
    expect(new Set(entrypoints.map(url => new URL(url).pathname.replace(/\.(wasm|js|mjs)$/, ''))).size).toBe(1);
    expect(entrypoints.every(url => new URL(url).pathname.startsWith(`${previewsBase}/`))).toBe(true);

    // 0: press increments a counter (implicit). 1: hover variant. 2: press
    // phase animation. 3: press keyframe switch. 4: plays on mount.
    await changesAfter(hosts[0], () => hosts[0].click());
    await changesAfter(hosts[1], () => hosts[1].hover());
    await page.mouse.move(0, 0);
    await changesAfter(hosts[2], () => hosts[2].click());
    await changesAfter(hosts[3], () => hosts[3].click());
    // The loop starts when its view mounts, so watch a fresh mount.
    await page.reload();
    const reloaded = await expectReady(page, ANIMATIONS[4]);
    await expect.poll(async () => {
      const first = await reloaded.screenshot();
      await page.waitForTimeout(150);
      return !first.equals(await reloaded.screenshot());
    }, { timeout: 10_000, message: 'keyframe loop animates after mount' }).toBe(true);
  });

  test('the keyboard reaches a preview with Tab and activates it', async ({ page }) => {
    await page.goto('/mix/docs/guides/animations/');
    const host = await expectReady(page, ANIMATIONS[0]);
    // Focus whatever precedes the view in tab order, then Tab into the view.
    await host.locator('flutter-view').evaluate(view => {
      const tabbable = [...document.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]')]
        .filter(element => element.tabIndex >= 0 && !element.hasAttribute('disabled') && element.getClientRects().length > 0);
      const index = tabbable.indexOf(view as HTMLElement);
      if (index < 1) throw new Error('flutter-view is not in the tab order');
      tabbable[index - 1].focus();
    });
    await page.keyboard.press('Tab');
    expect(await host.locator('flutter-view').evaluate(view => document.activeElement === view)).toBe(true);
    const url = page.url();
    const before = await settled(host);
    await page.keyboard.press('Enter');
    await expect.poll(async () => !(await host.screenshot()).equals(before), { timeout: 5_000 }).toBe(true);
    expect(page.url()).toBe(url);
    const again = await settled(host);
    await page.keyboard.press('Space');
    await expect.poll(async () => !(await host.screenshot()).equals(again), { timeout: 5_000 }).toBe(true);
  });

  test('client-side navigation reuses the engine', async ({ page }) => {
    const bootstraps: string[] = [];
    page.on('request', request => { if (request.url().endsWith('/flutter_bootstrap.js')) bootstraps.push(request.url()); });
    await page.goto('/mix/docs/widgets/box/');
    await expectReady(page, 'widgets/box.0');
    await page.evaluate(() => { (window as unknown as { __noReload: boolean }).__noReload = true; });
    // Sidebar folders start collapsed; open Guides, then follow the link.
    await page.getByRole('button', { name: 'Guides', exact: true }).click();
    const animationsLink = page.getByRole('link', { name: 'Animations', exact: true }).first();
    // Base UI animates the ancestor panel. The link can pass the browser's
    // two-frame stability check while that panel is still moving under the
    // pointer; wait for the actual expansion before testing client navigation.
    await expect.poll(() => animationsLink.evaluate(link => {
      for (let element: Element | null = link; element; element = element.parentElement) {
        if (element.getAnimations().some(animation => animation.playState === 'running' || animation.pending)) return false;
      }
      return true;
    }), { message: 'sidebar expansion has settled before clicking its link' }).toBe(true);
    await animationsLink.click();
    await expect(page).toHaveURL(/\/mix\/docs\/guides\/animations\/$/);
    for (const id of ANIMATIONS) await expectReady(page, id);
    expect(await page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload)).toBe(true);
    expect(bootstraps).toHaveLength(1);
    await page.goBack();
    await expectReady(page, 'widgets/box.0');
    await expect(page.locator('flutter-view')).toHaveCount(1);
  });

  test('preview sources resolve from the same locked build', async ({ page, request }) => {
    await page.goto('/mix/docs/guides/animations/');
    const manifest = await (await request.get(`${previewsBase}/previews-manifest.json`)).json();
    for (const id of [...ANIMATIONS, 'widgets/box.0']) {
      const entry = manifest.entries.find((item: { previewId: string }) => item.previewId === id);
      expect(entry, id).toBeTruthy();
      const response = await request.get(`${previewsBase}/sources/${entry.sourcePath}`);
      expect(response.status(), entry.sourcePath).toBe(200);
      const served = await response.body();
      const locked = readFileSync(new URL(`../../.site-inputs/extracted/mix-previews/bundle/sources/${entry.sourcePath}`, import.meta.url));
      expect(served.equals(locked), entry.sourcePath).toBe(true);
      expect(served.toString()).toMatch(/class \w+ extends (StatelessWidget|StatefulWidget)/);
    }
  });

  test('preview assets use correct MIME types and immutable caching', async ({ request }) => {
    for (const [file, type] of [['flutter_bootstrap.js', 'javascript'], ['main.dart.wasm', 'application/wasm'], ['main.dart.mjs', 'javascript'], ['main.dart.js', 'javascript'], ['previews-manifest.json', 'application/json']]) {
      const response = await request.get(`${previewsBase}/${file}`);
      expect(response.status(), file).toBe(200);
      expect(response.headers()['content-type'], file).toContain(type);
      expect(response.headers()['x-robots-tag'], file).toBe('noindex, nofollow');
      expect(response.headers()['cache-control'], file).toBe('public, max-age=31536000, immutable');
    }
  });
});

test.describe('Remix', () => {
  test('the docs embed starts the catalog example and recovers from a reset', async ({ page, browserName }) => {
    await page.goto('/remix/docs/components/button/');
    const stage = page.locator('.remix-preview-stage');
    await expect(stage).toHaveAttribute('data-status', 'ready', { timeout: 90_000 });
    const frame = page.frameLocator('.remix-preview-stage iframe');
    await expect(frame.locator('flutter-view, flt-glass-pane').first()).toBeAttached();
    // Keyboard: Tab from the Theme control to "Reset example" and activate it.
    await page.getByLabel('Example theme').focus();
    // macOS WebKit uses Option+Tab to include buttons in keyboard navigation.
    await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab');
    await expect(page.getByRole('button', { name: 'Reset example' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(stage).not.toHaveAttribute('data-status', 'ready');
    await expect(stage).toHaveAttribute('data-status', 'ready', { timeout: 90_000 });
  });

  test('the catalog loads directly at its own base href', async ({ page }) => {
    const response = await page.goto('/remix/catalog/');
    expect(response?.status()).toBe(200);
    expect(response?.headers()['x-robots-tag']).toBe('noindex, nofollow');
    expect(response?.headers()['cache-control']).toBe('public, max-age=0, must-revalidate');
    expect(await page.evaluate(() => document.baseURI)).toMatch(/\/remix\/catalog\/$/);
    await expect(page.locator('flutter-view, flt-glass-pane').first()).toBeAttached({ timeout: 90_000 });
    await page.waitForTimeout(3_000);
    // Workers may only ever be scoped to the catalog, never the site root.
    const scopes = await page.evaluate(async () => (await navigator.serviceWorker?.getRegistrations() ?? []).map(registration => registration.scope));
    for (const scope of scopes) expect(new URL(scope).pathname.startsWith('/remix/catalog/')).toBe(true);
    const root = await page.goto('/');
    expect(root?.status()).toBe(200);
    expect(await page.evaluate(async () => (await navigator.serviceWorker?.getRegistrations() ?? []).filter(r => new URL(r.scope).pathname === '/').length)).toBe(0);
  });

  test('old catalog hash links forward to the catalog', async ({ page }) => {
    await page.goto('/remix/#/?path=components/remixbutton/catalog');
    await expect(page).toHaveURL(/\/remix\/catalog\/#\/\?path=components\/remixbutton\/catalog$/);
    await page.goto('/remix/?ref=legacy#/?path=components/button&mode=light');
    await expect(page).toHaveURL(/\/remix\/catalog\/\?ref=legacy#\/\?path=components\/remixbutton\/button-component&mode=light$/);
  });

  test('the former pilot fallbacks are real local docs', async ({ request }) => {
    for (const route of ['/remix/docs/components/dialog/', '/mix/docs/guides/styling/', '/naked-ui/docs/widget/slider/']) {
      const response = await request.get(route, { maxRedirects: 0 });
      expect(response.status(), route).toBe(200);
      expect(await response.text()).toContain('<h1');
    }
  });

  test('legacy namespace redirects retain query strings', async ({ request }) => {
    const response = await request.get('/documentation/mix/widgets/box/?utm_source=legacy', { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe('/mix/docs/widgets/box/?utm_source=legacy');
  });

  test('nonproduction pages omit production canonical metadata', async ({ page }) => {
    for (const route of ['/', '/mix/', '/mix/docs/', '/mix/docs/widgets/', '/naked-ui/docs/', '/remix/docs/components/dialog/']) {
      await page.goto(route);
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    }
  });
});

test.describe('search', () => {
  const LABELS = { '/mix/': 'Mix', '/remix/': 'Remix', '/naked-ui/': 'Naked UI' } as const;

  async function openSearch(page: Page) {
    await page.goto('/');
    await page.getByRole('button', { name: /search/i }).first().click();
    const input = page.getByPlaceholder('Search Mix, Remix, and Naked UI');
    await expect(input).toBeVisible();
    return input;
  }

  /** Every result with its URL and the project label it shows. */
  async function results(page: Page) {
    const items = page.getByRole('dialog').locator('[data-result-url]');
    await expect(items.first()).toBeVisible();
    return items.evaluateAll(elements => elements.map(element => ({
      url: element.getAttribute('data-result-url') ?? '',
      label: element.firstElementChild?.textContent ?? '',
    })));
  }

  test('every result carries its project label', async ({ page }) => {
    const input = await openSearch(page);
    for (const query of ['button', 'keyframe', 'semantics']) {
      await input.fill(query);
      // Search is debounced; visible results can still belong to the previous query.
      const expected = query === 'button' ? ['/remix/docs/components/button', '/naked-ui/docs/widget/button']
        : query === 'keyframe' ? ['/mix/docs/guides/animations'] : ['/naked-ui/docs/'];
      for (const prefix of expected) {
        await expect.poll(async () => (await results(page)).some(result => result.url.startsWith(prefix))).toBe(true);
      }
      const found = await results(page);
      for (const { url, label } of found) {
        const project = Object.entries(LABELS).find(([prefix]) => url.startsWith(prefix));
        expect(project, url).toBeTruthy();
        expect(label, url).toBe(project![1]);
      }
      if (query === 'button') {
        expect(found.some(result => result.url.startsWith('/remix/docs/components/button'))).toBe(true);
        expect(found.some(result => result.url.startsWith('/naked-ui/docs/widget/button'))).toBe(true);
      }
      if (query === 'keyframe') expect(found.some(result => result.url.startsWith('/mix/docs/guides/animations'))).toBe(true);
    }
  });

  test('the project filter narrows results and the keyboard opens one', async ({ page }) => {
    const input = await openSearch(page);
    await input.fill('button');
    const dialog = page.getByRole('dialog');
    await expect.poll(async () => (await results(page)).some(result => result.url.startsWith('/remix/'))).toBe(true);
    await dialog.getByRole('button', { name: 'Naked UI', exact: true }).click();
    await expect.poll(async () => (await results(page)).every(result => /^\/naked-ui\/docs(?:[\/#]|$)/.test(result.url))).toBe(true);
    await input.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/naked-ui\/docs\/widget\/button\/?/);
  });
});

// Full-corpus integration: each source-owned demo must mount, beyond pilot pages.
test('all migrated Mix preview IDs mount successfully', async ({ page }) => {
  test.setTimeout(300_000);
  for (const file of readdirSync('content/mix', { recursive: true }).filter(file => String(file).endsWith('.mdx'))) {
    const text = readFileSync(`content/mix/${file}`, 'utf8');
    const ids = [...text.matchAll(/previewId="([^"]+)"/g)].map(match => match[1]);
    if (!ids.length) continue;
    await page.goto('/mix/docs/' + String(file).replace(/\.mdx$/, '') + '/');
    for (const id of ids) await expectReady(page, id);
  }
});

test('all Remix component pages start their real catalog examples', async ({ page }) => {
  test.setTimeout(300_000);
  const pages = site.pages.remix.filter((slug: string) => slug.startsWith('components/'));
  for (const slug of pages) {
    await page.goto('/remix/docs/' + slug + '/');
    const stage = page.locator('.remix-preview-stage');
    await stage.scrollIntoViewIfNeeded();
    await expect(stage).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });
    await expect(page.frameLocator('.remix-preview-stage iframe').locator('flutter-view, flt-glass-pane').first()).toBeAttached();
  }
});
