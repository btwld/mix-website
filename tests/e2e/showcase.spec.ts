import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const siteIdentity = JSON.parse(readFileSync('public/__site.json', 'utf8'));
const sourcePinned = Boolean(siteIdentity.commit) && !siteIdentity.dirty;

const hasLocalShowcase = existsSync('public/v2-flutter/flutter_bootstrap.js');

const featureExcerpts: { id: string; name: string; code: string; file: string; also?: string }[] = [
  { id: 'composition', name: 'Style composition', code: 'final cardStyle = BoxStyler()', file: 'styles.dart', also: 'final quietSlider = slider.rangeColor($muted()).thumbColor($ink());' },
  { id: 'tokens', name: 'Design tokens', code: "const $canvas = ColorToken('canvas');", file: 'tokens.dart' },
  { id: 'material-bridge', name: 'Material bridge', code: 'ContextToken<Color>', file: 'styles.dart' },
  { id: 'states', name: 'Interaction states', code: 'final listRow = BoxStyler()', file: 'styles.dart' },
  { id: 'transitions', name: 'Transitions', code: 'AnimationConfig.easeOut(420.ms)', file: 'styles.dart' },
  { id: 'springs', name: 'Spring motion', code: '.animate(.spring(320.ms))', file: 'styles.dart' },
  { id: 'keyframes', name: 'Keyframe timelines', code: "KeyframeTrack<double>('height'", file: 'styles.dart' },
  { id: 'layout', name: 'Responsive layout', code: '.onBreakpoint(.maxWidth(480), .padding(.all(14)))', file: 'styles.dart', also: 'constraints.maxWidth < 640' },
  { id: 'remix', name: 'Remix components', code: 'CheckboxStyler()', file: 'styles.dart', also: 'child: RemixCheckbox(' },
  { id: 'open-code', name: 'Open code', code: 'FortalCard(', file: 'fortal_today.dart', also: 'FortalCheckbox(' },
  { id: 'overlays', name: 'Overlays and feedback', code: 'RemixDialog(', file: 'invite.dart', also: 'showToast(' },
  { id: 'naked', name: 'Naked UI behavior', code: 'return NakedCheckbox(', file: 'cards.dart' },
];

async function openFeature(page: Page, id: string) {
  const feature = featureExcerpts.find(item => item.id === id)!;
  await page.getByRole('navigation', { name: 'Main', exact: true }).getByRole('link', { name: 'Features & code' }).click();
  await expectFeatureLanding(page);
  await page.getByRole('group', { name: 'Choose a feature', exact: true }).getByRole('button', { name: feature.name, exact: true }).click();
  const panel = page.locator(`[data-chapter][data-active="true"] .v2-feature-panel[data-feature="${id}"]`);
  await expect(panel).toHaveCount(1);
  await expect(panel.locator('details.v2-code').first()).toHaveAttribute('open', '');
  return panel;
}

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

async function expectFeatureLanding(page: Page) {
  await expect(page).toHaveURL(/#v2-features$/);
  // A correct hash alone can hide failed repeat-anchor navigation.
  await expect.poll(() => page.evaluate(() => {
    const section = document.getElementById('v2-features')!.getBoundingClientRect();
    const title = document.getElementById('v2-features-title')!.getBoundingClientRect();
    const navigation = document.querySelector('.v2-nav')!.getBoundingClientRect();
    return section.top >= 0 && section.top < innerHeight / 2 && title.top >= navigation.bottom && title.bottom <= innerHeight;
  })).toBe(true);
}

async function expectChapterHeadingBelowNav(page: Page, chapter: string) {
  await expect.poll(() => page.locator(`#v2-title-${chapter}`).evaluate(heading => {
    const title = heading.getBoundingClientRect();
    const navigation = document.querySelector('.v2-nav')!.getBoundingClientRect();
    return title.top >= navigation.bottom && title.bottom <= innerHeight;
  })).toBe(true);
}

// Observe commands at the existing bridge boundary without replacing Flutter.
async function observeShowcasePatches(page: Page, beforeReady = false) {
  await page.evaluate(beforeReady => {
    const observed = window as typeof window & { observedPatches?: Record<string, unknown>[] };
    observed.observedPatches = [];
    const observe = () => {
      const apply = window.__mixShowcase!.apply;
      window.__mixShowcase!.apply = json => {
        observed.observedPatches!.push(JSON.parse(json));
        apply(json);
      };
    };
    if (beforeReady) {
      const ready = window.__mixShowcaseReady!;
      window.__mixShowcaseReady = () => { observe(); ready(); };
    } else observe();
  }, beforeReady);
}

async function lastShowcaseState(page: Page) {
  return page.evaluate(() => (window as typeof window & { observedPatches?: Record<string, unknown>[] })
    .observedPatches?.filter(patch => Object.hasOwn(patch, 'highlight')).at(-1));
}

test('showcase navigation is server-rendered and works on a narrow phone without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 700 } });
  const page = await context.newPage();
  await page.goto('/v2/');
  await expect(page.getByRole('navigation', { name: 'Main', exact: true })).toHaveCount(1);
  await expect(page.locator('.site-nav')).toHaveCount(0);
  await page.getByLabel('Documentation', { exact: true }).click();
  await expect(page.locator('.v2-docs-panel a')).toHaveCount(3);
  await expect(page.locator('.v2-docs-panel')).toBeVisible();
  // Topics need the website's handlers. Before hydration they must not offer
  // an enabled action that drops its first click; native source navigation stays available.
  const topics = page.getByRole('group', { name: 'Choose a feature', exact: true }).getByRole('button');
  await expect(topics).toHaveCount(12);
  for (const topic of await topics.all()) await expect(topic).toBeDisabled();
  await page.getByLabel('Documentation', { exact: true }).click();
  await page.getByRole('link', { name: 'Browse the complete project and setup' }).click();
  await expect(page.getByRole('heading', { name: 'Behind the cards.' })).toBeVisible();
  await expectNoOverflow(page);
  await context.close();
});

test('a failed Flutter load offers recovery without hiding the rest of the tour', async ({ page }) => {
  await page.route('**/v2-flutter/flutter_bootstrap.js', route => route.abort());
  await page.goto('/v2/');
  await expect(page.getByText('The live preview couldn’t load.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible();
  await page.locator('.v2-missing').getByRole('link', { name: 'Explore the source' }).click();
  await expect(page.getByRole('heading', { name: 'Behind the cards.' })).toBeVisible();
});

test('the code directory opens matching lessons in the live story when Flutter cannot load', async ({ page, browserName }) => {
  await page.route('**/v2-flutter/flutter_bootstrap.js', route => route.abort());
  await page.goto('/v2/#v2-features');
  await expect(page.locator('#v2-features pre')).toHaveCount(0);
  for (const feature of featureExcerpts) {
    const panel = await openFeature(page, feature.id);
    await expect(panel.locator('pre')).toContainText(feature.code);
    if (feature.also) await expect(panel.locator('pre')).toContainText(feature.also);
    await expect(panel.locator('figcaption a').filter({ hasText: feature.file }).first()).toHaveAttribute('href', new RegExp(`^/v2/source/\\?file=${feature.file.replace('.', '\\.')}#L[0-9]+-L[0-9]+$`));
    await expect(panel.getByRole('button', { name: 'Copy Dart excerpt' })).toBeVisible();
    await expect(page).not.toHaveURL(/#v2-features$/);
  }
  if (browserName === 'chromium') {
    const panel = page.locator('[data-chapter][data-active="true"] .v2-feature-panel');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await panel.getByRole('button', { name: 'Copy Dart excerpt' }).click();
    await expect(panel.getByRole('status')).toHaveText('Copied.');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await panel.locator('pre').innerText());
  }
  await expectNoOverflow(page);
});

test('every code topic is reachable in context on a 320px phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.route('**/v2-flutter/flutter_bootstrap.js', route => route.abort());
  await page.goto('/v2/#v2-features');
  for (const feature of featureExcerpts) {
    const panel = await openFeature(page, feature.id);
    await expect(panel.locator('pre')).toContainText(feature.code);
    if (feature.also) await expect(panel.locator('pre')).toContainText(feature.also);
    await expect(panel.locator('pre')).toBeVisible();
    await expectNoOverflow(page);
  }
});

test('source files have shareable selections, history, and a usable phone layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/v2/source/?file=styles.dart');
  const selector = page.getByLabel('Source file', { exact: true });
  await expect(selector).toHaveValue('styles.dart');
  await expect(page.getByRole('region', { name: 'lib/styles.dart source code' })).toContainText('final listRow');
  await selector.selectOption('tokens.dart');
  await expect(page).toHaveURL(/file=tokens\.dart/);
  await expect(page.getByRole('region', { name: 'lib/tokens.dart source code' })).toContainText('CutCorners');
  await page.goBack();
  await expect(selector).toHaveValue('styles.dart');
  await expectNoOverflow(page);
});

for (const feature of featureExcerpts.filter(item => ['composition', 'overlays', 'material-bridge'].includes(item.id))) {
  test(`${feature.name} excerpt links reveal the exact highlighted source lines`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/v2-flutter/flutter_bootstrap.js', route => route.abort());
    await page.goto('/v2/#v2-features');
    const panel = await openFeature(page, feature.id);
    const firstLine = (await panel.locator('pre').innerText()).split('\n')[0].trim();
    const link = panel.locator('figcaption a').first();
    const href = (await link.getAttribute('href'))!;
    const [start, end] = href.match(/#L(\d+)-L(\d+)$/)!.slice(1).map(Number);
    await link.click();
    const first = page.locator(`#L${start}`);
    await expect(first).toContainText(firstLine);
    await expect(page.locator('.v2-source-highlight')).toHaveCount(end - start + 1);
    await expect(first).toHaveClass(/v2-source-highlight/);
    await expect(first).toBeInViewport();
    await expect.poll(() => first.evaluate(line => line.getBoundingClientRect().top >= document.querySelector('.v2-nav')!.getBoundingClientRect().bottom)).toBe(true);
    await expect(page.getByRole('link', { name: 'View on GitHub', exact: true })).toHaveAttribute('href', new RegExp(`/lib/${feature.file.replace('.', '\\.')}${sourcePinned ? `#L${start}-L${end}` : ''}$`));
  });
}

test('Uses links land on showcase declarations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/v2-flutter/flutter_bootstrap.js', route => route.abort());
  await page.goto('/v2/#v2-features');
  const panel = await openFeature(page, 'composition');
  const uses = panel.locator('.v2-code-uses');
  const link = uses.getByRole('link', { name: '$surface', exact: true });
  const href = (await link.getAttribute('href'))!;
  await link.click();
  const definition = page.locator(href.slice(href.indexOf('#')));
  await expect(definition).toHaveClass(/v2-source-highlight/);
  await expect(definition).toContainText('const $surface = ColorToken');
  await expect(definition).toBeInViewport();
});

test('source ranges follow hashes and clear when switching files at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/v2-flutter/flutter_bootstrap.js', route => route.abort());
  await page.goto('/v2/#v2-features');
  const panel = await openFeature(page, 'composition');
  const href = (await panel.locator('figcaption a').first().getAttribute('href'))!;
  const [start, end] = href.match(/#L(\d+)-L(\d+)$/)!.slice(1).map(Number);
  expect(end).toBeGreaterThan(start + 2);
  await page.goto(`${href.split('#')[0]}#L${start}-L${start + 2},L${end}`);
  await expect(page.locator('.v2-source-highlight')).toHaveCount(4);
  await expect(page.locator(`#L${start}`)).toBeInViewport();
  await page.evaluate(line => { location.hash = `L${line}`; }, end);
  await expect(page.locator('.v2-source-highlight')).toHaveCount(1);
  await expect(page.locator(`#L${end}`)).toHaveClass(/v2-source-highlight/);
  await expect(page.locator(`#L${end}`)).toBeInViewport();
  await expect(page.getByRole('link', { name: 'View on GitHub', exact: true })).toHaveAttribute('href', new RegExp(sourcePinned ? `#L${end}$` : '/lib/styles\\.dart$'));
  await page.getByLabel('Source file', { exact: true }).selectOption('tokens.dart');
  await expect(page).toHaveURL(/\?file=tokens\.dart$/);
  await expect(page.locator('.v2-source-highlight')).toHaveCount(0);
  await expectNoOverflow(page);
});

test('library installs use version-agnostic prerelease ranges and SDK requirements', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.route('**/v2-flutter/flutter_bootstrap.js', route => route.abort());
  await page.goto('/v2/');
  const libraries = page.locator('.v2-end');
  await expect(libraries).toContainText('Requires Flutter 3.44+ (Dart 3.12+).');
  await expect(libraries).toContainText('Remix brings Mix and Naked UI with it.');
  await expect(libraries.locator('code')).toHaveText([
    'flutter pub add mix',
    'flutter pub add "remix:^1.0.0-0"',
    'flutter pub add "naked_ui:^2.0.0-0"',
  ]);
  await expect(libraries).not.toContainText('beta.');
  await expectNoOverflow(page);
});

test('source setup includes runnable steps and pinned GitHub links', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/v2/source/?file=web/flutter_bootstrap.js#L1');
  await expect(page.locator('.v2-source-readme')).toHaveAttribute('open', '');
  const setup = page.locator('.v2-source-setup');
  await expect(setup).toContainText('Requires Flutter 3.44+ (Dart 3.12+).');
  const site = JSON.parse(readFileSync('public/__site.json', 'utf8'));
  await expect(setup.locator('pre')).toHaveText([`git clone https://github.com/btwld/mix-website.git
cd mix-website
git checkout ${site.commit}
cd packages/mix_showcase
flutter pub get
flutter run -d chrome`, 'flutter run -d chrome -t lib/token_example.dart']);
  await expect(setup.locator('dd')).toHaveText(['2.3.1', '1.0.0-beta.17', '2.0.0-beta.1']);
  const github = (await setup.getByRole('link', { name: 'Browse the showcase package on GitHub' }).getAttribute('href'))!;
  expect(github).toMatch(/^https:\/\/github\.com\/btwld\/mix-website\/tree\/(?:[a-f0-9]+|main)\/packages\/mix_showcase$/);
  await expect(page.getByRole('link', { name: 'View on GitHub', exact: true })).toHaveAttribute('href', `${github.replace('/tree/', '/blob/')}/web/flutter_bootstrap.js${sourcePinned ? '#L1' : ''}`);
  await expectNoOverflow(page);
});

for (const width of [1440, 390]) {
  test(`tokens teach the running interface in place at ${width}px`, async ({ page, browserName }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route('**/v2-flutter/flutter_bootstrap.js', route => route.abort());
    await page.goto('/v2/#v2-looks');
    const looks = page.locator('[data-chapter="looks"]');
    await expect(looks.getByText('Each look gives the same tokens new values.', { exact: false })).toBeVisible();
    const panel = await openFeature(page, 'tokens');
    if (width === 390) {
      await expect.poll(() => page.evaluate(() => {
        const heading = document.getElementById('v2-title-looks')!.getBoundingClientRect();
        const stage = document.querySelector('.v2-stage-column')!.getBoundingClientRect();
        return heading.top >= stage.bottom && heading.bottom <= innerHeight;
      })).toBe(true);
    }
    const steps = panel.getByRole('group', { name: 'Token steps' });
    // The runnable starter is offered before the excerpts, not after them.
    const starter = panel.getByRole('link', { name: 'Run the token starter' });
    await expect(starter).toBeVisible();
    expect(await starter.evaluate(link => link.compareDocumentPosition(document.getElementById('v2-token-code')!) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
    // The first loop uses built-in color tokens only; app adapters wait one level deeper.
    const lesson = panel.locator('#v2-token-code');
    await expect(lesson.locator('pre')).toHaveText(/^const \$canvas = ColorToken\('canvas'\);\s+const \$surface = ColorToken\('surface'\);\s*$/);
    await steps.getByRole('button', { name: '2. Provide' }).click();
    await expect(lesson.locator('pre')).toContainText('return MixScope(');
    await expect(lesson.locator('pre')).toContainText('$canvas: look.canvas,');
    await expect(lesson.locator('pre')).toContainText('child: child,');
    await expect(lesson.locator('pre')).toContainText('// ···');
    await panel.getByRole('group', { name: 'Compare token values' }).getByRole('button', { name: 'Paper', exact: true }).click();
    await expect(lesson.locator('pre')).toContainText('const paper = Look(');
    await expect(lesson.locator('pre')).toContainText('canvas: Color(0xFFF3EDE1)');
    await expect(lesson.locator('pre')).toContainText('surface: Color(0xFFFBF8F1)');
    // Every omitted stretch is a separate exact range: no line is shown that the link does not cover.
    const ranges = await lesson.locator('figcaption a').evaluateAll(links => links.map(link => link.getAttribute('href')!));
    expect(ranges.length).toBeGreaterThan(2);
    for (const href of ranges) expect(href).toMatch(/^\/v2\/source\/\?file=tokens\.dart#L\d+-L\d+$/);
    await steps.getByRole('button', { name: '3. Use' }).click();
    await expect(lesson.locator('pre')).toContainText('final canvasStyle = BoxStyler()');
    await expect(lesson.locator('pre')).toContainText('.color($canvas())');
    await expect(lesson.locator('pre')).toContainText('Box(');
    await expect(lesson.locator('pre')).toContainText('style: canvasStyle,');
    await expect(lesson.locator('pre')).toContainText('child: const CardDeck(),');
    for (const adapter of ['ShapeToken', 'LiftToken', '$cardShape', '$lift', 'onBreakpoint']) await expect(lesson.locator('pre')).not.toContainText(adapter);
    // Uses links resolve through Dart imports, not to a same-named starter token.
    await expect(lesson.locator('.v2-code-uses').getByRole('link', { name: '$canvas', exact: true })).toHaveAttribute('href', /^\/v2\/source\/\?file=tokens\.dart#L\d+$/);
    if (browserName === 'chromium') {
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      await lesson.getByRole('button', { name: 'Copy Dart excerpt' }).click();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await lesson.locator('pre').innerText());
    }
    // The complete app setup, including its adapters, stays available as optional depth.
    const app = panel.locator('details.v2-token-app');
    await expect(app).not.toHaveAttribute('open', '');
    await app.locator('summary').click();
    for (const code of ['const $cardShape = ShapeToken', 'const $lift = LiftToken', 'Widget lookScope(', '.shape($cardShape.mix())', 'final cardPad = cardStyle', 'style: cardPad,']) await expect(app.locator('pre')).toContainText(code);
    await expect(app).toContainText('not built-in Mix APIs');
    await expectNoOverflow(page);
    await starter.click();
    await expect(page.getByLabel('Source file', { exact: true })).toHaveValue('token_example.dart');
    await expect(page.locator('.v2-source-readme')).toHaveAttribute('open', '');
  });
}

for (const { width, height } of [{ width: 390, height: 844 }, { width: 320, height: 700 }]) {
  test(`phone Looks fits its content and reading code moves the pinned demo aside at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.route('**/v2-flutter/flutter_bootstrap.js', route => route.abort());
    await page.goto('/v2/');
    await page.locator('.v2-step[data-step="looks"]').click();
    const looks = page.locator('[data-chapter="looks"]');
    await expect(looks).toHaveAttribute('data-active', 'true');
    // No reserved scroll: the chapter is its content plus padding.
    const [chapter, body] = await looks.evaluate((section: HTMLElement) => [section.offsetHeight, section.querySelector<HTMLElement>('.v2-chapter-body')!.offsetHeight]);
    expect(chapter - body).toBeLessThanOrEqual(100);
    const stageBottom = () => page.locator('.v2-stage-column').evaluate(column => column.getBoundingClientRect().bottom);
    // Where the demo rests once pinned: its sticky offset plus its height.
    const pinned = await page.locator('.v2-stage-column').evaluate(column => parseFloat(getComputedStyle(column).top) + column.getBoundingClientRect().height);
    const toggle = page.locator('.v2-preview-toggle');
    await expect(toggle).toHaveCount(0);

    const summary = looks.locator('summary').filter({ hasText: 'See the Dart' });
    await summary.click();
    await expect(page.locator('.v2')).toHaveAttribute('data-preview', 'hidden');
    await expect.poll(stageBottom).toBeLessThanOrEqual(130);
    await expect(page.locator('#v2-stage')).toHaveJSProperty('inert', true);
    // The lesson the reader opened starts right below the remaining strip.
    await expect(summary).toBeInViewport();
    await expect.poll(() => summary.evaluate(item => item.getBoundingClientRect().top)).toBeLessThan(200);
    await expect(toggle).toHaveText('Show preview');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toHaveAttribute('aria-controls', 'v2-stage');
    await expect(page.locator('.v2-steps')).toBeInViewport();

    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.v2')).toHaveAttribute('data-preview', 'shown');
    await expect.poll(stageBottom).toBeCloseTo(pinned, 0);
    await expect(page.locator('#v2-stage')).toHaveJSProperty('inert', false);
    await expect(toggle).toHaveText('Hide preview');
    await expect(toggle).toBeFocused();
    // The first line being read stays visible below the returned demo.
    await expect(summary).toBeInViewport();
    expect(await summary.evaluate(item => item.getBoundingClientRect().top)).toBeGreaterThanOrEqual(await stageBottom());

    await page.keyboard.press('Space');
    await expect(page.locator('.v2')).toHaveAttribute('data-preview', 'hidden');
    await summary.click();
    await expect(page.locator('.v2')).toHaveAttribute('data-preview', 'shown');
    await expect(toggle).toHaveCount(0);

    // Chapter navigation shows the demo again and lands below where it rests.
    await summary.click();
    await expect(page.locator('.v2')).toHaveAttribute('data-preview', 'hidden');
    await page.locator('.v2-step[data-step="motion"]').click();
    await expect(page.locator('.v2')).toHaveAttribute('data-preview', 'shown');
    await expect(page.locator('[data-chapter="motion"]')).toHaveAttribute('data-active', 'true');
    await expect.poll(() => page.evaluate(() => document.getElementById('v2-title-motion')!.getBoundingClientRect().top
      >= document.querySelector('.v2-stage-column')!.getBoundingClientRect().bottom)).toBe(true);
    await expectNoOverflow(page);
  });
}

test('the desktop tour keeps the pinned demo beside open code', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route('**/v2-flutter/flutter_bootstrap.js', route => route.abort());
  await page.goto('/v2/');
  await page.locator('.v2-step[data-step="looks"]').click();
  const looks = page.locator('[data-chapter="looks"]');
  expect(await looks.evaluate((section: HTMLElement) => section.offsetHeight)).toBeGreaterThan(900 * 2);
  await looks.locator('summary').filter({ hasText: 'See the Dart' }).click();
  await expect(page.locator('.v2-preview-toggle')).toBeHidden();
  await expect(page.locator('#v2-stage')).toHaveJSProperty('inert', false);
  await expect(page.locator('#v2-stage')).toBeInViewport();
});

test('the loading placeholder requests no image and gives way to recovery', async ({ page }) => {
  const requested: string[] = [];
  page.on('request', request => { if (/\/v2-flutter\/(?!flutter_bootstrap\.js)/.test(request.url())) requested.push(request.url()); });
  let fail!: () => void;
  const held = new Promise<void>(resolve => { fail = resolve; });
  await page.route('**/v2-flutter/flutter_bootstrap.js', async route => { await held; await route.abort(); });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    if (width === 1440) await page.goto('/v2/', { waitUntil: 'domcontentloaded' });
    const placeholder = page.locator('.v2-poster');
    await expect(placeholder).toBeVisible();
    await expect(placeholder.locator('i').first()).toBeVisible();
    await expect(page.locator('.v2-stage img')).toHaveCount(0);
    await expect(page.locator('.v2-loading')).toHaveText('Loading interactive showcase…');
  }
  expect(requested).toEqual([]);
  fail();
  await expect(page.getByText('The live preview couldn’t load.')).toBeVisible();
  await expect(page.locator('.v2-poster')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible();
});

test('developer documentation handoffs contain their requested sections', async ({ request }) => {
  for (const href of [
    '/mix/docs/guides/design-token/#mixscope',
    '/mix/docs/guides/design-token/#context-tokens',
    '/remix/docs/styler-api/#variants-and-selected-state',
    '/remix/docs/fortal/#scope-placement',
    '/remix/docs/components/checkbox/#basic-implementation',
    '/naked-ui/docs/widget/checkbox/#basic-implementation',
    '/remix/docs/getting-started/#your-first-component',
    '/naked-ui/docs/#basic-implementation',
  ]) {
    const [path, anchor] = href.split('#');
    const response = await request.get(path);
    expect(response.ok(), href).toBe(true);
    expect(await response.text(), href).toContain(`id="${anchor}"`);
  }
});

test('Remix breadth links reach their docs groups and preserve the live-component chips', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/v2-flutter/flutter_bootstrap.js', route => route.abort());
  await page.goto('/v2/');
  const remix = page.locator('[data-chapter="remix"]');
  const groups = remix.getByRole('list', { name: 'Also in Remix', exact: true });
  await expect(groups.getByRole('link')).toHaveCount(6);
  const destinations = {
    Overlays: '/remix/docs/components/dialog/',
    Navigation: '/remix/docs/components/tabs/',
    Feedback: '/remix/docs/components/progress/',
    Layout: '/remix/docs/components/accordion/',
    'Data display': '/remix/docs/components/data_table/',
    'Agent surfaces': '/remix/docs/agent/composer/',
  };
  for (const [name, href] of Object.entries(destinations)) {
    const link = groups.getByRole('link', { name, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', href);
  }
  const liveComponents = remix.getByRole('list', { name: 'Explore Remix components', exact: true });
  await expect(liveComponents.getByRole('link')).toHaveText([
    'Button', 'Icon button', 'Checkbox', 'Slider', 'Switch', 'Segmented control', 'Avatar', 'Badge', 'Dialog', 'Text field', 'Toast',
  ]);
  for (const [name, slug] of Object.entries({
    Button: 'button', 'Icon button': 'icon_button', Checkbox: 'checkbox', Slider: 'slider',
    Switch: 'switch', 'Segmented control': 'segmented_control', Avatar: 'avatar', Badge: 'badge',
    Dialog: 'dialog', 'Text field': 'textfield', Toast: 'toast',
  })) {
    const link = liveComponents.getByRole('link', { name, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', `/remix/docs/components/${slug}/`);
  }
  await expectNoOverflow(page);
});

test('the Naked invite instructions expose the real bare-widget excerpt and its source range', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/v2-flutter/flutter_bootstrap.js', route => route.abort());
  await page.goto('/v2/#v2-naked');
  const naked = page.locator('[data-chapter="naked"]');
  await expect(naked.getByRole('button', { name: 'Try the Naked invite', exact: true })).toBeVisible();
  await expect(naked).toContainText('Tab stays inside, Escape closes it, and this demo returns focus to Invite.');
  await expect(naked).toContainText('Demo only: nothing is sent.');
  const excerpt = naked.locator('.v2-code').filter({ has: page.locator('figcaption a[href*="file=invite.dart"]') });
  await excerpt.locator('summary').click();
  await expect(excerpt.locator('pre')).toContainText('NakedDialog(');
  await expect(excerpt.locator('pre')).toContainText('NakedTextField(');
  const firstLine = (await excerpt.locator('pre').innerText()).split('\n')[0].trim();
  const link = excerpt.locator('figcaption a').first();
  const href = (await link.getAttribute('href'))!;
  const [start, end] = href.match(/#L(\d+)-L(\d+)$/)!.slice(1).map(Number);
  await link.click();
  await expect(page.getByLabel('Source file', { exact: true })).toHaveValue('invite.dart');
  await expect(page.locator('.v2-source-highlight')).toHaveCount(end - start + 1);
  await expect(page.locator(`#L${start}`)).toContainText(firstLine);
  await expect(page.locator(`#L${start}`)).toBeInViewport();
  await expectNoOverflow(page);
});

test('docs links reach sections and follow the selected motion mode', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route('**/v2-flutter/flutter_bootstrap.js', route => route.abort());
  await page.goto('/v2/');
  const chapters = {
    looks: '/mix/docs/guides/design-token/#mixscope',
    states: '/mix/docs/guides/dynamic-styling/#interaction',
    adapt: '/mix/docs/guides/dynamic-styling/#breakpoint',
    remix: '/remix/docs/components/checkbox/#basic-implementation',
    naked: '/naked-ui/docs/widget/checkbox/#basic-implementation',
  };
  for (const [chapter, href] of Object.entries(chapters)) {
    await expect(page.locator(`[data-chapter="${chapter}"] > .v2-chapter-body > a.v2-link`)).toHaveAttribute('href', href);
  }
  const motion = page.locator('[data-chapter="motion"]');
  const modes = { Transitions: 'curve-based-configs', Springs: 'spring-based-configs', Keyframes: 'keyframe-animations' };
  for (const [name, anchor] of Object.entries(modes)) {
    await motion.getByRole('button', { name, exact: true }).click();
    await expect(motion.getByRole('link', { name: 'Animation guide' })).toHaveAttribute('href', `/mix/docs/guides/animations/#${anchor}`);
  }
  const featureDocs = {
    tokens: chapters.looks, states: chapters.states, layout: chapters.adapt,
    transitions: '/mix/docs/guides/animations/#curve-based-configs',
    springs: '/mix/docs/guides/animations/#spring-based-configs',
    keyframes: '/mix/docs/guides/animations/#keyframe-animations',
    remix: '/remix/docs/components/checkbox/#basic-implementation', naked: chapters.naked,
    overlays: '/remix/docs/components/dialog/',
    'open-code': '/remix/docs/open-code/',
    'material-bridge': '/mix/docs/guides/design-token/#context-tokens',
  };
  for (const [feature, href] of Object.entries(featureDocs)) {
    await openFeature(page, feature);
    await expect(page.locator('[data-chapter][data-active="true"] > .v2-chapter-body > a.v2-link')).toHaveAttribute('href', href);
  }
  const libraries = page.locator('.v2-end');
  for (const [name, href] of Object.entries({
    'Start with Mix': '/mix/docs/overview/getting-started/#installation',
    'Start with Remix': '/remix/docs/getting-started/#your-first-component',
    'Start with Naked UI': '/naked-ui/docs/#basic-implementation',
    'Remix checkbox': '/remix/docs/components/checkbox/#basic-implementation',
    NakedCheckbox: '/naked-ui/docs/widget/checkbox/#basic-implementation',
  })) {
    await expect(libraries.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
  }
  // Maturity follows the pinned versions: Mix is stable, Remix and Naked UI are prereleases.
  await expect(libraries.locator('.v2-library-role')).toHaveText(['Styling · Stable release', 'Components · Prerelease', 'Behavior · Prerelease']);
});

test.describe('live showcase', () => {
  test.skip(!hasLocalShowcase, 'Build packages/mix_showcase locally to exercise the live Flutter integration.');

  for (const width of [1440, 390]) {
    test(`invite feature previews select Team and restore chapter defaults at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto('/v2/');
      await expect(page.locator('.v2-stage')).toHaveAttribute('data-ready', 'true');
      await observeShowcasePatches(page);
      const remix = page.locator('[data-chapter="remix"]');
      for (const feature of featureExcerpts.filter(item => ['overlays', 'material-bridge'].includes(item.id))) {
        const panel = await openFeature(page, feature.id);
        await expect(page).toHaveURL(/#v2-remix$/);
        await expect(remix).toHaveAttribute('data-active', 'true');
        await expect(remix.getByRole('heading')).toBeFocused();
        await expect(panel.locator('pre')).toContainText(feature.code);
        await expect.poll(() => lastShowcaseState(page)).toMatchObject({ highlight: 'team', xray: true, naked: false, phone: false });
        await page.locator('.v2-step[data-step="remix"]').click();
        await expect.poll(() => lastShowcaseState(page)).toMatchObject({ highlight: width === 390 ? 'today' : null, xray: true, naked: false });
        if (width === 1440) await expectChapterHeadingBelowNav(page, 'remix');
      }
      await remix.getByRole('button', { name: 'Try the invite', exact: true }).click();
      await expect(remix.getByRole('heading')).toBeFocused();
      await expect.poll(() => lastShowcaseState(page)).toMatchObject({ highlight: 'team', xray: true, naked: false });
      if (width === 1440) await expectChapterHeadingBelowNav(page, 'remix');
      await expect(page.locator('flutter-view')).toHaveCount(1);
      await expectNoOverflow(page);
    });

    test(`the bare Naked invite is reachable at ${width}px and after resizing`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto('/v2/');
      await expect(page.locator('.v2-stage')).toHaveAttribute('data-ready', 'true');
      await observeShowcasePatches(page);
      const naked = page.locator('[data-chapter="naked"]');
      await page.locator('.v2-step[data-step="naked"]').click();
      // A null highlight preserves the short-stage Today default in Flutter.
      await expect.poll(() => lastShowcaseState(page)).toMatchObject({ highlight: null, naked: true, xray: false, phone: false });
      await naked.getByRole('button', { name: 'Try the Naked invite', exact: true }).click();
      await expect(page).toHaveURL(/#v2-naked$/);
      await expect(naked).toHaveAttribute('data-active', 'true');
      await expect(naked.getByRole('heading')).toBeFocused();
      await expect.poll(() => lastShowcaseState(page)).toMatchObject({ highlight: 'team', naked: true, xray: false, phone: false });
      if (width === 1440) await expectChapterHeadingBelowNav(page, 'naked');
      await page.setViewportSize({ width: width === 390 ? 1440 : 390, height: width === 390 ? 900 : 844 });
      // Re-anchor after the reading line moves on resize; retain the explicit intent.
      await naked.getByRole('button', { name: 'Try the Naked invite', exact: true }).click();
      await expect.poll(() => lastShowcaseState(page)).toMatchObject({ highlight: 'team', naked: true, xray: false, phone: false });
      await page.locator('.v2-step[data-step="blocks"]').click();
      await expect.poll(() => lastShowcaseState(page)).toMatchObject({ highlight: 'team', naked: false, xray: false });
      await page.locator('.v2-step[data-step="naked"]').click();
      await expect.poll(() => lastShowcaseState(page)).toMatchObject({ highlight: null, naked: true, xray: false });
      await expect(page.locator('flutter-view')).toHaveCount(1);
      await expectNoOverflow(page);
    });
  }

  for (const mode of ['remix', 'naked'] as const) {
    test(`${mode} invite targeting selected during startup replays when Flutter is ready`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      let release!: () => void;
      const startup = new Promise<void>(resolve => { release = resolve; });
      await page.route('**/v2-flutter/flutter_bootstrap.js', async route => { await startup; await route.continue(); });
      const chapter = page.locator(`[data-chapter="${mode}"]`);
      try {
        await page.goto('/v2/', { waitUntil: 'domcontentloaded' });
        if (mode === 'remix') {
          await openFeature(page, 'overlays');
        } else {
          await page.locator('.v2-step[data-step="naked"]').click();
          await chapter.getByRole('button', { name: 'Try the Naked invite', exact: true }).click();
        }
        await expect(chapter.getByRole('heading')).toBeFocused();
        await observeShowcasePatches(page, true);
      } finally { release(); }
      await expect(page.locator('.v2-stage')).toHaveAttribute('data-ready', 'true');
      await expect(page).toHaveURL(new RegExp(`#v2-${mode}$`));
      await expect(chapter).toHaveAttribute('data-active', 'true');
      await expect.poll(() => lastShowcaseState(page)).toMatchObject({ highlight: 'team', naked: mode === 'naked', xray: mode === 'remix', phone: false });
      await expect(page.locator('flutter-view')).toHaveCount(1);
    });
  }

  test('motion selected during startup replays, and feature previews keep the chosen animation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    let release!: () => void;
    const startup = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/v2-flutter/flutter_bootstrap.js', async route => { await startup; await route.continue(); });
    const motion = page.locator('[data-chapter="motion"]');
    const choices = motion.getByRole('group', { name: 'Choose an animation' });
    try {
      await page.goto('/v2/', { waitUntil: 'domcontentloaded' });
      await page.locator('.v2-step[data-step="motion"]').click();
      await choices.getByRole('button', { name: 'Springs', exact: true }).click();
      await expect(choices.getByRole('button', { name: 'Springs', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await motion.getByText('See the Dart', { exact: false }).click();
      await expect(motion.locator('pre')).toContainText('.animate(.spring(320.ms))');
      // Observe real bridge calls, while continuing to run the actual Flutter app.
      await page.evaluate(() => {
        const observed = window as typeof window & { observedPatches?: Record<string, unknown>[] };
        observed.observedPatches = [];
        const ready = window.__mixShowcaseReady!;
        window.__mixShowcaseReady = () => {
          const apply = window.__mixShowcase!.apply;
          window.__mixShowcase!.apply = json => {
            observed.observedPatches!.push(JSON.parse(json));
            apply(json);
          };
          ready();
        };
      });
    } finally { release(); }
    await expect(page.locator('.v2-stage')).toHaveAttribute('data-ready', 'true');
    const lastHighlight = () => page.evaluate(() => (window as typeof window & { observedPatches?: Record<string, unknown>[] })
      .observedPatches?.filter(patch => Object.hasOwn(patch, 'highlight')).at(-1)?.highlight);
    await expect.poll(lastHighlight).toBe('spending');
    const examples = [
      { name: 'Transitions', feature: 'Transitions', highlight: null, code: 'AnimationConfig.easeOut(420.ms)' },
      { name: 'Keyframes', feature: 'Keyframe timelines', highlight: 'player', code: "KeyframeTrack<double>('height'" },
      { name: 'Springs', feature: 'Spring motion', highlight: 'spending', code: '.animate(.spring(320.ms))' },
    ];
    for (const example of examples) {
      await choices.getByRole('button', { name: example.name, exact: true }).click();
      await expect(choices.getByRole('button', { name: example.name, exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(motion.locator('pre')).toContainText(example.code);
      await expect.poll(lastHighlight).toBe(example.highlight);
    }
    for (const example of examples) {
      await page.getByRole('navigation', { name: 'Main', exact: true }).getByRole('link', { name: 'Features & code' }).click();
      await expectFeatureLanding(page);
      await page.getByRole('group', { name: 'Choose a feature', exact: true }).getByRole('button', { name: example.feature, exact: true }).click();
      await expect(page).toHaveURL(/#v2-motion$/);
      await expect(motion).toHaveAttribute('data-active', 'true');
      await expect(motion.getByRole('heading')).toBeFocused();
      await expect(choices.getByRole('button', { name: example.name, exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(motion.locator('pre')).toContainText(example.code);
      await expect.poll(lastHighlight).toBe(example.highlight);
    }
  });

  for (const width of [320, 390]) {
    test(`feature round trips scroll back and reveal the Remix task card at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/v2/');
      await expect(page.locator('.v2-stage')).toHaveAttribute('data-ready', 'true');
      await page.evaluate(() => {
        const observed = window as typeof window & { observedPatches?: Record<string, unknown>[] };
        observed.observedPatches = [];
        const apply = window.__mixShowcase!.apply;
        window.__mixShowcase!.apply = json => {
          observed.observedPatches!.push(JSON.parse(json));
          apply(json);
        };
      });
      const lastPatch = () => page.evaluate(() => (window as typeof window & { observedPatches?: Record<string, unknown>[] })
        .observedPatches?.filter(patch => Object.hasOwn(patch, 'highlight')).at(-1));
      await openFeature(page, 'keyframes');
      const motion = page.locator('[data-chapter="motion"]');
      await expect(page).toHaveURL(/#v2-motion$/);
      await expect(motion).toHaveAttribute('data-active', 'true');
      await expect(motion.getByRole('button', { name: 'Keyframes', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect.poll(lastPatch).toMatchObject({ highlight: 'player', xray: false });
      const panel = await openFeature(page, 'remix');
      await expect(panel.locator('pre')).toContainText('child: RemixCheckbox(');
      const remix = page.locator('[data-chapter="remix"]');
      await expect(page).toHaveURL(/#v2-remix$/);
      await expect(remix).toHaveAttribute('data-active', 'true');
      await expect(remix.getByRole('heading')).toBeFocused();
      await expect.poll(lastPatch).toMatchObject({ highlight: 'today', xray: true, naked: false, phone: false });
      await expect(remix.locator('.v2-remix-styling details.v2-code').first()).toHaveAttribute('open', '');
      await expect(remix.locator('.v2-remix-styling pre')).toContainText('child: RemixCheckbox(');
      await expectNoOverflow(page);
    });
  }

  test('a look chosen during loading reaches Flutter when it becomes ready', async ({ page }) => {
    let release!: () => void;
    const startup = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/v2-flutter/flutter_bootstrap.js', async route => { await startup; await route.continue(); });
    try {
      await page.goto('/v2/', { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'Explore the showcase' }).click();
      await page.getByRole('button', { name: 'Cyber', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Cyber', exact: true })).toHaveAttribute('aria-pressed', 'true');
      // Observe real commands at the bridge boundary, without replacing Flutter.
      await page.evaluate(() => {
        const observed = window as typeof window & { observedLooks?: string[] };
        observed.observedLooks = [];
        const ready = window.__mixShowcaseReady!;
        window.__mixShowcaseReady = () => {
          const apply = window.__mixShowcase!.apply;
          window.__mixShowcase!.apply = json => {
            const patch = JSON.parse(json);
            if (patch.look) observed.observedLooks!.push(patch.look);
            apply(json);
          };
          ready();
        };
      });
    } finally { release(); }
    await expect(page.locator('.v2-stage')).toHaveAttribute('data-ready', 'true');
    await expect.poll(() => page.evaluate(() => (window as typeof window & { observedLooks?: string[] }).observedLooks?.at(-1))).toBe('cyber');
  });

  for (const width of [1440, 390]) {
    test(`every chapter remains reachable at ${width}px`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto('/v2/');
      await expect(page.locator('.v2-stage')).toHaveAttribute('data-ready', 'true');
      const chapters = ['looks', 'states', 'adapt', 'motion', 'remix', 'naked', 'blocks'];
      for (const chapter of [...chapters, ...chapters.toReversed()]) {
        await page.locator(`.v2-step[data-step="${chapter}"]`).click();
        await expect(page.locator(`[data-chapter="${chapter}"]`)).toHaveAttribute('data-active', 'true');
        await expect(page).toHaveURL(new RegExp(`#v2-${chapter}$`));
        if (width === 1440) await expectChapterHeadingBelowNav(page, chapter);
      }
      await expectNoOverflow(page);
      expect(errors).toEqual([]);
    });
  }

  test('hiding and showing the phone preview keeps the one running app and its look', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/v2/');
    await expect(page.locator('.v2-stage')).toHaveAttribute('data-ready', 'true');
    await page.evaluate(() => { (window as typeof window & { firstView?: Element | null }).firstView = document.querySelector('flutter-view'); });
    await observeShowcasePatches(page);
    const looks = page.locator('[data-chapter="looks"]');
    await page.locator('.v2-step[data-step="looks"]').click();
    await looks.getByRole('group', { name: 'Choose a look', exact: true }).getByRole('button', { name: 'Cyber', exact: true }).click();
    const patches = () => page.evaluate(() => (window as typeof window & { observedPatches?: Record<string, unknown>[] }).observedPatches!);
    await expect.poll(async () => (await patches()).filter(patch => 'look' in patch).at(-1)?.look).toBe('cyber');
    const sentBefore = (await patches()).length;
    const summary = looks.locator('summary').filter({ hasText: 'See the Dart' });
    await summary.click();
    await expect(page.locator('.v2')).toHaveAttribute('data-preview', 'hidden');
    const toggle = page.locator('.v2-preview-toggle');
    await toggle.click();
    await expect(page.locator('.v2')).toHaveAttribute('data-preview', 'shown');
    await toggle.click();
    await summary.click();
    await expect(page.locator('.v2')).toHaveAttribute('data-preview', 'shown');
    await expect(page.locator('flutter-view')).toHaveCount(1);
    expect(await page.evaluate(() => document.querySelector('flutter-view') === (window as typeof window & { firstView?: Element | null }).firstView)).toBe(true);
    await expect(looks.getByRole('button', { name: 'Cyber', exact: true }).first()).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.v2-stage-caption')).toContainText('Cyber');
    // Hiding is layout only: Flutter receives no new look or chapter state.
    expect(await patches()).toHaveLength(sentBefore);
  });

  test('phone demo controls reveal the running preview after reading code', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/v2/');
    await expect(page.locator('.v2-stage')).toHaveAttribute('data-ready', 'true');
    await page.evaluate(() => { (window as typeof window & { controlView?: Element | null }).controlView = document.querySelector('flutter-view'); });
    await observeShowcasePatches(page);
    await page.locator('.v2-step[data-step="looks"]').click();
    const looks = page.locator('[data-chapter="looks"]');
    await looks.locator('.v2-token-lesson > summary').click();
    await expect(page.locator('.v2')).toHaveAttribute('data-preview', 'hidden');

    // Scroll to the next controls, not a chapter jump that would already show the app.
    const motion = page.locator('[data-chapter="motion"]');
    const options = motion.getByRole('group', { name: 'Choose an animation' });
    const springs = options.getByRole('button', { name: 'Springs', exact: true });
    await springs.scrollIntoViewIfNeeded();
    await expect(page.locator('.v2')).toHaveAttribute('data-preview', 'hidden');
    await springs.click();
    await expect(page.locator('.v2')).toHaveAttribute('data-preview', 'shown');
    await expect.poll(() => lastShowcaseState(page)).toMatchObject({ highlight: 'spending' });
    expect(await springs.evaluate(button => button.getBoundingClientRect().top)).toBeGreaterThanOrEqual(await page.locator('.v2-stage-column').evaluate(column => column.getBoundingClientRect().bottom));

    await motion.locator('details.v2-code > summary').click();
    await expect(page.locator('.v2')).toHaveAttribute('data-preview', 'hidden');
    await options.getByRole('button', { name: 'Transitions', exact: true }).click();
    await expect(page.locator('.v2')).toHaveAttribute('data-preview', 'shown');
    await page.getByRole('button', { name: 'Hide preview', exact: true }).click();
    await motion.getByRole('button', { name: 'Animate to Paper', exact: true }).click();
    await expect(page.locator('.v2')).toHaveAttribute('data-preview', 'shown');
    await expect(motion.getByRole('button', { name: 'Animate to Paper', exact: true })).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Hide preview', exact: true }).click();
    const today = page.locator('[data-chapter="blocks"]').getByRole('button', { name: 'Today', exact: false });
    await today.scrollIntoViewIfNeeded();
    await expect(page.locator('.v2')).toHaveAttribute('data-preview', 'hidden');
    await today.click();
    await expect(page.locator('.v2')).toHaveAttribute('data-preview', 'shown');
    await expect.poll(() => lastShowcaseState(page)).toMatchObject({ highlight: 'today', naked: false, xray: false });
    await expect(page.locator('flutter-view')).toHaveCount(1);
    expect(await page.evaluate(() => document.querySelector('flutter-view') === (window as typeof window & { controlView?: Element | null }).controlView)).toBe(true);
    await expect(page.locator('.v2-stage')).toHaveJSProperty('inert', false);
    await expectNoOverflow(page);
  });

  test('a chosen look survives leaving and re-entering the Looks chapter', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/v2/');
    await expect(page.locator('.v2-stage')).toHaveAttribute('data-ready', 'true');
    const looks = page.locator('[data-chapter="looks"]');
    const cyber = looks.getByRole('button', { name: 'Cyber', exact: true });
    await page.locator('.v2-step[data-step="looks"]').click();
    await cyber.click();
    await page.locator('.v2-step[data-step="states"]').click();
    await expect(page.locator('[data-chapter="states"]')).toHaveAttribute('data-active', 'true');
    await page.locator('.v2-step[data-step="looks"]').click();
    await expect(looks).toHaveAttribute('data-active', 'true');
    await expect(cyber).toHaveAttribute('aria-pressed', 'true');
    await page.mouse.wheel(0, 300);
    await expect(cyber).toHaveAttribute('aria-pressed', 'true');
    await looks.getByRole('group', { name: 'Choose a look', exact: true }).getByRole('button', { name: 'Paper', exact: true }).click();
    const panel = await openFeature(page, 'tokens');
    await expect(looks.getByRole('group', { name: 'Choose a look', exact: true }).getByRole('button', { name: 'Paper', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await panel.getByRole('button', { name: '2. Provide' }).click();
    await expect(panel.locator('#v2-token-code pre')).toContainText('const paper = Look(');
    await expect(panel.locator('#v2-token-code pre')).toContainText('canvas: Color(0xFFF3EDE1)');
    await expect(page.locator('flutter-view')).toHaveCount(1);
  });

  // Pages answer 200 either way: only a mounted view shows the docs bundle really started.
  test('docs previews start after arriving from the showcase', async ({ page }) => {
    await page.goto('/v2/');
    await expect(page.locator('.v2-stage')).toHaveAttribute('data-ready', 'true');
    await page.getByLabel('Documentation', { exact: true }).click();
    await page.locator('.v2-docs-panel').getByRole('link', { name: /^Mix/ }).click();
    await page.waitForURL('**/mix/docs/**');
    await page.locator('a[href="/mix/"]:visible').first().click();
    await page.waitForURL(/\/mix\/$/);
    // Previews mount lazily, and the bundle guard reloads the page when the first one does.
    // A scroll that lands during that reload is expected to fail; poll again.
    await expect.poll(async () => {
      try {
        await page.mouse.wheel(0, 400);
        return await page.locator('flutter-view').count();
      } catch { return 0; }
    }, { timeout: 60_000 }).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.__mixShowcaseHost)).toBeUndefined();
  });

  test('shared chapter links and reduced motion survive a source-page round trip', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/v2/#v2-blocks');
    await expect(page.locator('.v2-stage')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('[data-chapter="blocks"]')).toHaveAttribute('data-active', 'true');
    await page.getByRole('link', { name: 'Explore the showcase source' }).click();
    await page.getByRole('link', { name: 'Back to showcase' }).click();
    await expect(page.locator('.v2-stage')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('[data-chapter="blocks"]')).toHaveAttribute('data-active', 'true');
  });
});

const openCodeCommands = [
  'flutter pub add --dev remix_cli:1.0.0-beta.1',
  'dart run remix_cli:remix init --prefix Fortal --preset fortal --ui-path lib/fortal',
  'dart run remix_cli:remix add checkbox',
  'dart run remix_cli:remix add badge',
  'dart run remix_cli:remix add card',
];

for (const width of [1440, 390]) {
  test(`open-code steps expose real commands, pinned provenance and exact excerpts at ${width}px`, async ({ page, browserName }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.route('**/v2-flutter/flutter_bootstrap.js', route => route.abort());
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/v2/#v2-remix');
    const remix = page.locator('[data-chapter="remix"]');
    await expectChapterHeadingBelowNav(page, 'remix');
    const controls = remix.getByRole('group', { name: 'Choose a component preset' });
    await expect(controls.getByRole('button')).toHaveText(['Your styles', 'Fortal light', 'Fortal dark']);
    await expect(controls.getByRole('button', { name: 'Your styles', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(controls).toBeInViewport();
    const details = remix.locator('.v2-open-code');
    await expect(details).not.toHaveAttribute('open', '');
    await details.locator('summary').click();
    await expect(details.locator('.lx-terminal-cmd')).toHaveText(openCodeCommands);
    if (browserName === 'chromium') {
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      for (const command of openCodeCommands) {
        await details.getByRole('button', { name: `Copy ${command}`, exact: true }).click();
        expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(command);
      }
    }
    const guides = details.getByRole('list', { name: 'Open code guides' });
    for (const [name, href] of Object.entries({
      'Open code': '/remix/docs/open-code/', Fortal: '/remix/docs/fortal/',
      Registries: '/remix/docs/guides/registries/', 'Agent surfaces': '/remix/docs/agent/composer/',
    })) await expect(guides.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
    await expect(details.getByRole('link', { name: 'remix.yaml', exact: true })).toHaveAttribute('href', '/v2/source/?file=remix.yaml');
    const registryPin = '2906c78596cf1060f56322770a66d96fe1a02c55';
    await expect(details.getByRole('link', { name: registryPin.slice(0, 12), exact: true })).toHaveAttribute('href', `https://github.com/btwld/remix/tree/${registryPin}/registry`);
    const site = JSON.parse(readFileSync('public/__site.json', 'utf8'));
    const files = `https://github.com/btwld/mix-website/blob/${site.commit}/packages/mix_showcase`;
    await expect(details.getByRole('link', { name: 'View the configuration on GitHub' })).toHaveAttribute('href', `${files}/remix.yaml`);
    await expect(details.getByRole('link', { name: 'View the installed checkbox on GitHub' })).toHaveAttribute('href', `${files}/lib/fortal/components/checkbox.dart`);
    for (const [file, name, contract] of [
      ['fortal/components/checkbox.dart', 'fortal-checkbox', '@MixWidget(target: RemixCheckbox.new)'],
    ]) {
      // Compute the independent expected range from real source markers, not the rendered href.
      const lines = readFileSync(`packages/mix_showcase/lib/${file}`, 'utf8').split('\n');
      const startMarker = lines.findIndex(line => line.trim() === `// #docregion ${name}`);
      const endMarker = lines.findIndex((line, index) => index > startMarker && line.trim() === `// #enddocregion ${name}`);
      expect(startMarker).toBeGreaterThanOrEqual(0);
      expect(endMarker).toBeGreaterThan(startMarker);
      const source = lines.slice(startMarker + 1, endMarker);
      const indent = Math.min(...source.filter(line => line.trim()).map(line => line.match(/^ */)![0].length));
      const expected = source.filter(line => !line.trim().startsWith('// #')).map(line => line.slice(indent)).join('\n');
      expect(expected).toContain(contract);
      const excerpt = details.locator('figure').filter({ has: page.locator(`figcaption a[href*="file=${file}"]`) });
      await expect(excerpt.locator('pre')).toHaveText(expected);
      const link = excerpt.locator('figcaption a').first();
      await expect(link).toHaveAttribute('href', `/v2/source/?file=${file}#L${startMarker + 2}-L${endMarker}`);
      await expectNoOverflow(page);
      await link.click();
      await expect(page.getByLabel('Source file', { exact: true })).toHaveValue(file);
      await expect(page.locator('.v2-source-highlight')).toHaveCount(endMarker - startMarker - 1);
      await expect(page.locator(`#L${startMarker + 2}`)).toBeInViewport();
      await expect(page.getByRole('link', { name: 'View on GitHub', exact: true })).toHaveAttribute('href', `${files}/lib/${file}${sourcePinned ? `#L${startMarker + 2}-L${endMarker}` : ''}`);
      await page.goBack();
      // A page restored without bfcache starts with disclosures closed.
      if (await details.getAttribute('open') === null) await details.locator('summary').click();
    }
    await expectNoOverflow(page);
  });
}

test('recursive source selection includes every installed Dart file, preserves history and copies whole files', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/v2/source/?file=fortal/components/checkbox.dart#L1');
  const selector = page.getByLabel('Source file', { exact: true });
  const installed = selector.locator('optgroup[label="Installed by remix add"] option');
  const expected = readdirSync('packages/mix_showcase/lib/fortal', { recursive: true })
    .map(String).filter(file => file.endsWith('.dart')).map(file => `lib/fortal/${file}`).sort();
  expect(expected).toContain('lib/fortal/components/checkbox.dart');
  expect(expected).toContain('lib/fortal/theme/theme_data.dart');
  expect(expected.some(file => file.endsWith('.g.dart'))).toBe(true);
  expect((await installed.allTextContents()).sort()).toEqual(expected);
  for (const file of ['fortal/components/checkbox.dart', 'fortal/theme/theme_data.dart', 'remix.yaml']) {
    await selector.selectOption(file);
    await expect(selector).toHaveValue(file);
    expect(new URL(page.url()).searchParams.get('file')).toBe(file);
    expect(new URL(page.url()).hash).toBe('');
    const path = file.endsWith('.dart') ? `lib/${file}` : file;
    const source = readFileSync(`packages/mix_showcase/${path}`, 'utf8');
    const region = page.getByRole('region', { name: `${path} source code`, exact: true });
    // Shiki may omit a final newline in its HTML; all source content must still match.
    expect((await region.locator('pre').innerText()).trimEnd()).toBe(source.trimEnd());
    await expect(page.locator('.v2-source-highlight')).toHaveCount(0);
    if (browserName === 'chromium') {
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.getByRole('button', { name: `Copy ${path}`, exact: true }).click();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source);
    }
    await expectNoOverflow(page);
  }
  await page.goBack();
  await expect(selector).toHaveValue('fortal/theme/theme_data.dart');
  await page.goForward();
  await expect(selector).toHaveValue('remix.yaml');
});

async function observedBridgeState(page: Page) {
  return page.evaluate(() => Object.assign({}, ...(window as typeof window & { observedPatches?: Record<string, unknown>[] }).observedPatches ?? []));
}

async function lastPresetPatch(page: Page) {
  return page.evaluate(() => (window as typeof window & { observedPatches?: Record<string, unknown>[] })
    .observedPatches?.filter(patch => Object.hasOwn(patch, 'preset')).at(-1));
}

test.describe('live open-code presets', () => {
  test.skip(!hasLocalShowcase, 'Build packages/mix_showcase locally to exercise the live Flutter integration.');

  for (const width of [1440, 390]) {
    test(`preset comparison is chapter-scoped, remembered and matched to feature previews at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/v2/');
      await expect(page.locator('.v2-stage')).toHaveAttribute('data-ready', 'true');
      await observeShowcasePatches(page);
      await page.locator('.v2-step[data-step="remix"]').click();
      const remix = page.locator('[data-chapter="remix"]');
      const controls = remix.getByRole('group', { name: 'Choose a component preset' });
      await expectChapterHeadingBelowNav(page, 'remix');
      await expect(controls).toBeInViewport();
      for (const [name, preset, presetMode] of [
        ['Fortal light', 'fortal', 'light'], ['Your styles', 'custom', 'light'], ['Fortal dark', 'fortal', 'dark'],
      ]) {
        await controls.getByRole('button', { name, exact: true }).click();
        await expect(controls.locator('[aria-pressed="true"]')).toHaveCount(1);
        await expect(controls.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true');
        await expect.poll(() => lastPresetPatch(page)).toEqual({ preset, presetMode });
        const excerpt = remix.locator('.v2-remix-styling');
        if (await excerpt.locator('details.v2-code').first().getAttribute('open') === null) await excerpt.locator('details.v2-code > summary').first().click();
        await expect(excerpt.locator('pre')).toContainText(preset === 'custom' ? 'CheckboxStyler()' : 'FortalTheme(');
        if (preset === 'fortal') {
          await expect(excerpt.locator('pre')).toContainText('final checkbox = FortalCheckbox(');
          await expect(excerpt.locator('.v2-code-uses').getByRole('link', { name: 'checkbox', exact: true })).toHaveCount(0);
        }
        await expect(page.locator('.v2-stage-caption')).toContainText(preset === 'custom' ? 'Midnight' : `${name} · Today`);
        await expect.poll(() => observedBridgeState(page)).toMatchObject({ preset, presetMode, highlight: 'today', naked: false, xray: true });
      }
      await page.locator('.v2-step[data-step="looks"]').click();
      await page.getByRole('button', { name: 'Cyber', exact: true }).click();
      await expect.poll(() => observedBridgeState(page)).toMatchObject({ look: 'cyber', preset: 'custom', presetMode: 'light' });
      await page.locator('.v2-step[data-step="naked"]').click();
      await expect.poll(() => observedBridgeState(page)).toMatchObject({ naked: true, preset: 'custom', presetMode: 'light' });
      await expect(page.locator('.v2-stage-caption')).toContainText('Bare rendering');
      await openFeature(page, 'open-code');
      await expect(remix.getByRole('heading')).toBeFocused();
      await expectChapterHeadingBelowNav(page, 'remix');
      await expect(controls.getByRole('button', { name: 'Fortal dark', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect.poll(() => observedBridgeState(page)).toMatchObject({ preset: 'fortal', presetMode: 'dark', look: 'cyber', naked: false, xray: true, highlight: 'today' });
      await openFeature(page, 'remix');
      await expect.poll(() => observedBridgeState(page)).toMatchObject({ preset: 'custom', highlight: 'today' });
      await expect(controls.getByRole('button', { name: 'Your styles', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('flutter-view')).toHaveCount(1);
      await expectNoOverflow(page);
    });
  }

  for (const name of ['Fortal light', 'Fortal dark']) {
    test(`${name} selected during startup replays at the real bridge`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      let release!: () => void;
      const startup = new Promise<void>(resolve => { release = resolve; });
      await page.route('**/v2-flutter/flutter_bootstrap.js', async route => { await startup; await route.continue(); });
      const remix = page.locator('[data-chapter="remix"]');
      try {
        await page.goto('/v2/#v2-remix', { waitUntil: 'domcontentloaded' });
        await remix.getByRole('button', { name, exact: true }).click();
        await expect(remix.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true');
        await observeShowcasePatches(page, true);
      } finally { release(); }
      await expect(page.locator('.v2-stage')).toHaveAttribute('data-ready', 'true');
      await expect(remix).toHaveAttribute('data-active', 'true');
      await expectChapterHeadingBelowNav(page, 'remix');
      await expect.poll(() => lastPresetPatch(page)).toEqual({ preset: 'fortal', presetMode: name === 'Fortal dark' ? 'dark' : 'light' });
      await expect.poll(() => observedBridgeState(page)).toMatchObject({ naked: false, xray: true, highlight: 'today' });
      await expect(page.locator('flutter-view')).toHaveCount(1);
    });
  }
});
