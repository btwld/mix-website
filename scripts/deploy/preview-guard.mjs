import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

// Numeric IDs survive repository renames and prevent name-reuse impersonation.
export const REPOSITORY = 'btwld/mix-website';
export const REPOSITORY_ID = 1444465253;
export const OWNER_ID = 83911646;
export const channelFor = number => {
  assert.ok(Number.isSafeInteger(Number(number)) && Number(number) > 0, 'Invalid PR number');
  return `pr-${Number(number)}`;
};
export function validateRun(run, workflowId) {
  assert.equal(run.repository.id, REPOSITORY_ID);
  assert.equal(run.repository.owner.id, OWNER_ID);
  assert.equal(run.head_repository.id, REPOSITORY_ID, 'Fork builds cannot deploy');
  assert.equal(run.event, 'pull_request');
  assert.equal(run.conclusion, 'success');
  assert.equal(run.status, 'completed');
  assert.equal(run.workflow_id, workflowId);
  assert.equal(run.path, '.github/workflows/ci.yml');
  assert.match(run.head_sha, /^[0-9a-f]{40}$/);
  assert.equal(run.pull_requests.length, 1, 'Expected one unambiguous PR');
  return { pr: run.pull_requests[0].number, sha: run.head_sha };
}
export function validatePullRequest(pr, number, sha) {
  assert.equal(pr.number, Number(number));
  assert.equal(pr.state, 'open', 'Closed PR cannot deploy');
  assert.equal(pr.head.repo.id, REPOSITORY_ID, 'Fork builds cannot deploy');
  assert.equal(pr.base.repo.id, REPOSITORY_ID);
  assert.equal(pr.head.repo.owner.id, OWNER_ID);
  assert.equal(pr.head.sha, sha, 'Superseded PR build');
}

export async function inspectFiles(directory) {
  const files = [];
  let total = 0;
  async function walk(relative = '') {
    for (const name of await readdir(path.join(directory, relative))) {
      assert.ok(!name.startsWith('.') && name !== 'node_modules' && !/[\\\x00-\x1f]/.test(name), 'Unexpected artifact path');
      const child = path.join(relative, name);
      const info = await lstat(path.join(directory, child));
      assert.ok(!info.isSymbolicLink(), 'Artifact symlinks are forbidden');
      if (info.isDirectory()) await walk(child);
      else {
        assert.ok(info.isFile(), 'Artifact must contain ordinary files');
        total += info.size;
        files.push(child);
        assert.ok(files.length <= 20000 && total <= 500 * 1024 * 1024, 'Artifact exceeds the preview bound');
      }
    }
  }
  await walk();
  for (const required of ['index.html', '404.html', '__site.json', 'mix/index.html', 'remix/catalog/index.html', 'naked-ui/index.html']) assert.ok(files.includes(required), `Missing ${required}`);
  return files.sort();
}
export async function validateArtifact(directory, sha, lockText) {
  const files = await inspectFiles(directory);
  const identity = JSON.parse(await readFile(path.join(directory, '__site.json'), 'utf8'));
  assert.equal(identity.commit, sha, 'Artifact belongs to another source commit');
  assert.equal(identity.dirty, false, 'Dirty builds cannot deploy');
  assert.equal(identity.lockSha256, createHash('sha256').update(lockText).digest('hex'), 'Artifact inputs differ from the PR lock');
  const lock = JSON.parse(lockText);
  for (const [name, entry] of Object.entries(lock.inputs)) {
    assert.equal(identity.inputs[name].commit, entry.source.commit);
    assert.equal(identity.inputs[name].sha256, entry.artifact.sha256);
  }
  return files;
}
