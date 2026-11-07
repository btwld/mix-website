import { existsSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const hasLocalShowcase = existsSync('public/v2-flutter/flutter_bootstrap.js');

const featureExcerpts: { id: string; name: string; code: string; file: string; also?: string }[] = [
  { id: 'composition', name: 'Style composition', code: '.onBreakpoint(.maxWidth(480), .padding(.all(14)))', file: 'styles.dart' },
  { id: 'tokens', name: 'Design tokens', code: 'return MixScope(', file: 'tokens.dart' },
  { id: 'states', name: 'Interaction states', code: 'final listRow = BoxStyler()', file: 'styles.dart' },
  { id: 'transitions', name: 'Transitions', code: 'AnimationConfig.easeOut(420.ms)', file: 'styles.dart' },
  { id: 'springs', name: 'Spring motion', code: '.animate(.spring(320.ms))', file: 'styles.dart' },
  { id: 'keyframes', name: 'Keyframe timelines', code: "KeyframeTrack<double>('height'", file: 'styles.dart' },
  { id: 'layout', name: 'Responsive layout', code: '.onBreakpoint(.maxWidth(480), .padding(.all(14)))', file: 'styles.dart', also: 'constraints.maxWidth < 640' },
  { id: 'remix', name: 'Remix components', code: 'CheckboxStyler()', file: 'styles.dart', also: 'child: RemixCheckbox(' },
  { id: 'naked', name: 'Naked UI behavior', code: 'return NakedCheckbox(', file: 'cards.dart' },
];

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

test('showcase navigation is server-rendered and works on a narrow phone without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 700 } });
  const page = await context.newPage();
  await page.goto('/v2/');
  await expect(page.getByRole('navigation', { name: 'Main', exact: true })).toHaveCount(1);
  await expect(page.locator('.site-nav')).toHaveCount(0);
  await page.getByLabel('Documentation', { exact: true }).click();
  await expect(page.locator('.v2-docs-panel a')).toHaveCount(3);
  await expect(page.locator('.v2-docs-panel')).toBeVisible();
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

test('features and source excerpts remain usable when Flutter cannot load', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route('**/v2-flutter/flutter_bootstrap.js', route => route.abort());
  await page.goto('/v2/');
  await expect(page.getByText('The live preview couldn’t load.')).toBeVisible();
  await page.getByRole('navigation', { name: 'Main', exact: true }).getByRole('link', { name: 'Features & code' }).click();
  await expect(page).toHaveURL(/#v2-features$/);
  const choices = page.getByRole('group', { name: 'Choose a feature', exact: true });
  const panel = page.locator('.v2-feature-panel');
  for (const feature of featureExcerpts) {
    const button = choices.getByRole('button', { name: feature.name, exact: true });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(choices.locator('[aria-pressed="true"]')).toHaveCount(1);
    await expect(panel.locator('pre')).toContainText(feature.code);
    if (feature.also) await expect(panel.locator('pre')).toContainText(feature.also);
    await expect(panel.locator('figcaption a').filter({ hasText: feature.file }).first()).toHaveAttribute('href', new RegExp(`^/v2/source/\\?file=${feature.file.replace('.', '\\.')}#L[0-9]+-L[0-9]+$`));
    await expect(panel.getByRole('button', { name: 'Copy Dart excerpt' })).toBeVisible();
    await expect(page).toHaveURL(/#v2-features$/);
  }
  if (browserName === 'chromium') {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await panel.getByRole('button', { name: 'Copy Dart excerpt' }).click();
    await expect(panel.getByRole('status')).toHaveText('Copied.');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await panel.locator('pre').innerText());
  }
  await expectNoOverflow(page);
});

test('all feature excerpts fit a 320px phone and preserve the feature anchor', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.route('**/v2-flutter/flutter_bootstrap.js', route => route.abort());
  await page.goto('/v2/#v2-features');
  const selector = page.getByLabel('Explore a feature', { exact: true });
  const panel = page.locator('.v2-feature-panel');
  await expect(selector).toBeVisible();
  await expect(page.getByRole('group', { name: 'Choose a feature', exact: true })).toBeHidden();
  for (const feature of featureExcerpts) {
    await selector.selectOption(feature.id);
    await expect(selector).toHaveValue(feature.id);
    await expect(panel.locator('pre')).toContainText(feature.code);
    if (feature.also) await expect(panel.locator('pre')).toContainText(feature.also);
    await expect(panel.getByRole('link', { name: 'Try it in the showcase' })).toBeVisible();
    await expect(page).toHaveURL(/#v2-features$/);
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

test('excerpt links reveal the exact highlighted source lines', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/v2-flutter/flutter_bootstrap.js', route => route.abort());
  await page.goto('/v2/#v2-features');
  const panel = page.locator('.v2-feature-panel');
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
  await expect(page.getByRole('link', { name: 'View on GitHub', exact: true })).toHaveAttribute('href', new RegExp(`/lib/styles\\.dart#L${start}-L${end}$`));
});

test('Uses links land on showcase declarations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/v2-flutter/flutter_bootstrap.js', route => route.abort());
  await page.goto('/v2/#v2-features');
  const uses = page.locator('.v2-feature-panel .v2-code-uses');
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
  await page.goto('/v2/source/?file=styles.dart#L22-L24,L33');
  await expect(page.locator('.v2-source-highlight')).toHaveCount(4);
  await expect(page.locator('#L22')).toBeInViewport();
  await page.evaluate(() => { location.hash = 'L33'; });
  await expect(page.locator('.v2-source-highlight')).toHaveCount(1);
  await expect(page.locator('#L33')).toHaveClass(/v2-source-highlight/);
  await expect(page.locator('#L33')).toBeInViewport();
  await expect(page.getByRole('link', { name: 'View on GitHub', exact: true })).toHaveAttribute('href', /#L33$/);
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
  await page.getByText('Use the source together', { exact: true }).click();
  const setup = page.locator('.v2-source-setup');
  await expect(setup).toContainText('Requires Flutter 3.44+ (Dart 3.12+).');
  await expect(setup.locator('pre')).toHaveText(`git clone https://github.com/btwld/mix-website.git
cd mix-website/packages/mix_showcase
flutter run -d chrome`);
  await expect(setup.locator('dd')).toHaveText(['2.3.1', '1.0.0-beta.17', '2.0.0-beta.1']);
  const github = (await setup.getByRole('link', { name: 'Browse the showcase package on GitHub' }).getAttribute('href'))!;
  expect(github).toMatch(/^https:\/\/github\.com\/btwld\/mix-website\/tree\/(?:[a-f0-9]+|main)\/packages\/mix_showcase$/);
  await expect(page.getByRole('link', { name: 'View on GitHub', exact: true })).toHaveAttribute('href', `${github.replace('/tree/', '/blob/')}/web/flutter_bootstrap.js#L1`);
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
    remix: '/remix/docs/styler-api/#variants-and-selected-state',
    naked: '/naked-ui/docs/widget/checkbox/#basic-implementation',
  };
  for (const [chapter, href] of Object.entries(chapters)) {
    await expect(page.locator(`[data-chapter="${chapter}"] > .v2-chapter-body > .v2-link`)).toHaveAttribute('href', href);
  }
  const motion = page.locator('[data-chapter="motion"]');
  const modes = { Transitions: 'curve-based-configs', Springs: 'spring-based-configs', Keyframes: 'keyframe-animations' };
  for (const [name, anchor] of Object.entries(modes)) {
    await motion.getByRole('button', { name, exact: true }).click();
    await expect(motion.getByRole('link', { name: 'Explore animation' })).toHaveAttribute('href', `/mix/docs/guides/animations/#${anchor}`);
  }
  const featureDocs = {
    tokens: chapters.looks, states: chapters.states, layout: chapters.adapt,
    transitions: '/mix/docs/guides/animations/#curve-based-configs',
    springs: '/mix/docs/guides/animations/#spring-based-configs',
    keyframes: '/mix/docs/guides/animations/#keyframe-animations',
    remix: '/remix/docs/components/checkbox/#basic-implementation', naked: chapters.naked,
  };
  for (const [feature, href] of Object.entries(featureDocs)) {
    await page.getByRole('group', { name: 'Choose a feature', exact: true }).getByRole('button', { name: featureExcerpts.find(item => item.id === feature)!.name, exact: true }).click();
    await expect(page.locator('.v2-feature-actions a').last()).toHaveAttribute('href', href);
  }
  for (const [name, href] of Object.entries({ Mix: '/mix/docs/overview/getting-started/#installation', Remix: '/remix/docs/getting-started/#installation', 'Naked UI': '/naked-ui/docs/#installation' })) {
    await expect(page.getByRole('link', { name: `Start with ${name}`, exact: false })).toHaveAttribute('href', href);
  }
});

test.describe('live showcase', () => {
  test.skip(!hasLocalShowcase, 'Build packages/mix_showcase locally to exercise the live Flutter integration.');

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
      await page.locator('.v2-feature-panel').getByRole('link', { name: 'Try it in the showcase' }).click();
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
      const featureLink = page.getByRole('navigation', { name: 'Main', exact: true }).getByRole('link', { name: 'Features & code' });
      const selector = page.getByLabel('Explore a feature', { exact: true });
      const panel = page.locator('.v2-feature-panel');
      await featureLink.click();
      await expectFeatureLanding(page);
      await selector.selectOption('keyframes');
      await panel.getByRole('link', { name: 'Try it in the showcase' }).click();
      const motion = page.locator('[data-chapter="motion"]');
      await expect(page).toHaveURL(/#v2-motion$/);
      await expect(motion).toHaveAttribute('data-active', 'true');
      await expect(motion.getByRole('button', { name: 'Keyframes', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect.poll(lastPatch).toMatchObject({ highlight: 'player', xray: false });
      await featureLink.click();
      await expectFeatureLanding(page);
      await expect(selector).toHaveValue('keyframes');
      await selector.selectOption('remix');
      await expect(panel.locator('pre')).toContainText('child: RemixCheckbox(');
      await panel.getByRole('link', { name: 'Try it in the showcase' }).click();
      const remix = page.locator('[data-chapter="remix"]');
      await expect(page).toHaveURL(/#v2-remix$/);
      await expect(remix).toHaveAttribute('data-active', 'true');
      await expect(remix.getByRole('heading')).toBeFocused();
      await expect.poll(lastPatch).toMatchObject({ highlight: 'today', xray: true, naked: false, phone: false });
      await remix.getByText('See the Dart', { exact: false }).click();
      await expect(remix.locator('pre')).toContainText('child: RemixCheckbox(');
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
      const chapters = width === 390 ? ['looks', 'states', 'motion', 'remix', 'naked', 'blocks'] : ['looks', 'states', 'adapt', 'motion', 'remix', 'naked', 'blocks'];
      for (const chapter of [...chapters, ...chapters.toReversed()]) {
        await page.locator(`.v2-step[data-step="${chapter}"]`).click();
        await expect(page.locator(`[data-chapter="${chapter}"]`)).toHaveAttribute('data-active', 'true');
        await expect(page).toHaveURL(new RegExp(`#v2-${chapter}$`));
      }
      await expectNoOverflow(page);
      expect(errors).toEqual([]);
    });
  }

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
