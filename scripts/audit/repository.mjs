#!/usr/bin/env node
// Repository-owned checks, separate from compilation. Do not silently commit
// generated snapshots, evidence or private machine paths as authored content.
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
execFileSync('git', ['diff', '--check'], { stdio: 'inherit' });
const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).trim().split('\n');
for (const file of tracked) {
  assert.ok(!/^(?:\.context|\.generated|\.site-inputs|\.next)\//.test(file), `Generated or local record is tracked: ${file}`);
  if (/^docs\/.*\.(md|json)$/.test(file)) assert.ok(!/\/(?:Users|Volumes|home\/vercel-sandbox)\//.test(await readFile(file, 'utf8')), `Machine path in durable docs: ${file}`);
}
console.log('Repository diff, authored/generated boundary and durable documentation paths verified.');
