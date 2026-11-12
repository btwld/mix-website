import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

// The fingerprint of a Flutter package built into a site input: the whole
// package, whose pubspec.lock pins hosted checksums and exact Git SHAs and
// whose .fvmrc pins the SDK, plus the website files that build it.
//
// Kept apart from mix-build-inputs.mjs on purpose. Those fingerprints cover
// that file and toolchains.json byte for byte, so adding an input there would
// invalidate the published Mix preview and showcase archives.
export const FORTAL_SITE = {
  package: 'packages/fortal_site',
  recipe: ['scripts/site-inputs/produce/fortal-site.sh', 'scripts/site-inputs/package-build-inputs.mjs'],
};

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const ignored = new Set(['.git', '.dart_tool', 'build', '.packages', '.flutter-plugins', '.flutter-plugins-dependencies']);

export async function packageBuildInputs(root, { package: packagePath, recipe }) {
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
  await visit(packagePath);
  for (const file of recipe) await visit(file);
  const lock = await readFile(path.join(root, packagePath, 'pubspec.lock'), 'utf8');
  assert.ok(!/^\s*source: path\s*$/m.test(lock), 'Local path dependencies need explicit build-input ownership before producing a bundle');
  const sorted = Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b, 'en')));
  return { version: 1, sha256: hash(JSON.stringify(sorted)), files: sorted };
}

export async function verifyPackageBuildInputs(root, bundle, spec) {
  const actual = await packageBuildInputs(root, spec);
  const recorded = JSON.parse(await readFile(path.join(bundle, 'build-inputs.json'), 'utf8'));
  assert.deepEqual(recorded, actual, `Stale Flutter build inputs for ${spec.package}; rebuild and pin its archive`);
  return actual;
}
