import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { hostingConfig, hostingVersionConfig } from '../../scripts/deploy/hosting-config.mjs';
import { releaseCoordinates, validateLock, validateSiteInputMetadata } from '../../scripts/site-inputs/lock.mjs';
import { mixBuildInputs } from '../../scripts/site-inputs/mix-build-inputs.mjs';
import { FORTAL_SITE, packageBuildInputs, verifyPackageBuildInputs } from '../../scripts/site-inputs/package-build-inputs.mjs';
import { stageFortalSite } from '../../scripts/site-inputs/sync-lib.mjs';

const COMMIT = 'a'.repeat(40);

async function writeTree(root, files) {
  for (const [file, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), content);
  }
}

const PACKAGE_FILES = {
  'packages/fortal_site/lib/main.dart': 'void main() {}',
  'packages/fortal_site/pubspec.lock': 'packages:\n  remix:\n    source: git\n',
  'packages/fortal_site/.fvmrc': '{"flutter": "3.47.9"}',
  'packages/fortal_site/shaders/shore.frag': 'void main() {}',
  'packages/fortal_site/SOURCES.json': JSON.stringify({ commit: COMMIT }),
  'scripts/site-inputs/produce/fortal-site.sh': 'flutter build web',
  'scripts/site-inputs/package-build-inputs.mjs': 'export {}',
};

test('the lock accepts a pinned fortal-site input from its own producer', () => {
  const entry = (name, repository = 'btwld/remix') => ({
    source: { repository, commit: COMMIT },
    producer: { repository: 'btwld/mix-website', script: `scripts/site-inputs/produce/${name}.sh`, commit: COMMIT },
    artifact: { url: releaseCoordinates(name, COMMIT).url, sha256: 'f'.repeat(64), size: 1 },
  });
  const lock = { version: 1, inputs: { 'mix-previews': entry('mix-previews', 'btwld/mix-website'), 'remix-docs': entry('remix-docs'), 'naked-ui-docs': entry('naked-ui-docs'), 'fortal-site': entry('fortal-site', 'btwld/mix-website') } };
  assert.doesNotThrow(() => validateLock(lock));
  assert.equal(releaseCoordinates('fortal-site', COMMIT).url, `https://github.com/btwld/mix-website/releases/download/site-input-fortal-site-${COMMIT.slice(0, 12)}/fortal-site-${COMMIT.slice(0, 12)}.tar.gz`);
  assert.throws(() => validateLock({ ...lock, inputs: { ...lock.inputs, 'fortal-site': { ...lock.inputs['fortal-site'], producer: { ...lock.inputs['fortal-site'].producer, script: 'scripts/site-inputs/produce/showcase.sh' } } } }), /unexpected producer script/);
  assert.doesNotThrow(() => validateSiteInputMetadata({ schemaVersion: 1, name: 'fortal-site', source: { repository: 'btwld/mix-website', commit: COMMIT } }));
});

test('the Fortal bundle is invalidated by its package, SDK pin and recipe, and by nothing else', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'fortal-site-'));
  try {
    await writeTree(root, {
      ...PACKAGE_FILES,
      'packages/mix_showcase/lib/main.dart': 'showcase',
      'packages/mix_showcase/pubspec.lock': 'packages: {}',
      'scripts/site-inputs/toolchains.json': '{}',
      'scripts/site-inputs/produce/showcase.sh': 'showcase',
    });
    const baseline = await packageBuildInputs(root, FORTAL_SITE);
    await writeTree(root, { 'bundle/build-inputs.json': JSON.stringify(baseline) });
    await verifyPackageBuildInputs(root, path.join(root, 'bundle'), FORTAL_SITE);
    const showcase = await mixBuildInputs(root, 'mix_showcase');

    for (const [file, original] of Object.entries(PACKAGE_FILES)) {
      await writeFile(path.join(root, file), original + ' changed');
      await assert.rejects(verifyPackageBuildInputs(root, path.join(root, 'bundle'), FORTAL_SITE), /Stale Flutter build inputs for packages\/fortal_site/);
      await writeFile(path.join(root, file), original);
    }
    await writeTree(root, { 'packages/fortal_site/lib/added.dart': 'new' });
    await assert.rejects(verifyPackageBuildInputs(root, path.join(root, 'bundle'), FORTAL_SITE), /Stale/);
    await rm(path.join(root, 'packages/fortal_site/lib/added.dart'));

    // Local build output and the other inputs' recipes are not Fortal inputs.
    await writeTree(root, {
      'packages/fortal_site/build/web/main.dart.js': 'built',
      'packages/fortal_site/.dart_tool/cache': 'cache',
      'packages/mix_showcase/lib/main.dart': 'changed showcase',
      'scripts/site-inputs/toolchains.json': '{"showcase": {}}',
    });
    assert.deepEqual(await packageBuildInputs(root, FORTAL_SITE), baseline);
    // And the Fortal package is not a showcase input.
    await writeTree(root, { 'packages/mix_showcase/lib/main.dart': 'showcase', 'scripts/site-inputs/toolchains.json': '{}', 'packages/fortal_site/lib/main.dart': 'void main() { run(); }' });
    assert.deepEqual(await mixBuildInputs(root, 'mix_showcase'), showcase);
  } finally { await rm(root, { recursive: true }); }
});

test('a local path dependency cannot enter the Fortal fingerprint', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'fortal-site-'));
  try {
    await writeTree(root, { ...PACKAGE_FILES, 'packages/fortal_site/pubspec.lock': 'packages:\n  remix:\n    source: path\n' });
    await assert.rejects(packageBuildInputs(root, FORTAL_SITE), /Local path dependencies/);
  } finally { await rm(root, { recursive: true }); }
});

test('the Fortal site is staged at /fortal/ only when built for that base href', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'fortal-site-'));
  const bundle = path.join(root, 'bundle');
  try {
    await writeTree(root, PACKAGE_FILES);
    await writeTree(bundle, {
      'index.html': '<html><head><base href="/fortal/"></head></html>',
      'main.dart.wasm': 'wasm',
      'licenses/Geist-OFL.txt': 'OFL',
      'build-inputs.json': JSON.stringify(await packageBuildInputs(root, FORTAL_SITE)),
    });
    await stageFortalSite(root, bundle);
    assert.equal(await readFile(path.join(root, 'public/fortal/main.dart.wasm'), 'utf8'), 'wasm');
    assert.ok(existsSync(path.join(root, 'public/fortal/licenses/Geist-OFL.txt')));

    await writeTree(bundle, { 'index.html': '<html><head><base href="/"></head></html>' });
    await assert.rejects(stageFortalSite(root, bundle), /does not use base href \/fortal\//);
    await writeTree(bundle, { 'index.html': '<html><head><base href="/fortal/"></head></html>' });
    await writeTree(root, { 'packages/fortal_site/lib/main.dart': 'edited after the build' });
    await assert.rejects(stageFortalSite(root, bundle), /Stale Flutter build inputs/);
  } finally { await rm(root, { recursive: true }); }
});

test('Fortal assets revalidate on both Hosting deployment paths', () => {
  const cli = hostingConfig('out').headers.find(row => row.source === '/fortal/**');
  assert.deepEqual(cli.headers, [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }]);
  const rest = hostingVersionConfig().headers.find(row => row.glob === '/fortal/**');
  assert.equal(rest.headers['Cache-Control'], 'public, max-age=0, must-revalidate');
});
