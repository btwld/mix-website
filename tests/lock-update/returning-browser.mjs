#!/usr/bin/env node
// Lock-update check (plan phase 2): a browser that visited build A returns
// after the lock moves to a genuinely recompiled build B. An open tab can
// remain coherently on A; requesting B must reload before its data meets A's
// engine. Fresh navigation must use only B and revalidate the catalog.
//
// Usage: node tests/lock-update/returning-browser.mjs [chromium|webkit]
// Set PW_WS_ENDPOINT to drive a remote `playwright run-server` (for example
// WebKit in the official container); one context then shares the HTTP cache.
// Needs the locked archives in the cache. Rebuilds the site twice on port
// 3200, then restores sources.lock.json and rebuilds from it.
import { execFileSync, spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium, webkit } from '@playwright/test';
import { paths } from '../../scripts/site-inputs/sync-lib.mjs';
import { packDirectory, readArchive, sha256, writeEntries } from '../../scripts/site-inputs/tar.mjs';

const engine = { chromium, webkit }[process.argv[2] ?? 'chromium'];
const root = process.cwd();
const p = paths(root);
const PORT = 3200;
const origin = `http://localhost:${PORT}`;
const lockBackup = await readFile(p.lock, 'utf8');
const examplePath = 'packages/mix_docs_preview/lib/widgets/box/simple_box.dart';
const exampleBackup = await readFile(examplePath, 'utf8');
const marker = 'Hello Mix B';
const env = { ...process.env, SITE_INPUTS_OFFLINE: '1', NEXT_TELEMETRY_DISABLED: '1' };
const log = message => console.log(`[lock-update] ${message}`);

async function build() {
  await new Promise((resolve, reject) => {
    const process = spawn('pnpm', ['build'], { cwd: root, env, stdio: 'inherit' });
    process.once('error', reject);
    process.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`Build failed: ${signal ?? code}`)));
  });
}

async function serve() {
  const server = spawn('pnpm', ['start', '-p', String(PORT)], { cwd: root, env, detached: true, stdio: 'ignore' });
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(`${origin}/`)).ok) return server; } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('server did not start');
}
const stop = server => { try { process.kill(-server.pid); } catch {} };

async function compiledVariant() {
  const changed = exampleBackup.replace("'Hello Mix'", `'${marker}'`);
  if (changed === exampleBackup) throw new Error('Expected Box label is missing');
  let archive;
  if (process.env.LOCK_UPDATE_MIX_VARIANT) {
    // Local reruns may reuse a real compiled fixture. All byte, behavior/source
    // and full-input fingerprint checks below still apply. CI always compiles.
    archive = await readFile(process.env.LOCK_UPDATE_MIX_VARIANT);
  } else {
    const fixture = await mkdtemp(path.join(tmpdir(), 'mix-compiled-b-'));
    try {
      execFileSync('git', ['worktree', 'add', '--detach', fixture, 'HEAD'], { stdio: 'pipe' });
      await writeFile(path.join(fixture, examplePath), changed);
      execFileSync('git', ['-C', fixture, 'add', examplePath]);
      execFileSync('git', ['-C', fixture, '-c', 'user.name=Preview Verification', '-c', 'user.email=preview@example.invalid', 'commit', '-qm', 'test: distinct compiled Box behavior']);
      const sha = execFileSync('git', ['-C', fixture, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
      await new Promise((resolve, reject) => {
        const child = spawn('bash', ['scripts/site-inputs/produce/mix-previews.sh', fixture, sha, path.join(fixture, 'artifacts')], { cwd: root, env, stdio: 'inherit' });
        child.once('error', reject);
        child.once('exit', code => code === 0 ? resolve() : reject(new Error(`Compiled B producer failed: ${code}`)));
      });
      archive = await readFile(path.join(fixture, `artifacts/mix-previews-${sha.slice(0,12)}.tar.gz`));
    } finally {
      execFileSync('git', ['worktree', 'remove', '--force', fixture], { stdio: 'pipe' });
    }
  }
  const entries = readArchive(archive);
  const metadata = JSON.parse(entries.find(e => e.path === 'site-input.json').data);
  const original = readArchive(await readFile(path.join(p.cache, `${JSON.parse(lockBackup).inputs['mix-previews'].artifact.sha256}.tar.gz`)));
  const wasm = entries.find(e => e.path === 'bundle/main.dart.wasm').data;
  check(!wasm.equals(original.find(e => e.path === 'bundle/main.dart.wasm').data), 'B has genuinely different compiled WASM');
  check(wasm.includes(Buffer.from(marker)), 'B compiled WASM contains its changed visible label');
  check(entries.find(e => e.path === 'bundle/sources/'+examplePath).data.includes(Buffer.from(marker)), 'B matching snippet contains its changed label');
  const digest = sha256(archive);
  await writeFile(path.join(p.cache, `${digest}.tar.gz`), archive);
  const lock = JSON.parse(await readFile(p.lock, 'utf8'));
  lock.inputs['mix-previews'] = { source: { repository: metadata.source.repository, commit: metadata.source.commit }, producer: metadata.producer, toolchain: metadata.toolchain, artifact: { ...lock.inputs['mix-previews'].artifact, sha256: digest, size: archive.length } };
  await writeFile(p.lock, JSON.stringify(lock, null, 2)+'\n');
  // The consumer checks the full canonical authoring tree, including this edit.
  await writeFile(examplePath, changed);
  return digest;
}

async function boxEvidence(page, expectedBase, label) {
  const wrapper = page.locator('[data-testid="flutter-preview"][data-preview-id="widgets/box.0"]');
  const host = wrapper.locator('[role="application"]');
  await host.scrollIntoViewIfNeeded();
  await host.locator('flutter-view').waitFor({ timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('[data-preview-id="widgets/box.0"] [data-state="ready"]'));
  await wrapper.locator('summary').click();
  await wrapper.locator('pre').waitFor({ timeout: 60_000 });
  check((await wrapper.locator('pre').innerText()).includes(label), `displayed source belongs to ${label}`);
  const identity = await page.evaluate(() => window.__MIX_FLUTTER_BUNDLE__);
  check(new URL(identity).pathname === expectedBase, `page engine identity is ${expectedBase}`);
  await host.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  return host.screenshot();
}

/** Rebuild an archive with one file changed, keeping its source metadata. */
async function variant(name, file, content) {
  const lock = JSON.parse(await readFile(p.lock, 'utf8'));
  const entries = readArchive(await readFile(path.join(p.cache, `${lock.inputs[name].artifact.sha256}.tar.gz`)));
  const dir = await mkdtemp(path.join(tmpdir(), `${name}-b-`));
  await writeEntries(entries.filter(entry => entry.path !== file), dir);
  await writeFile(path.join(dir, file), content);
  const { archive } = await packDirectory(dir);
  const digest = sha256(archive);
  await writeFile(path.join(p.cache, `${digest}.tar.gz`), archive);
  lock.inputs[name].artifact = { ...lock.inputs[name].artifact, sha256: digest, size: archive.length };
  await writeFile(p.lock, JSON.stringify(lock, null, 2) + '\n');
  await rm(dir, { recursive: true });
  return digest;
}

const previewRequests = requests => requests.filter(url => /\/previews\/mix\//.test(url));
const base = digest => `/previews/mix/${digest.slice(0, 16)}/`;
let server;
const profile = await mkdtemp(path.join(tmpdir(), 'returning-browser-'));
const failures = [];
const check = (ok, message) => { log(`${ok ? 'PASS' : 'FAIL'} ${message}`); if (!ok) failures.push(message); };

try {
  log(`test source sha256 ${sha256(await readFile(new URL(import.meta.url)))}`);
  log('build A from the current lock');
  // Build A: the current lock.
  const lockA = JSON.parse(lockBackup);
  const baseA = base(lockA.inputs['mix-previews'].artifact.sha256);
  await build();
  server = await serve();
  const remote = process.env.PW_WS_ENDPOINT ? await engine.connect(process.env.PW_WS_ENDPOINT) : null;
  const context = remote ? await remote.newContext() : await engine.launchPersistentContext(profile);
  let page = await context.newPage();
  const seenA = [];
  page.on('request', request => seenA.push(new URL(request.url()).pathname));
  await page.goto(`${origin}/mix/docs/guides/animations/`);
  await page.locator('[data-testid="flutter-preview"][data-preview-id="guides/animations.0"]').scrollIntoViewIfNeeded();
  await page.locator('[data-preview-id="guides/animations.0"] [role="application"][data-state="ready"]').waitFor({ timeout: 60_000 });
  await page.goto(`${origin}/remix/catalog/`);
  await page.locator('flutter-view, flt-glass-pane').first().waitFor({ state: 'attached', timeout: 60_000 });
  const versionA = await page.evaluate(async () => (await fetch('version.json')).text());
  check(previewRequests(seenA).every(url => url.startsWith(baseA)), `build A served previews only from ${baseA}`);

  // An open tab from build A stays open across the deploy.
  const openTab = await context.newPage();
  await openTab.goto(`${origin}/mix/docs/widgets/box/`);
  await openTab.locator('[data-testid="flutter-preview"][data-preview-id="widgets/box.0"]').scrollIntoViewIfNeeded();
  await openTab.locator('[data-preview-id="widgets/box.0"] [role="application"][data-state="ready"]').waitFor({ timeout: 60_000 });
  const screenshotA = await boxEvidence(openTab, baseA, 'Hello Mix');
  await mkdir('test-results/lock-update', { recursive: true });
  await writeFile('test-results/lock-update/compiled-A.png', screenshotA);
  await openTab.evaluate(() => { window.__retainedBuildA = true; });

  // Build B: a new Mix bundle and a changed catalog file, as a lock update would bring.
  log('build B with distinct preview/catalog digests');
  stop(server);
  const digestB = await compiledVariant();
  await variant('remix-docs', 'catalog/version.json', JSON.stringify({ app_name: 'demo', version: 'lock-update-check-B' }));
  const baseB = base(digestB);
  await build();
  server = await serve();

  // Returning browser: same profile and HTTP cache, fresh navigation.
  await page.close();
  page = await context.newPage();
  const seenB = [];
  const failed = [];
  page.on('request', request => seenB.push(new URL(request.url()).pathname));
  page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${new URL(response.url()).pathname}`); });
  await page.goto(`${origin}/mix/docs/guides/animations/`);
  for (const index of [0, 1, 2, 3, 4]) {
    await page.locator(`[data-testid="flutter-preview"][data-preview-id="guides/animations.${index}"]`).scrollIntoViewIfNeeded();
    await page.locator(`[data-preview-id="guides/animations.${index}"] [role="application"][data-state="ready"]`).waitFor({ timeout: 60_000 });
  }
  const previews = previewRequests(seenB);
  check(previews.length > 0 && previews.every(url => url.startsWith(baseB)), `returning browser loaded previews only from ${baseB} (${previews.length} requests)`);
  check(!previews.some(url => url.startsWith(baseA)), `no request reached the retired build ${baseA}`);
  check(failed.length === 0, `no failed responses${failed.length ? `: ${failed.join(', ')}` : ''}`);
  await page.goto(`${origin}/mix/docs/widgets/box/`);
  const screenshotB = await boxEvidence(page, baseB, marker);
  await writeFile('test-results/lock-update/compiled-B.png', screenshotB);
  check(!screenshotB.equals(screenshotA), 'fresh B visibly renders different compiled Box behavior');
  await page.goto(`${origin}/remix/catalog/`);
  const versionB = await page.evaluate(async () => (await fetch('version.json')).text());
  check(versionB.includes('lock-update-check-B') && versionB !== versionA, 'catalog revalidated to build B (version.json)');

  const retainedA = await openTab.evaluate(() => ({ retained: !!window.__retainedBuildA, identity: window.__MIX_FLUTTER_BUNDLE__, source: document.querySelector('[data-preview-id="widgets/box.0"] pre')?.textContent }));
  log(`retained-tab before navigation: ${JSON.stringify({ retained: retainedA.retained, identity: retainedA.identity, label: retainedA.source?.includes(marker) ? marker : 'Hello Mix' })}`);
  check(retainedA.retained && new URL(retainedA.identity).pathname === baseA && retainedA.source.includes("'Hello Mix'") && !retainedA.source.includes(marker), 'retained tab remains coherently A before requesting B');

  // The tab left open during the deploy navigates client-side afterwards.
  const openFailed = [];
  openTab.on('response', response => { if (response.status() >= 400) openFailed.push(`${response.status()} ${new URL(response.url()).pathname}`); });
  await openTab.getByRole('button', { name: 'Guides', exact: true }).click();
  await openTab.getByRole('link', { name: 'Animations', exact: true }).first().click();
  await openTab.waitForURL(/\/guides\/animations\/$/);
  for (const index of [0, 1, 2, 3, 4]) {
    await openTab.locator(`[data-testid="flutter-preview"][data-preview-id="guides/animations.${index}"]`).scrollIntoViewIfNeeded();
    await openTab.locator(`[data-preview-id="guides/animations.${index}"] [role="application"][data-state="ready"]`).waitFor({ timeout: 60_000 });
  }
  const states = await openTab.locator('[data-preview-id^="guides/animations."] [role="application"]').evaluateAll(
    hosts => hosts.map(host => host.getAttribute('data-state')),
  ).catch(() => []);
  await openTab.waitForTimeout(8_000);
  const settledStates = await openTab.locator('[data-preview-id^="guides/animations."] [role="application"]').evaluateAll(hosts => hosts.map(host => host.getAttribute('data-state')));
  log(`open tab after deploy: states ${JSON.stringify(settledStates)} (initially ${JSON.stringify(states)}); failed responses ${JSON.stringify(openFailed)}`);
  check(settledStates.length === 5 && settledStates.every(state => state === 'ready'), 'a tab open across the deploy still renders all previews after client-side navigation');
  check(openFailed.length === 0, 'the tab open across the deploy has no failed asset or snippet responses');
  // Any route requesting B must reload the page-global A engine first.
  const retained = await openTab.evaluate(() => ({ retained: !!window.__retainedBuildA, identity: window.__MIX_FLUTTER_BUNDLE__ }));
  log(`retained-tab identity after navigation: ${JSON.stringify(retained)}`);
  check(new URL(retained.identity).pathname === baseB && !retained.retained, 'requesting B replaced retained A with a deliberate full-page reload');
  await openTab.goto(`${origin}/mix/docs/widgets/box/`);
  await boxEvidence(openTab, baseB, marker);
  await context.close();
  await remote?.close();
} finally {
  if (server) stop(server);
  await writeFile(p.lock, lockBackup);
  await writeFile(examplePath, exampleBackup);
  log('restore the original lock and build');
  // Leave the workspace built from the original lock again.
  await build();
  await rm(profile, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`[lock-update] ${failures.length} check(s) failed`);
  process.exit(1);
}
log('all checks passed');
