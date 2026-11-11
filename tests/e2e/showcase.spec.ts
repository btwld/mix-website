import { existsSync, readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const hasBundle = existsSync('public/v2-flutter/flutter_bootstrap.js');
const SOURCE = 'packages/mix_showcase/lib';
const EXAMPLES = ['button', 'style', 'tokens', 'states', 'responsive', 'motion', 'naked', 'remix'];

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

/** Every code block on the page as `{ file, lines: [number, text][] }`. */
async function shownCode(page: Page) {
  return page.locator('.v2-code figure').evaluateAll(figures => figures.map(figure => ({
    file: figure.querySelector('.v2-code-file a')!.textContent!.replace(/^lib\//, ''),
    label: figure.querySelector('.v2-code-file span')!.textContent!,
    lines: [...figure.querySelectorAll('.v2-line')].map(line => [
      line.querySelector('.v2-ln')!.textContent!,
      line.querySelector('.v2-lc')!.textContent!.replace(/\n$/, ''),
    ] as [string, string]),
  })));
}

/** Scrolls an example to the middle of the screen and waits for its view. */
async function open(page: Page, example: string) {
  const view = page.locator(`.v2-view[data-demo="${example}"]`);
  await view.evaluate(element => element.scrollIntoView({ block: 'center' }));
  await expect(view).toHaveAttribute('data-state', 'ready');
  return view;
}

test('the page reads in order without JavaScript, with its code', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Flutter design system');
  const headings = await page.locator('.v2 h2').allTextContents();
  expect(headings).toEqual(['Three layers. Use one, or all of them.', 'A style is a value.', 'The behavior of a control, with nothing drawn.', 'Components you install, compose and own.', 'Add one to your app.']);
  for (const id of ['mix', 'naked', 'remix', 'start', 'mix-style', 'mix-tokens', 'mix-states', 'mix-responsive', 'mix-motion']) await expect(page.locator(`#${id}`)).toHaveCount(1);
  expect(await page.locator('#mix .v2-exhibit').evaluateAll(exhibits => exhibits.map(exhibit => exhibit.id))).toEqual(['mix-style', 'mix-states', 'mix-responsive', 'mix-motion', 'mix-tokens']);
  await expect(page.locator('#hello .v2-code')).toContainText('final button = BoxStyler()');
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/#start');
  await context.close();
});

test('every code block is the source it names, line for line', async ({ page }) => {
  await page.goto('/');
  const blocks = await shownCode(page);
  // Then the other half of every Style / Widget pair.
  for (const tab of await page.locator('.v2-code-tabs label:not([data-checked="true"])').all()) await tab.click();
  blocks.push(...await shownCode(page));
  expect(blocks.length).toBeGreaterThanOrEqual(16);
  for (const block of blocks) {
    const source = readFileSync(`${SOURCE}/${block.file}`, 'utf8').replace(/\n$/, '').split('\n');
    const numbered = block.lines.filter(([number]) => number !== '⋯');
    // Excerpts drop their common indentation; a whole file drops none.
    const indent = Math.min(...numbered.filter(([, text]) => text.trim()).map(([number, text]) => source[Number(number) - 1].length - text.length));
    for (const [number, text] of numbered) {
      const original = source[Number(number) - 1];
      expect(text, `${block.file}:${number}`).toBe(original.trim() ? original.slice(indent) : '');
    }
    if (block.label.startsWith('complete file')) expect(numbered.length).toBe(source.filter(line => !/^\s*\/\/ #(end)?docregion\b/.test(line)).length);
    else expect(block.label).toMatch(/^excerpt · lines? [\d–, ]+ of \d+$/);
    expect(block.label).toContain(String(source.length));
  }
});

test('an excerpt links to its exact lines in the complete file', async ({ page }) => {
  await page.goto('/');
  const link = page.locator('#mix-tokens .v2-code-file a').first();
  const href = await link.getAttribute('href');
  expect(href).toMatch(/^\/v2\/source\/\?file=theme\.dart#L\d+-L\d+$/);
  const [, start, end] = /#L(\d+)-L(\d+)$/.exec(href!)!;
  await link.click();
  await expect(page.locator('#v2-source-file')).toHaveValue('theme.dart');
  await expect(page.locator('.v2-source-highlight')).toHaveCount(Number(end) - Number(start) + 1);
  await expect(page.locator(`#L${start}`)).toHaveClass(/v2-source-highlight/);
});

test('controls change the code they point at, with or without Flutter', async ({ page }) => {
  await page.route('**/v2-flutter/**', route => route.abort());
  await page.goto('/');

  // Tokens: step 2 follows the chosen theme; the other steps stay as they are.
  const tokens = page.locator('#mix-tokens');
  await expect(tokens.locator('figure').nth(1)).toContainText('final midnight = ThemeValues(');
  await tokens.locator('.v2-preview-controls').getByText('Paper', { exact: true }).click();
  await expect(tokens.locator('figure').nth(1)).toContainText('final paper = ThemeValues(');
  await expect(tokens.locator('figure').nth(1).locator('strong')).toHaveText('2. Give them values: Paper');
  await expect(tokens.locator('figure').first()).toContainText("const $primary = ColorToken('primary');");

  // States: the disabled toggle marks the lines that handle it.
  const states = page.locator('#mix-states');
  await expect(states.locator('.v2-line[data-on]')).toHaveCount(0);
  await states.getByText('Disabled', { exact: true }).click();
  // The style and the widget are two files, open as editor tabs. A tab whose
  // hidden lines are lit carries a dot.
  const codeTabs = states.locator('.v2-code-tabs label');
  await expect(codeTabs).toHaveText(['style.dart', 'action_button.dart, has highlighted lines']);
  await expect(states.locator('.v2-line[data-on]')).toContainText(['.onDisabled(.color(night))', '.onDisabled(.color(grey));']);
  await codeTabs.nth(1).click();
  await expect(states.locator('.v2-line[data-on]')).toContainText(['enabled: onPress != null,']);
  await expect(states.locator('.v2-code')).toContainText('class ActionButton extends StatelessWidget');
  await expect(states.locator('.v2-code-file a')).toHaveText('lib/demos/action_button/action_button.dart');
  await expect(codeTabs.first()).toHaveText('style.dart, has highlighted lines');
  await codeTabs.first().click();

  // Breakpoints: the marks are on only while the width is compact.
  const responsive = page.locator('#mix-responsive');
  await expect(responsive.locator('.v2-readout')).toHaveText('600 px · wide');
  await expect(responsive.locator('.v2-line[data-on]')).toHaveCount(0);
  await responsive.getByRole('button', { name: '360 px' }).click();
  await expect(responsive.locator('.v2-readout')).toHaveText('360 px · compact');
  await expect(responsive.locator('.v2-line[data-on] .v2-lc')).toHaveText(['.onBreakpoint(', 'compact,', '.equalColumns(1)', '.gap(8),', ');']);

  // Motion: each kind shows its own source; the config choice moves the mark.
  const motion = page.locator('#mix-motion');
  await expect(motion.locator('.v2-line[data-on]')).toContainText(['.animate(motion);', 'final spring = AnimationConfig.spring(']);
  await motion.getByText('Bouncy spring', { exact: true }).click();
  await expect(motion.locator('.v2-line[data-on]')).toContainText(['.animate(motion);', 'final bouncy = AnimationConfig.spring(']);
  await motion.getByText('Keyframes', { exact: true }).click();
  await expect(motion.locator('.v2-code')).toContainText("KeyframeTrack<double>('angle'");

  // Naked UI: the behavior stays, the drawing swaps.
  const naked = page.locator('#naked');
  // One behavior and its two drawings are three files; the view shows both drawings.
  const nakedTabs = naked.locator('.v2-code-tabs label');
  await expect(nakedTabs).toHaveText(['plan_picker.dart', 'plan_row.dart, has highlighted lines', 'plan_segment.dart, has highlighted lines']);
  await expect(naked.locator('.v2-code')).toContainText('return NakedRadioGroup<String>(');
  await nakedTabs.nth(2).click();
  await expect(naked.locator('.v2-code')).toContainText('Widget planSegment(');
  await naked.locator('.v2-bench-main').getByText('Select', { exact: true }).click();
  await expect(nakedTabs).toHaveText(['billing_select.dart', 'style.dart, has highlighted lines']);
  await expect(naked.locator('.v2-code')).toContainText('return NakedSelect<String>(');

  // Remix: install, compose, then one installed recipe. The composed form is shown first.
  const remix = page.locator('#remix');
  const tabs = remix.locator('.v2-bench-main .v2-segmented label');
  await expect(tabs).toHaveText(['Install', 'Compose', 'A recipe’s source']);
  await expect(remix.locator('.v2-bench-main .v2-segmented label[data-checked="true"]')).toHaveText('Compose');
  await expect(remix.locator('.v2-code-tabs label')).toHaveText(['checkout.dart', 'style.dart']);
  await expect(remix.locator('.v2-code-file')).toContainText('lib/demos/checkout/checkout.dart');
  await expect(remix.locator('.v2-code-file')).toContainText('complete file');
  await expect(remix.locator('.v2-code')).toContainText("import '../../ui/ui.dart';");
  await expect(remix.locator('.v2-code')).toContainText('UiButton.ghost(');
  await remix.getByText('A recipe’s source', { exact: true }).click();
  await expect(remix.locator('.v2-code')).toContainText('@MixWidget(target: RemixCard.new)');
  await expect(remix.locator('.v2-code-file a')).toHaveText('lib/ui/components/card.dart');
  await expect(remix.locator('.v2-bench-main .v2-control-note')).toContainText('@MixWidget generates the UiCard widget from this function.');
  await expect(remix.locator('.v2-bench-main .v2-control-note a')).toHaveAttribute('href', '#mix-tokens');
  await remix.getByText('Install', { exact: true }).click();
  await expect(remix.locator('.v2-steps h4')).toHaveText(['Install the CLI once', 'Set up the project', 'Add the components you need', 'Place the theme once, below your app host']);
  // The CLI is installed once, globally, so every command is plain `remix`.
  await expect(remix.locator('.lx-terminal-cmd')).toHaveText(['dart pub global activate remix_cli "^1.0.0-beta.1"', 'remix init', 'remix add card button switch slider checkbox badge']);
  await expect(remix.locator('.v2-snippet')).toContainText('builder: (context, _) => const UiTheme(child: HomeScreen()),');
});

test('a failed Flutter load says so and leaves the code readable', async ({ page }) => {
  await page.route('**/v2-flutter/**', route => route.abort());
  await page.goto('/');
  const view = page.locator('.v2-view[data-demo="button"]');
  await expect(view).toHaveAttribute('data-state', 'failed');
  await expect(view.getByRole('status')).toContainText('The live example didn’t load.');
  await expect(view.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(page.locator('#hello .v2-code')).toContainText('final button = BoxStyler()');
});

test('each library installs from a prerelease-safe command with a complete starter', async ({ page }) => {
  await page.goto('/#start');
  const start = page.locator('#start');
  const expected = [
    ['mix', 'flutter pub add mix', 'lib/starters/mix.dart', "import 'package:mix/mix.dart';"],
    ['naked', 'flutter pub add "naked_ui:^2.0.0-0"', 'lib/starters/naked_ui.dart', "import 'package:naked_ui/naked_ui.dart';"],
    ['remix', 'dart pub global activate remix_cli "^1.0.0-beta.1"', 'lib/remix_starter.dart', "import 'ui/ui.dart';"],
  ];
  for (const [tone, command, file, line] of expected) {
    // The radio itself is visually hidden; its label is what a reader clicks.
    await start.locator(`.v2-start-pick label[data-tone="${tone}"]`).click();
    await expect(start.locator('.lx-terminal-cmd').first()).toHaveText(command);
    await expect(start.locator('.v2-code-file')).toContainText(file);
    await expect(start.locator('.v2-code-file')).toContainText('complete file');
    await expect(start.locator('.v2-code')).toContainText(line);
    await expect(start.locator('.v2-code')).toContainText('void main() => runApp(const App());');
  }
  await expect(start).toContainText('Needs Flutter 3.47.9+ · Dart 3.13+');
  // Remix installs its CLI once, then one component before the starter uses it.
  // `remix add` brings in the remix package itself.
  await expect(start.locator('.v2-start-steps > li').first().locator('h3')).toHaveText('Install the CLI, then a component');
  await expect(start.locator('.lx-terminal-cmd')).toHaveText(['dart pub global activate remix_cli "^1.0.0-beta.1"', 'remix init', 'remix add button', 'flutter run']);
  // Arrow keys move through the three choices like any radio group.
  await start.locator('label[data-tone="mix"] input').focus();
  await page.keyboard.press('ArrowDown');
  await expect(start.locator('label[data-tone="naked"] input')).toBeChecked();
  await expect(start.locator('.lx-terminal-cmd').first()).toHaveText('flutter pub add "naked_ui:^2.0.0-0"');
});

test('documentation links from the page resolve, including their sections', async ({ page, request }) => {
  await page.goto('/');
  // Links that depend on a selection are collected in each of their states.
  await page.locator('#naked .v2-bench-main').getByText('Select', { exact: true }).click();
  await page.locator('#start label[data-tone="remix"]').click();
  const links = new Set(await page.locator('.v2 a[href*="/docs/"]').evaluateAll(anchors => anchors.map(anchor => anchor.getAttribute('href')!)));
  expect(links.size).toBeGreaterThan(25);
  for (const href of links) {
    const [path, hash] = href.split('#');
    const response = await request.get(path);
    expect(response.status(), href).toBe(200);
    if (hash) expect(await response.text(), href).toContain(`id="${hash}"`);
  }
});

for (const width of [320, 390, 820, 1440]) {
  test(`the page fits a ${width}px screen`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route('**/v2-flutter/**', route => route.abort());
    await page.goto('/');
    await expectNoOverflow(page);
    // Where the example and its code cannot sit side by side, they share a tab
    // bar that opens on the example; the files are the other tabs.
    const bench = page.locator('#mix-states .v2-bench');
    if (width < 1024) {
      await expect(bench.locator('.v2-bench-tabs label')).toHaveText(['Preview', 'style.dart', 'action_button.dart']);
      await expect(bench.locator('.v2-preview')).toBeVisible();
      await expect(bench.locator('.v2-code')).toBeHidden();
      await bench.locator('.v2-bench-tabs label', { hasText: 'action_button.dart' }).click();
      await expect(bench.locator('.v2-preview')).toBeHidden();
      await expect(bench.locator('.v2-code')).toContainText('class ActionButton');
    } else {
      await expect(bench.locator('.v2-bench-tabs')).toBeHidden();
      await expect(bench.locator('.v2-preview')).toBeVisible();
      await expect(bench.locator('.v2-code')).toBeVisible();
    }
    for (const section of ['#remix', '#start']) {
      await page.locator(section).scrollIntoViewIfNeeded();
      await expectNoOverflow(page);
    }
  });
}

test('a phone shows the lines a long listing points at', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/v2-flutter/**', route => route.abort());
  await page.goto('/');
  // The Remix form is the longest listing; its highlighted lines run to the end.
  // On a phone the example opens first; its files are the other tabs.
  await expect(page.locator('#remix .v2-bench-tabs label').first()).toHaveText('Preview');
  await page.locator('#remix .v2-bench-tabs label', { hasText: 'checkout.dart' }).click();
  const figure = page.locator('#remix .v2-code figure');
  const lit = figure.locator('.v2-line[data-on]');
  expect(await lit.count()).toBeGreaterThan(5);
  for (const line of await lit.all()) await expect(line).toBeVisible();
  // Wrapped lines stay inside the block instead of scrolling it sideways.
  expect(await figure.locator('pre').evaluate(pre => pre.scrollWidth <= pre.clientWidth + 1)).toBe(true);
});

test('source files have shareable selections and history', async ({ page }) => {
  await page.goto('/v2/source/?file=demos/plan_picker/plan_picker.dart');
  await expect(page.locator('#v2-source-file')).toHaveValue('demos/plan_picker/plan_picker.dart');
  await expect(page.locator('.v2-source-code')).toContainText('NakedRadioGroup<String>(');
  // Line numbers sit in their own gutter, clear of the code.
  expect(await page.locator('.v2-source-code .line').first().evaluate(line => parseFloat(getComputedStyle(line).paddingLeft))).toBeGreaterThan(30);
  await page.locator('#v2-source-file').selectOption('theme.dart');
  await expect(page).toHaveURL(/\?file=theme\.dart$/);
  await expect(page.locator('.v2-source-code')).toContainText("const $primary = ColorToken('primary');");
  await page.goBack();
  await expect(page.locator('#v2-source-file')).toHaveValue('demos/plan_picker/plan_picker.dart');
  // Installed recipes and the starters are part of the same list.
  const options = await page.locator('#v2-source-file option').allTextContents();
  expect(options).toEqual(expect.arrayContaining(['lib/starters/mix.dart', 'lib/ui/components/button.dart', 'lib/host/demos.dart', 'pubspec.yaml', 'remix.yaml']));
  await expect(page.locator('.v2-source-setup')).toContainText('flutter run -d chrome -t lib/starters/mix.dart');
});

test.describe('live examples', () => {
  test.skip(!hasBundle, 'Build packages/mix_showcase into public/v2-flutter to exercise the live examples.');

  test('a few views serve every example, and none is ever blank or lost', async ({ page }) => {
    const problems: string[] = [];
    // A lost or refused WebGL context is how a view goes blank.
    page.on('console', message => { if (message.type() === 'error' || /too many active webgl|context (was )?lost/i.test(message.text())) problems.push(message.text()); });
    page.on('pageerror', error => problems.push(String(error)));
    await page.goto('/');
    for (const example of [...EXAMPLES, ...[...EXAMPLES].reverse()]) {
      const view = await open(page, example);
      // The view is in place, visible, and the size of every other view.
      await expect(view.locator('flutter-view')).toBeVisible();
      expect(await page.locator('flutter-view').count()).toBeLessThanOrEqual(4);
    }
    const sizes = await page.locator('.v2-view-canvas').evaluateAll(views => views.map(view => `${view.clientWidth}x${view.clientHeight}`));
    expect(new Set(sizes).size).toBe(1);
    expect(problems, problems.join('\n').slice(0, 2000)).toEqual([]);
  });

  test('a view that appears does not take keyboard focus', async ({ page }) => {
    await page.goto('/');
    await open(page, 'button');
    await open(page, 'tokens');
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('BODY');
  });

  test('hovering and pressing the first button marks the lines that handle it', async ({ page }) => {
    await page.goto('/');
    const view = await open(page, 'button');
    const box = (await view.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.locator('#hello .v2-line[data-on] .v2-lc')).toHaveText(['.onHovered(.color(purpleLight))']);
    await page.mouse.down();
    await expect(page.locator('#hello .v2-line[data-on]')).toContainText(['.onHovered(.color(purpleLight))', '.onPressed(.scale(0.96))']);
    await page.mouse.up();
    await page.mouse.move(2, 2);
    await expect(page.locator('#hello .v2-line[data-on]', { hasText: '.onHovered(' })).toHaveCount(0);
  });

  test('the theme reaches the tokens example and no other', async ({ page }) => {
    await page.goto('/');
    const view = await open(page, 'tokens');
    const before = await view.screenshot();
    await page.locator('#mix-tokens .v2-preview-controls').getByText('Pop', { exact: true }).click();
    await expect.poll(async () => (await view.screenshot()).equals(before)).toBe(false);
    await expect(page.locator('#mix-tokens figure').nth(1)).toContainText('final pop = ThemeValues(');
    await expect(view).toHaveCSS('background-color', 'rgb(255, 216, 61)');
    // Every other example keeps its own canvas, and offers no theme to pick.
    const other = await open(page, 'states');
    await expect(other).toHaveCSS('background-color', 'rgb(13, 11, 20)');
    await expect(page.locator('#mix-states .v2-themes')).toHaveCount(0);
  });

  test('a choice made inside Flutter updates the page control', async ({ page }) => {
    await page.goto('/');
    const view = await open(page, 'style');
    const checked = page.locator('#mix-style .v2-segmented label[data-checked="true"]');
    await expect(checked).toHaveText('Pro');
    const box = (await view.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2 - 100, box.y + box.height / 2);
    await expect(checked).toHaveText('Starter');
  });

  for (const featured of ['Pro', 'Starter']) {
    test(`page-selected featured ${featured} survives returning from the source`, async ({ page }) => {
      await page.goto('/');
      const view = await open(page, 'style');
      const style = page.locator('#mix-style');
      const controls = style.locator('.v2-preview-controls .v2-segmented');
      const checked = controls.locator('label[data-checked="true"]');
      const fromFlutter = featured === 'Pro' ? 'Starter' : 'Pro';
      const box = (await view.boundingBox())!;
      await page.mouse.click(box.x + box.width / 2 + (fromFlutter === 'Starter' ? -100 : 100), box.y + box.height / 2);
      await expect(checked).toHaveText(fromFlutter);
      await controls.getByText(featured, { exact: true }).click();
      await expect(checked).toHaveText(featured);

      await style.locator('.v2-code-file a').click();
      await expect(page).toHaveURL(/\/v2\/source\//);
      await page.goBack();
      await open(page, 'style');
      await expect(checked).toHaveText(featured);
    });
  }

  test('a held state is reported back by Flutter', async ({ page }) => {
    await page.goto('/');
    await open(page, 'states');
    const states = page.locator('#mix-states');
    await states.getByRole('button', { name: 'Hovered' }).click();
    await expect(states.getByRole('button', { name: 'Hovered' })).toHaveAttribute('data-live', 'true');
    await expect(states.locator('.v2-line[data-on] .v2-lc')).toHaveText(['.onHovered(.color(graphite))']);
    await states.getByRole('button', { name: 'Hovered' }).click();
    await expect(states.locator('.v2-line[data-on]')).toHaveCount(0);
  });

  test('the keyboard enters a view, operates it, and leaves', async ({ page }) => {
    await page.goto('/');
    await open(page, 'naked');
    const naked = page.locator('#naked');
    const note = naked.locator('.v2-control-note');
    await expect(note).toContainText('Pro');
    await naked.locator('.v2-code pre').last().focus();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('FLUTTER-VIEW');
    await page.keyboard.press('ArrowDown');
    await expect(note).toContainText('Team');
    // The view holds both drawings: Tab moves to the second group, then out.
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('FLUTTER-VIEW');
    await page.keyboard.press('Tab');
    // Flutter hands focus back asynchronously. The next page control depends
    // on the browser's tabbing rules, but focus must leave the view and body.
    await expect.poll(() => page.evaluate(() => document.activeElement?.closest('.v2-view') === null && document.activeElement !== document.body)).toBe(true);

    // The select opens, moves and chooses from the keyboard, and Escape cancels.
    await naked.locator('.v2-bench-main').getByText('Select', { exact: true }).click();
    await expect(note).toContainText('Monthly');
    await naked.locator('.v2-code pre').last().focus();
    await page.keyboard.press('Tab');
    // Opening moves focus into the menu over a frame or two; a person never
    // types faster than that, so the test waits as long before moving.
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(note).toContainText('Yearly');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Escape');
    await expect(note).toContainText('Yearly');
  });

  test('Naked UI selections are reported after returning from the source', async ({ page }) => {
    await page.goto('/');
    await open(page, 'naked');
    const naked = page.locator('#naked');
    const note = naked.locator('.v2-control-note');
    const select = () => naked.locator('.v2-bench-main').getByText('Select', { exact: true }).click();
    const visitSource = async () => {
      await naked.locator('.v2-code-file a').first().click();
      await expect(page).toHaveURL(/\/v2\/source\//);
      await page.goBack();
      await open(page, 'naked');
    };

    await naked.locator('.v2-code pre').last().focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await expect(note).toContainText('Team');
    await visitSource();
    await expect(note).toContainText('Team');

    await select();
    await naked.locator('.v2-code pre').last().focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(note).toContainText('Yearly');
    await visitSource();
    await select();
    await expect(note).toContainText('Yearly');
  });

  test('leaving for the source and coming back keeps the examples running', async ({ page }) => {
    await page.goto('/');
    await open(page, 'button');
    await page.locator('#hello .v2-code-file a').click();
    await expect(page).toHaveURL(/\/v2\/source\/\?file=demos\/upgrade_button\/style\.dart/);
    await page.goBack();
    await open(page, 'button');
    await open(page, 'style');
    expect(await page.locator('flutter-view').count()).toBeLessThanOrEqual(4);
  });

  test('docs previews start after arriving from the examples', async ({ page }) => {
    await page.goto('/');
    await open(page, 'button');
    await page.locator('#mix-style').getByRole('link', { name: /Composition in the styling guide/ }).click();
    await expect(page).toHaveURL(/\/mix\/docs\/guides\/styling\//);
    await expect(page.locator('flutter-view').first()).toBeVisible();
  });
});
