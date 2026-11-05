#!/usr/bin/env node
// Repository-owned checks, separate from compilation. Do not silently commit
// generated snapshots, evidence or private machine paths as authored content.
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sha256 } from '../site-inputs/tar.mjs';
execFileSync('git', ['diff', '--check'], { stdio: 'inherit' });
const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).trim().split('\n');
for (const file of tracked) {
  assert.ok(!/^(?:\.context|\.generated|\.site-inputs|\.next)\//.test(file), `Generated or local record is tracked: ${file}`);
  if (/^docs\/.*\.(md|json)$/.test(file)) assert.ok(!/\/(?:Users|Volumes|home\/vercel-sandbox)\//.test(await readFile(file, 'utf8')), `Machine path in durable docs: ${file}`);
}
const { assets } = JSON.parse(await readFile('public/assets/SOURCES.json', 'utf8'));
for (const { path, bytes, sha256: expected } of Object.values(assets)) {
  const contents = await readFile(path);
  assert.equal(contents.length, bytes, `Landing asset size changed: ${path}`);
  assert.equal(sha256(contents), expected, `Landing asset digest changed: ${path}`);
}
console.log('Repository diff, authored/generated boundary, documentation paths and landing asset digests verified.');
