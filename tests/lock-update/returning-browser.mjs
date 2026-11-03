#!/usr/bin/env node
// Lock-update check (plan phase 2): a browser that visited build A returns
// after the lock moves to build B and must load only B's previews and a
// revalidated catalog, never a mix of the two.
//
// Usage: node tests/lock-update/returning-browser.mjs [chromium|webkit]
// Set PW_WS_ENDPOINT to drive a remote `playwright run-server` (for example
// WebKit in the official container); one context then shares the HTTP cache.
// Needs the locked archives in the cache. Rebuilds the site twice on port
// 3200 and restores sources.lock.json afterwards.
import { spawn, execFileSync } from 'node:child_process';
import { copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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
const env = { ...process.env, SITE_INPUTS_OFFLINE: '1', NEXT_TELEMETRY_DISABLED: '1' };
const log = message => console.log(`[lock-update] ${message}`);

function build() {
  execFileSync('pnpm', ['build'], { cwd: root, env, stdio: ['ignore', 'ignore', 'inherit'] });
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
  // Build A: the current lock.
  const lockA = JSON.parse(lockBackup);
  const baseA = base(lockA.inputs['mix-previews'].artifact.sha256);
  build();
  server = await serve();
  const remote = process.env.PW_WS_ENDPOINT ? await engine.connect(process.env.PW_WS_ENDPOINT) : null;
  const context = remote ? await remote.newContext() : await engine.launchPersistentContext(profile);
  let page = await context.newPage();
  const seenA = [];
  page.on('request', request => seenA.push(new URL(request.url()).pathname));
  await page.goto(`${origin}/mix/docs/guides/animations/`);
  await page.locator('[data-preview-id="guides/animations.0"] [role="application"][data-state="ready"]').waitFor({ timeout: 60_000 });
  await page.goto(`${origin}/remix/catalog/`);
  await page.locator('flutter-view, flt-glass-pane').first().waitFor({ state: 'attached', timeout: 60_000 });
  const versionA = await page.evaluate(async () => (await fetch('version.json')).text());
  check(previewRequests(seenA).every(url => url.startsWith(baseA)), `build A served previews only from ${baseA}`);

  // An open tab from build A stays open across the deploy.
  const openTab = await context.newPage();
  await openTab.goto(`${origin}/mix/docs/widgets/box/`);
  await openTab.locator('[data-preview-id="widgets/box.0"] [role="application"][data-state="ready"]').waitFor({ timeout: 60_000 });

  // Build B: a new Mix bundle and a changed catalog file, as a lock update would bring.
  stop(server);
  const digestB = await variant('mix-previews', 'bundle/lock-update-check.txt', 'build B\n');
  await variant('remix-docs', 'catalog/version.json', JSON.stringify({ app_name: 'demo', version: 'lock-update-check-B' }));
  const baseB = base(digestB);
  build();
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
    await page.locator(`[data-preview-id="guides/animations.${index}"] [role="application"][data-state="ready"]`).waitFor({ timeout: 60_000 });
  }
  const previews = previewRequests(seenB);
  check(previews.length > 0 && previews.every(url => url.startsWith(baseB)), `returning browser loaded previews only from ${baseB} (${previews.length} requests)`);
  check(!previews.some(url => url.startsWith(baseA)), `no request reached the retired build ${baseA}`);
  check(failed.length === 0, `no failed responses${failed.length ? `: ${failed.join(', ')}` : ''}`);
  await page.goto(`${origin}/remix/catalog/`);
  const versionB = await page.evaluate(async () => (await fetch('version.json')).text());
  check(versionB.includes('lock-update-check-B') && versionB !== versionA, 'catalog revalidated to build B (version.json)');

  // The tab left open during the deploy navigates client-side afterwards.
  const openFailed = [];
  openTab.on('response', response => { if (response.status() >= 400) openFailed.push(`${response.status()} ${new URL(response.url()).pathname}`); });
  await openTab.getByRole('button', { name: 'Guides', exact: true }).click();
  await openTab.getByRole('link', { name: 'Animations', exact: true }).first().click();
  await openTab.waitForURL(/\/guides\/animations\/$/);
  const states = await openTab.locator('[data-preview-id^="guides/animations."] [role="application"]').evaluateAll(
    hosts => hosts.map(host => host.getAttribute('data-state')),
  ).catch(() => []);
  await openTab.waitForTimeout(8_000);
  const settledStates = await openTab.locator('[data-preview-id^="guides/animations."] [role="application"]').evaluateAll(hosts => hosts.map(host => host.getAttribute('data-state')));
  log(`open tab after deploy: states ${JSON.stringify(settledStates)} (initially ${JSON.stringify(states)}); failed responses ${JSON.stringify(openFailed)}`);
  check(settledStates.length === 5 && settledStates.every(state => state === 'ready'), 'a tab open across the deploy still renders all previews after client-side navigation');
  await context.close();
  await remote?.close();
} finally {
  if (server) stop(server);
  await writeFile(p.lock, lockBackup);
  // Leave the workspace staged from the committed lock again.
  execFileSync('node', ['scripts/site-inputs/sync.mjs'], { cwd: root, env, stdio: 'ignore' });
  await rm(profile, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`[lock-update] ${failures.length} check(s) failed`);
  process.exit(1);
}
log('all checks passed');
