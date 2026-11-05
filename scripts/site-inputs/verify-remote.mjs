#!/usr/bin/env node
// Deliberately ignores every workspace/cache artifact. A successful result
// means an anonymous clean runner can retrieve and verify all locked inputs.
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { obtainArtifact, extractInput } from './sync-lib.mjs';
import { validateLock } from './lock.mjs';
const lock = validateLock(JSON.parse(await readFile('sources.lock.json', 'utf8')));
const temporary = await mkdtemp(path.join(tmpdir(), 'site-input-remote-'));
const failures = [];
try {
  for (const [name, entry] of Object.entries(lock.inputs)) {
    try {
      const data = await obtainArtifact(name, entry, { cacheDir: path.join(temporary, 'cache'), log: console.log });
      await extractInput(name, entry, data, path.join(temporary, name));
      console.log(`${name}: anonymous download, size, SHA-256 and provenance verified`);
    } catch (error) { failures.push(`${name}: ${error.message}`); }
  }
} finally { await rm(temporary, { recursive: true, force: true }); }
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
}
