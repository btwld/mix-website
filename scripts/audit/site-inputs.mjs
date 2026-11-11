#!/usr/bin/env node
// Compare the locked preview source with the one canonical authoring location.
// A stale btwld/website pin is a migration failure, even if demos still render.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { verifyMixBuildInputs } from '../site-inputs/mix-build-inputs.mjs';
import { LANDING_PREVIEW_IDS } from '../../lib/landing-previews.mjs';
const lock = JSON.parse(await readFile('sources.lock.json', 'utf8'));
assert.equal(lock.inputs['mix-previews'].source.repository, 'btwld/mix-website', 'Mix previews must be produced by their canonical owner');
for (const [name, entry] of Object.entries(lock.inputs)) {
  assert.equal(entry.producer?.repository, 'btwld/mix-website', `${name}: producer ownership must be explicit`);
  assert.match(entry.producer?.commit ?? '', /^[0-9a-f]{40}$/, `${name}: producer SHA must be explicit`);
  const metadata = JSON.parse(await readFile(`.site-inputs/extracted/${name}/site-input.json`, 'utf8'));
  assert.deepEqual(metadata.producer, entry.producer, `${name}: producer provenance must match the lock`);
}
const bundle = '.site-inputs/extracted/mix-previews/bundle';
await verifyMixBuildInputs(process.cwd(), bundle);
const manifest = JSON.parse(await readFile(path.join(bundle, 'previews-manifest.json'), 'utf8'));
const used = new Set();
for (const entry of manifest.entries) {
  const authored = await readFile(entry.sourcePath);
  const bundled = await readFile(path.join(bundle, 'sources', entry.sourcePath));
  assert.ok(authored.equals(bundled), `Stale bundled source for ${entry.previewId}: ${entry.sourcePath}`);
  used.add(entry.sourcePath);
}
const site = JSON.parse(await readFile('.generated/site-inputs.json', 'utf8'));
assert.equal(site.pages.mix.length, 29);
assert.equal(site.pages.remix.length, 62);
assert.equal(site.pages['naked-ui'].length, 23);
// 29 referenced by Mix MDX plus the 13 the landing pages mount. The old
// nested-token preview read spacing from a shadowed scope; the guide now
// teaches MixScope.inherit with explicit source instead of mounting that input.
assert.equal(site.mix.previewIds.length, 42);
assert.ok(!site.mix.previewIds.includes('guides/design-token.0'));
assert.deepEqual(Object.keys(site.mix.landingPreviews).sort(), [...LANDING_PREVIEW_IDS].sort());
// Checked here rather than in a unit test: the manifest only exists once the
// prebuild has staged it, and a cache-backed check could not prove anything.
const renderable = new Set(manifest.entries.filter(entry => entry.renderable).map(entry => entry.previewId));
assert.deepEqual(LANDING_PREVIEW_IDS.filter(id => !renderable.has(id)), [], 'every landing preview must be a renderable locked entry');
for (const [id, locked] of Object.entries(site.mix.landingPreviews)) {
  const entry = manifest.entries.find(candidate => candidate.previewId === id);
  assert.equal(locked.sourcePath, entry.sourcePath, `${id}: staged source path must match the manifest`);
  assert.equal(locked.snippetRegion, entry.snippetRegion ?? null, `${id}: staged snippet region must match the manifest`);
}
const inventory = JSON.parse(await readFile('docs/migration/pages.json', 'utf8'));
for (const project of ['mix', 'remix', 'naked-ui']) assert.equal(site.pages[project].length, inventory.counts[project], `${project} inventory must match the actual staged corpus`);
console.log(`Verified ${manifest.entries.length} preview entries / ${used.size} authored source files, ${site.mix.previewIds.length} used IDs (${LANDING_PREVIEW_IDS.length} on landings) and all 114 canonical pages.`);
