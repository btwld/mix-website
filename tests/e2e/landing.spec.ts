import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const site = JSON.parse(readFileSync(new URL('../../.generated/site-inputs.json', import.meta.url), 'utf8'));
const landingIds: string[] = Object.keys(site.mix.landingPreviews);

/** Feature and tile views mount lazily, so bring the whole page into view first. */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    window.scrollTo(0, 0);
  });
}

/** Flutter paints each view at its host origin; a misaligned host clips the widget. */
async function expectViewsAligned(page: Page, expected: number) {
  await scrollThrough(page);
  await expect.poll(async () => page.locator('flutter-view').count(), { timeout: 60_000 }).toBe(expected);
  const offsets = await page.evaluate(() => [...document.querySelectorAll('flutter-view')].map(view => {
    const pane = view.querySelector('flt-glass-pane');
    if (!pane) return null;
    return Math.round(pane.getBoundingClientRect().left - view.getBoundingClientRect().left);
  }));
  expect(offsets, 'every embedded view paints from its own host').toEqual(offsets.map(() => 0));
}

test.describe('landings', () => {
  test('the apex leads with Mix and reaches every project', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Flutter styling without the boilerplate.' })).toBeVisible();

    // The restored hero media, served from this repository with recorded bytes.
    const poster = page.locator('.lx-band-media img');
    await expect(poster).toHaveAttribute('src', '/assets/concepta-hero-poster.jpg');
    expect((await page.request.get('/assets/concepta-hero-poster.jpg')).status()).toBe(200);
    expect((await page.request.get('/assets/icon_logo.svg')).status()).toBe(200);

    await expectViewsAligned(page, 3);

    // Sibling access is the apex's job; each card keeps its own entry point.
    for (const name of ['Mix', 'Remix', 'Naked UI']) {
      await expect(page.getByRole('region', { name, exact: true })).toBeVisible();
    }
    await page.getByRole('link', { name: 'Get started', exact: true }).first().click();
    await expect(page).toHaveURL('/mix/docs/overview/getting-started/');
  });

  test('the Mix landing runs every feature demo beside its locked source', async ({ page }) => {
    await page.goto('/mix/');
    await expect(page.getByRole('heading', { level: 1, name: 'Mix' })).toBeVisible();
    await expectViewsAligned(page, 5);

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

    await expectViewsAligned(page, 8);
    // Counts readers see are derived from the staged docs, never hand-written.
    const components = site.pages.remix.filter((slug: string) => slug.startsWith('components/')).length;
    await expect(page.locator('.lx-stat-value').first()).toHaveText(String(components));
  });

  test('every landing preview ID is mounted by a landing', async ({ page }) => {
    const mounted = new Set<string>();
    for (const route of ['/', '/mix/', '/remix/']) {
      await page.goto(route);
      await scrollThrough(page);
      await expect.poll(async () => page.locator('flutter-view').count(), { timeout: 60_000 }).toBeGreaterThan(0);
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
    await expect.poll(async () => page.locator('.lx-live-stack flutter-view').count(), { timeout: 60_000 }).toBe(3);
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
    await page.goto('/');
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
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.classList.contains('lx-js'))).toBe(true);
    // The class stays, so the stylesheet alone has to honour the new preference.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const hidden = await page.locator('.lx-reveal').evaluateAll(nodes =>
      nodes.filter(node => Number(getComputedStyle(node).opacity) < 1).length);
    expect(hidden).toBe(0);
  });
});
