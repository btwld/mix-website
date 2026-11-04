#!/usr/bin/env node
// Compare the locked preview source with the one canonical authoring location.
// A stale btwld/website pin is a migration failure, even if demos still render.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { verifyMixBuildInputs } from '../site-inputs/mix-build-inputs.mjs';
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
assert.equal(site.pages.remix.length, 53);
assert.equal(site.pages['naked-ui'].length, 23);
assert.equal(site.mix.previewIds.length, 30);
const inventory = JSON.parse(await readFile('docs/migration/pages.json', 'utf8'));
for (const project of ['mix', 'remix', 'naked-ui']) assert.equal(site.pages[project].length, inventory.counts[project], `${project} inventory must match the actual staged corpus`);
console.log(`Verified ${manifest.entries.length} preview entries / ${used.size} authored source files, 30 used IDs and all 105 canonical pages.`);
