import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateProductionRun } from '../../scripts/deploy/production-guard.mjs';
import { REPOSITORY_ID, OWNER_ID } from '../../scripts/deploy/preview-guard.mjs';
const sha = 'a'.repeat(40);
const repository = { id: REPOSITORY_ID, owner: { id: OWNER_ID } };
const run = { repository, head_repository: repository, event: 'push', head_branch: 'main', conclusion: 'success', status: 'completed', workflow_id: 42, path: '.github/workflows/ci.yml', head_sha: sha };
test('production requires successful current main CI from this repository', () => {
  assert.equal(validateProductionRun(run, 42, sha), sha);
  for (const bad of [{ event: 'pull_request' }, { head_branch: 'topic' }, { conclusion: 'failure' }, { status: 'in_progress' }, { head_repository: { id: 1 } }, { repository: { ...repository, owner: { id: 1 } } }, { workflow_id: 1 }, { path: '.github/workflows/other.yml' }]) {
    assert.throws(() => validateProductionRun({ ...run, ...bad }, 42, sha));
  }
  assert.throws(() => validateProductionRun(run, 42, 'b'.repeat(40)), /Superseded/);
});
