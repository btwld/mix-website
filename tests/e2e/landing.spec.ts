import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { MIX_FEATURES, REMIX_BENTO, REMIX_HERO_STYLES } from '../../lib/landing-previews.mjs';

const site = JSON.parse(readFileSync(new URL('../../.generated/site-inputs.json', import.meta.url), 'utf8'));
const landingIds: string[] = Object.keys(site.mix.landingPreviews);

/**
 * Bring each named preview into view and wait for it to actually be running.
 *
 * Lazy previews attach their IntersectionObserver only once React has hydrated.
 * A scripted sweep over the whole page can finish before that happens — in
 * WebKit it reliably does — leaving every host `idle` with no bundle ever
 * requested. Holding each host in the viewport and waiting on its own
 * `data-state` is both deterministic and what a reader actually does.
 */
async function expectViewsAligned(page: Page, ids: readonly string[]) {
  for (const id of ids) {
    const host = page.locator(`[data-preview-id="${id}"]`);
    await host.scrollIntoViewIfNeeded();
    await expect(host, `${id} must start`).toHaveAttribute('data-state', 'ready', { timeout: 90_000 });
  }
  await expect(page.locator('flutter-view')).toHaveCount(ids.length);
  const offsets = await page.evaluate(() => [...document.querySelectorAll('flutter-view')].map(view => {
    const pane = view.querySelector('flt-glass-pane');
    if (!pane) return null;
    return Math.round(pane.getBoundingClientRect().left - view.getBoundingClientRect().left);
  }));
  expect(offsets, 'every embedded view paints from its own host').toEqual(offsets.map(() => 0));
}

const SHELL_ROUTES = ['/', '/mix/', '/remix/', '/naked-ui/', '/mix/docs/', '/remix/docs/components/button/', '/naked-ui/docs/', '/no-such-page/'];
const PAGE_GROUND = 'rgb(5, 4, 10)';

async function expectDark(page: Page, route: string) {
  await expect(page.locator('html'), route).toHaveClass(/\bdark\b/);
  await expect(page.locator('html'), route).not.toHaveClass(/\blight\b/);
  await expect(page.locator('html'), route).toHaveCSS('color-scheme', 'dark');
  await expect(page.locator('body'), route).toHaveCSS('background-color', PAGE_GROUND);
}

test.describe('dark is the only site theme', () => {
  test('the server sends a dark document before any script runs', async ({ request }) => {
    for (const route of SHELL_ROUTES) {
      const html = await (await request.get(route)).text();
      expect(html, route).toMatch(/<html[^>]*class="[^"]*\bdark\b[^"]*"/);
      expect(html, route).not.toMatch(/<html[^>]*class="[^"]*\blight\b[^"]*"/);
      expect(html, route).toMatch(/<meta name="color-scheme" content="dark"/);
    }
  });

  test('without JavaScript pages stay dark and the phone menu still opens', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    for (const route of ['/', '/mix/docs/', '/no-such-page/']) {
      await page.goto(route);
      await expectDark(page, route);
    }
    await page.goto('/');
    await page.locator('.v2-docs-menu summary').click();
    await expect(page.locator('.v2-docs-panel').getByRole('link', { name: 'Naked UI' })).toBeVisible();
    await context.close();
  });

  test('neither an OS light preference nor a saved light theme has any effect', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light', reducedMotion: 'reduce' });
    await context.addInitScript(() => localStorage.setItem('theme', 'light'));
    const page = await context.newPage();
    for (const route of SHELL_ROUTES) {
      await page.goto(route);
      await expectDark(page, route);
      await page.keyboard.press('d');
      await expectDark(page, route);
      expect(await page.evaluate(() => localStorage.getItem('theme')), route).toBe('light');
    }
    // A widget's own example control still defaults from the now-dark host.
    await page.goto('/remix/docs/components/button/');
    await expect(page.getByLabel('Example theme')).toHaveValue('dark');
    await context.close();
  });

  test('no global theme switch exists on landings, docs or their mobile menus', async ({ browser }) => {
    const switches = (page: Page) => page.locator('[data-theme-toggle], button[aria-label="Toggle Theme"]');
    for (const width of [1280, 390]) {
      const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width, height: 844 } });
      const page = await context.newPage();
      for (const route of ['/', '/remix/', '/mix/docs/', '/remix/docs/components/button/', '/no-such-page/']) {
        await page.goto(route);
        await expect(switches(page), `${route} at ${width}px`).toHaveCount(0);
      }
      if (width === 390) {
        await page.goto('/');
        await page.locator('.v2-docs-menu summary').click();
        await expect(switches(page)).toHaveCount(0);
        await page.goto('/mix/docs/');
        await page.getByRole('button', { name: 'Open Sidebar', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Projects', exact: true })).toBeVisible();
        await expect(switches(page)).toHaveCount(0);
      }
      await context.close();
    }
  });

  test('Remix controls wait for hydration before accepting a selection', async ({ page }) => {
    let releaseScripts!: () => void;
    const scripts = new Promise<void>(resolve => { releaseScripts = resolve; });
    await page.route('**/_next/static/**/*.js', async route => {
      await scripts;
      await route.continue();
    });
    try {
      await page.goto('/remix/docs/components/button/', { waitUntil: 'commit' });
      await expect(page.getByLabel('Example theme')).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Reset example' })).toBeDisabled();
    } finally {
      releaseScripts();
    }
    await expect(page.getByLabel('Example theme')).toBeEnabled();
    await page.getByLabel('Example theme').selectOption('light');
    await expect(page.getByLabel('Example theme')).toHaveValue('light');
    await expect(page.locator('.remix-preview-stage iframe')).toHaveAttribute('src', /light/);
  });

  test('a Remix example can still be switched to its own light styling', async ({ page }) => {
    await page.goto('/remix/docs/components/button/');
    const select = page.getByLabel('Example theme');
    await expect(select).toHaveValue('dark');
    await select.selectOption('light');
    await expect(select).toHaveValue('light');
    await expect(page.locator('.remix-preview-stage iframe')).toHaveAttribute('src', /light/);
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  });
});

test.describe('floating navigation', () => {
  test('phone controls are 44px and the menu reaches every project', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/mix/');
    // Escape and outside-click handling attach on hydration.
    await page.waitForLoadState('networkidle');
    const search = page.locator('.site-nav').getByRole('button', { name: 'Search' });
    const summary = page.locator('.site-nav-menu summary');
    for (const control of [search, summary]) {
      const box = (await control.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await summary.click();
    const link = page.locator('.site-nav-panel').getByRole('link', { name: 'Remix' });
    await expect(link).toBeVisible();
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.keyboard.press('Escape');
    await expect(link).toBeHidden();
    await expect(summary).toBeFocused();
    await summary.click();
    await link.click();
    await expect(page).toHaveURL('/remix/');
    await expect(page.locator('.site-nav-panel')).toBeHidden();
  });

  test('desktop links mark the current project and shared search opens', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/remix/');
    await expect(page.locator('.site-nav-links').getByRole('link', { name: 'Remix' })).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('.site-nav-menu')).toBeHidden();
    await page.waitForLoadState('networkidle');
    await page.locator('.site-nav').getByRole('button', { name: 'Search' }).click();
    await expect(page.getByPlaceholder('Search Mix, Remix, and Naked UI')).toBeVisible();
  });

  test('the not-found page has one main landmark and working search', async ({ page }) => {
    await page.goto('/no-such-page/');
    await expect(page.getByRole('main')).toHaveCount(1);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Search documentation' }).click();
    await expect(page.getByPlaceholder('Search Mix, Remix, and Naked UI')).toBeVisible();
  });
});

test.describe('restored composition', () => {
  test('the homepage introduces all three libraries and switches preview/source on a phone', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Build your Flutter design system from three libraries.');
    const hero = page.locator('#hello');
    await expect(hero.locator('.v2-code')).toBeVisible();
    await expect(hero.locator('.v2-view')).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    const tabs = hero.locator('.v2-bench-tabs');
    await expect(tabs.getByText('Preview', { exact: true })).toBeVisible();
    await tabs.getByText('style.dart', { exact: true }).click();
    await expect(hero.locator('.v2-code')).toBeVisible();
    await expect(hero.locator('.v2-code')).toContainText('final button = BoxStyler()');
    await expect(hero.locator('.v2-view')).toBeHidden();
    await tabs.getByText('upgrade_button.dart', { exact: true }).click();
    await expect(hero.locator('.v2-code')).toContainText('class UpgradeButton');
    await tabs.getByText('Preview', { exact: true }).click();
    await expect(hero.locator('.v2-view')).toBeVisible();
    await expect(hero.locator('.v2-code')).toBeHidden();
  });

  test('the Remix backdrop reaches behind the preview window', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/remix/');
    const media = (await page.locator('.lx-band-media').boundingBox())!;
    const stage = (await page.locator('.lx-stagewrap').boundingBox())!;
    expect(media.y + media.height).toBeGreaterThan(stage.y + stage.height);
  });
});

test.describe('landings', () => {
  test('landing layouts have one main landmark and no phone overflow', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 320, height: 844 });
    for (const route of ['/', '/mix/', '/remix/', '/naked-ui/']) {
      await page.goto(route);
      await expect(page.getByRole('main')).toHaveCount(1);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow, `${route} stays inside a narrow phone`).toBeLessThanOrEqual(1);
      if (route === '/mix/') {
        const terminal = page.locator('.lx-terminal');
        const clipped = await terminal.evaluate(el => {
          const button = el.querySelector('button')!.getBoundingClientRect();
          const bounds = el.getBoundingClientRect();
          return button.right > bounds.right || button.left < bounds.left || el.scrollWidth > el.clientWidth + 1;
        });
        expect(clipped, 'the copy control stays visible while only the command scrolls').toBe(false);
      }
    }
  });

  test('demo tabs stay readable and usable on a phone', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/remix/');
    const controls = await page.getByRole('tab').evaluateAll(tabs => {
      const rgb = (value: string) => value.match(/[\d.]+/g)!.slice(0, 3).map(Number);
      const luminance = (value: string) => rgb(value).map(channel => {
        const c = channel / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      }).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
      return tabs.map(tab => {
        const fg = luminance(getComputedStyle(tab).color);
        const bg = luminance(getComputedStyle(tab.closest('.lx-window-bar')!).backgroundColor);
        return { height: tab.getBoundingClientRect().height, contrast: (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05), selected: tab.getAttribute('aria-selected') === 'true' };
      });
    });
    for (const control of controls) {
      expect(control.height).toBeGreaterThanOrEqual(44);
      // Selected text has its own accent fill; the others sit on the panel bar.
      if (!control.selected) expect(control.contrast).toBeGreaterThanOrEqual(4.5);
    }
    await expect(page.locator('.lx-window-bar .lx-dots').first()).toBeHidden();
    await page.getByRole('tab', { name: 'Gradient' }).click();
    await expect(page.getByRole('tabpanel', { name: 'Gradient' })).toBeVisible();
  });

  test('the homepage reaches every library and its installation section', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Flutter Mix');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Build your Flutter design system from three libraries.');
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/assets/icon_logo.svg');
    expect((await page.request.get('/assets/icon_logo.svg')).status()).toBe(200);
    for (const section of ['mix', 'naked', 'remix']) await expect(page.locator(`#${section}`)).toBeAttached();
    const navigation = page.getByRole('navigation', { name: 'Main' });
    await navigation.getByRole('link', { name: 'Get started', exact: true }).click();
    await expect(page).toHaveURL(/\/#start$/);
    await expect(page.locator('#start h2')).toBeVisible();
    await navigation.locator('.v2-docs-menu summary').click();
    await navigation.locator('.v2-docs-panel').getByRole('link', { name: 'Naked UI' }).click();
    await expect(page).toHaveURL('/naked-ui/docs/');
  });

  test('the Mix landing runs every feature demo beside its locked source', async ({ page }) => {
    await page.goto('/mix/');
    await expect(page.getByRole('heading', { level: 1, name: 'Mix' })).toBeVisible();
    await expectViewsAligned(page, MIX_FEATURES.map(feature => feature.previewId));

    // Each card shows the preview's own Dart, fetched from the pinned bundle.
    const snippets = page.locator('.lx-feature-code .shiki');
    await expect(snippets).toHaveCount(5);
    for (const text of await snippets.allInnerTexts()) expect(text.trim().length).toBeGreaterThan(20);

    // The code-generation panel links to a heading that actually exists.
    const link = page.getByRole('link', { name: /See the annotation and generated Dart/ });
    await link.click();
    await expect(page).toHaveURL(/\/mix\/docs\/ecosystem\/mix-generator\/#mixwidget$/);
    await expect(page.locator('#mixwidget')).toBeAttached();
  });

  test('the Remix hero switches style, source and live render together', async ({ page }) => {
    await page.goto('/remix/');
    await expect(page.getByRole('heading', { level: 1, name: 'The behavior is built in. Style Flutter your way.' })).toBeVisible();

    const code = page.locator('.lx-window-code .lx-code:not([hidden]) .shiki');
    await expect(page.getByRole('tab', { name: 'Classic' })).toHaveAttribute('aria-selected', 'true');
    await expect(code).toContainText('greenAccent');

    await page.getByRole('tab', { name: 'Neon' }).click();
    await expect(page.getByRole('tab', { name: 'Neon' })).toHaveAttribute('aria-selected', 'true');
    await expect(code).toContainText('cyanAccent');
    // One engine for the whole page: switching swaps a view, never reloads.
    await expect(page.locator(`script[src="${site.mix.previewsBase}/flutter_bootstrap.js"]`)).toHaveCount(1);

    await expectViewsAligned(page, [...REMIX_HERO_STYLES, ...REMIX_BENTO].map(item => item.previewId));
    // Counts readers see are derived from the staged docs, never hand-written.
    const components = site.pages.remix.filter((slug: string) => slug.startsWith('components/')).length;
    await expect(page.locator('.lx-stat-value').first()).toHaveText(String(components));
  });

  test('every landing preview ID is mounted by a landing', async ({ page }) => {
    const mounted = new Set<string>();
    for (const route of ['/mix/', '/remix/']) {
      await page.goto(route);
      await expect(page.locator('[data-preview-id]').first()).toBeAttached();
      for (const id of await page.locator('[data-preview-id]').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-preview-id')!))) mounted.add(id);
    }
    expect([...mounted].sort()).toEqual([...landingIds].sort());
  });

  test('the style switcher is one tab stop with arrow navigation', async ({ page }) => {
    await page.goto('/remix/');
    const tab = (name: string) => page.getByRole('tab', { name });
    await tab('Classic').focus();
    // Only the selected tab is reachable by Tab; arrows move within the group.
    expect(await page.locator('[role="tab"]').evaluateAll(nodes => nodes.map(n => (n as HTMLElement).tabIndex))).toEqual([0, -1, -1]);
    await page.keyboard.press('ArrowRight');
    await expect(tab('Gradient')).toBeFocused();
    await expect(tab('Gradient')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('End');
    await expect(tab('Neon')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(tab('Classic')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(tab('Classic')).toHaveAttribute('aria-selected', 'true');
  });

  test('keyboard focus never enters a hidden hero style', async ({ page }) => {
    await page.goto('/remix/');
    // All three styles stay mounted for the cross-fade, so the two the reader
    // cannot see must be out of the tab order entirely.
    await expectViewsAligned(page, REMIX_HERO_STYLES.map(style => style.previewId));
    await expect(page.locator('.lx-live-stack flutter-view')).toHaveCount(3);
    await page.getByRole('tab', { name: 'Gradient' }).click();
    await expect(page.getByRole('tab', { name: 'Gradient' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.lx-live-layer[aria-hidden="true"]')).toHaveCount(2);

    await page.getByRole('tab', { name: 'Gradient' }).focus();
    for (let step = 0; step < 12; step++) {
      await page.keyboard.press('Tab');
      const landed = await page.evaluate(() => {
        const active = document.activeElement;
        const layer = active?.closest?.('.lx-live-layer');
        return {
          tag: active?.tagName ?? null,
          hiddenLayer: layer ? layer.getAttribute('aria-hidden') === 'true' : false,
          previewId: layer?.querySelector('[data-preview-id]')?.getAttribute('data-preview-id') ?? null,
        };
      });
      expect(landed.hiddenLayer, `Tab ${step + 1} reached ${landed.tag} inside hidden ${landed.previewId}`).toBe(false);
    }
  });

  test('reduced motion removes the video and keeps every section visible', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/mix/');
    await expect(page.locator('.lx-band-media video')).toHaveCount(0);
    await expect(page.locator('.lx-motion-toggle')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.classList.contains('lx-js'))).toBe(false);
    // Nothing may stay hidden when the reveal animation is not applied.
    const hidden = () => page.locator('.lx-reveal').evaluateAll(nodes =>
      nodes.filter(node => Number(getComputedStyle(node).opacity) < 1).length);
    expect(await hidden()).toBe(0);
    await context.close();
  });

  test('turning on reduced motion after load reveals every section', async ({ page }) => {
    await page.goto('/mix/');
    expect(await page.evaluate(() => document.documentElement.classList.contains('lx-js'))).toBe(true);
    // The class stays, so the stylesheet alone has to honour the new preference.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const hidden = await page.locator('.lx-reveal').evaluateAll(nodes =>
      nodes.filter(node => Number(getComputedStyle(node).opacity) < 1).length);
    expect(hidden).toBe(0);
  });
});
