import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildIdentity } from '../../scripts/site-inputs/build-identity.mjs';

test('build identity uses the checkout and rejects a mismatching claimed SHA', () => {
  const actual = buildIdentity(process.cwd(), {});
  assert.match(actual.commit, /^[0-9a-f]{40}$/);
  assert.equal(actual.identity, 'git');
  assert.throws(() => buildIdentity(process.cwd(), { SITE_COMMIT: '0'.repeat(40) }), /differs/);
});

test('source archives require an explicit SHA to claim an identity', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'site-identity-'));
  try {
    assert.deepEqual(buildIdentity(dir, { GITHUB_SHA: 'a'.repeat(40) }), { commit: null, dirty: false, identity: 'unavailable' });
    assert.equal(buildIdentity(dir, { SITE_COMMIT: 'a'.repeat(40) }).commit, 'a'.repeat(40));
    assert.throws(() => buildIdentity(dir, { SITE_COMMIT: 'main' }), /full source/);
  } finally { await rm(dir, { recursive: true }); }
});

test('uncommitted new content is dirty while ignored generated files are excluded', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'site-identity-content-'));
  const git = args => execFileSync('git', args, { cwd: dir, stdio: 'pipe' });
  try {
    git(['init', '-q']);
    await writeFile(path.join(dir, '.gitignore'), '.generated/\n');
    git(['add', '.gitignore']);
    git(['-c', 'user.name=Identity Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'Initial source']);
    await mkdir(path.join(dir, '.generated'));
    await writeFile(path.join(dir, '.generated/snapshot.mdx'), '# Generated');
    assert.equal(buildIdentity(dir, {}).dirty, false);
    await mkdir(path.join(dir, 'content'));
    await writeFile(path.join(dir, 'content/new-page.mdx'), '# Uncommitted authoring');
    assert.equal(buildIdentity(dir, {}).dirty, true);
  } finally { await rm(dir, { recursive: true }); }
});
