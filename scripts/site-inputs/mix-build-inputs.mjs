import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
// Dependencies are resolved by pubspec.lock (hosted checksums / exact Git SHAs).
// Capture the entire authored package, not just the manifest's display snippets.
const ignored = new Set(['.git', '.dart_tool', 'build', '.packages', '.flutter-plugins', '.flutter-plugins-dependencies']);
export async function mixBuildInputs(root, packageName = 'mix_docs_preview') {
  const files = {};
  async function visit(relative) {
    let info;
    try { info = await lstat(path.join(root, relative)); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
    assert.ok(!info.isSymbolicLink(), `Unsupported symlink in Flutter build inputs: ${relative}`);
    if (info.isDirectory()) {
      for (const name of (await readdir(path.join(root, relative))).sort()) {
        if (!ignored.has(name)) await visit(`${relative}/${name}`);
      }
    } else if (info.isFile()) files[relative] = hash(await readFile(path.join(root, relative)));
  }
  await visit(`packages/${packageName}`);
  const producerFiles = packageName === 'mix_docs_preview'
    ? ['scripts/check-previews-manifest.mjs', 'scripts/site-inputs/produce/mix-previews.sh']
    : ['scripts/site-inputs/produce/showcase.sh'];
  for (const file of [...producerFiles, 'scripts/site-inputs/mix-build-inputs.mjs', 'scripts/site-inputs/toolchains.json']) await visit(file);
  const lock = await readFile(path.join(root, `packages/${packageName}/pubspec.lock`), 'utf8').catch(error => { if (error.code === 'ENOENT') return ''; throw error; });
  assert.ok(!/^\s*source: path\s*$/m.test(lock), 'Local path dependencies need explicit build-input ownership before producing a bundle');
  const sorted = Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b, 'en')));
  return { version: 1, sha256: hash(JSON.stringify(sorted)), files: sorted };
}

export async function verifyMixBuildInputs(root, bundle, packageName) {
  const actual = await mixBuildInputs(root, packageName);
  const recorded = JSON.parse(await readFile(path.join(bundle, 'build-inputs.json'), 'utf8'));
  assert.deepEqual(recorded, actual, 'Stale Flutter build inputs; rebuild and pin the canonical Mix archive');
  return actual;
}
