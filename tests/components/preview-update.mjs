#!/usr/bin/env node
// Exercise the actual React component/effects in an intercepted browser fixture.
// No product test route, new framework, source/lock mutation or Flutter rebuild.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { readArchive } from '../../scripts/site-inputs/tar.mjs';
const require = createRequire(import.meta.resolve('fumadocs-mdx'));
const { build } = await import(pathToFileURL(require.resolve('esbuild')).href);
const root = process.cwd();
const lock = JSON.parse(await readFile('sources.lock.json', 'utf8'));
const digest = lock.inputs['mix-previews'].artifact.sha256;
const files = new Map(readArchive(await readFile(`.site-inputs/cache/${digest}.tar.gz`)).map(e => [e.path, e.data]));
const manifest = JSON.parse(files.get('bundle/previews-manifest.json'));
const ids = ['widgets/box.0', 'guides/animations.0'];
for (const id of ids) assert.ok(manifest.entries.some(e => e.previewId === id));
await mkdir('test-results', { recursive: true });
const temporary = await mkdtemp(path.join(root, 'test-results/preview-update-'));
const origin = 'http://preview-update.test';
let browser;
try {
  await build({
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {flushSync} from 'react-dom'; import {FlutterPreview} from './components/previews/mix/FlutterPreview'; const root=createRoot(document.getElementById('root')); window.fixtureRender=props=>flushSync(()=>root.render(<FlutterPreview {...props}/>)); window.fixtureRender(window.fixtureProps);`, resolveDir: root, sourcefile: 'private-preview-fixture.tsx', loader: 'tsx' },
    bundle: true, splitting: true, format: 'esm', platform: 'browser', target: 'es2022',
    outdir: temporary, entryNames: 'fixture', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'silent',
    // Optional local counterexample: compile a saved prior component unchanged.
    plugins: process.env.PREVIEW_COMPONENT_SOURCE ? [{ name: 'saved-counterexample', setup(builder) { builder.onLoad({ filter: /\/mix\/FlutterPreview\.tsx$/ }, async args => ({ contents: await readFile(process.env.PREVIEW_COMPONENT_SOURCE, 'utf8'), loader: 'tsx', resolveDir: path.dirname(args.path) })); } }] : [],
  });
  browser = await chromium.launch();
  for (const mode of ['code', 'preview']) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const events = [], errors = [];
    let version = 'a';
    const props = (bundle, id = ids[0], source = `/${bundle}/sources`) => ({ previewId: id, defaultMode: mode, basePath: `/${bundle}`, sourceBasePath: source, height: 320 });
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', message => {
      if (message.text().startsWith('fixture-fetch:')) events.push({ kind: 'fetch', url: message.text().slice('fixture-fetch:'.length) });
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('request', request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) events.push({ kind: 'document', url: request.url() }); });
    await page.addInitScript(() => {
      const original = window.fetch;
      window.fetch = (...args) => { console.debug('fixture-fetch:' + new URL(typeof args[0] === 'string' ? args[0] : args[0].url, location.href).href); return original(...args); };
    });
    await page.route(`${origin}/**`, async route => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname === '/') return route.fulfill({ contentType: 'text/html', body: `<div id="root"></div><script>window.fixtureProps=${JSON.stringify(props(version))}</script><script type="module" src="/fixture.js"></script>` });
      if (!pathname.startsWith('/a/') && !pathname.startsWith('/b/')) {
        const filename = path.join(temporary, path.basename(pathname));
        try { return await route.fulfill({ contentType: 'text/javascript', body: await readFile(filename) }); } catch { return route.fulfill({ status: 404 }); }
      }
      const relative = pathname.slice(3).replace(/^sources-alt\//, 'sources/');
      const body = files.get('bundle/' + relative);
      if (!body) return route.fulfill({ status: 404 });
      const extension = path.extname(relative);
      const contentType = ({ '.json': 'application/json', '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm', '.html': 'text/html', '.dart': 'text/plain' })[extension] ?? 'application/octet-stream';
      return route.fulfill({ contentType, body });
    });
    async function expectSource(id) {
      const entry = manifest.entries.find(e => e.previewId === id);
      const full = files.get('bundle/sources/' + entry.sourcePath).toString();
      await page.waitForFunction(() => document.querySelector('pre'));
      assert.equal((await page.locator('pre').innerText()).trim(), full.trim());
    }
    await page.goto(origin);
    if (mode === 'preview') {
      await page.locator('[role="application"][data-state="ready"]').waitFor({ timeout: 60_000 });
      await page.locator('summary').click();
    }
    await expectSource(ids[0]);
    version = 'b';
    const boundary = events.length;
    const reloaded = page.waitForEvent('framenavigated', { predicate: frame => frame === page.mainFrame() });
    await page.evaluate(p => window.fixtureRender(p), props('b'));
    await reloaded;
    if (mode === 'preview') {
      await page.locator('[role="application"][data-state="ready"]').waitFor({ timeout: 60_000 });
      await page.locator('summary').click();
    }
    await expectSource(ids[0]);
    const transition = events.slice(boundary);
    const reloadIndex = transition.findIndex(e => e.kind === 'document');
    const firstB = transition.findIndex(e => e.kind === 'fetch' && new URL(e.url).pathname.startsWith('/b/'));
    assert.ok(reloadIndex >= 0 && firstB > reloadIndex, `B must fetch only after reload: ${JSON.stringify(transition)}`);
    assert.ok(!transition.slice(0, reloadIndex).some(e => e.kind === 'fetch' && new URL(e.url).pathname.startsWith('/b/')));
    // Same component instance, changed preview ID then source-only props.
    await page.evaluate(p => window.fixtureRender(p), props('b', ids[1]));
    await expectSource(ids[1]);
    await page.evaluate(p => window.fixtureRender(p), props('b', ids[1], '/b/sources-alt'));
    await page.waitForFunction(() => document.querySelector('pre'));
    await expectSource(ids[1]);
    assert.ok(events.some(e => e.kind === 'fetch' && e.url.includes('/b/sources-alt/')), 'source-only update resolves');
    if (mode === 'preview') assert.equal(await page.locator('details').getAttribute('open'), '');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ mode, result: 'PASS', transition, errors }));
    await context.close();
  }
} finally {
  await browser?.close();
  await rm(temporary, { recursive: true, force: true });
}
