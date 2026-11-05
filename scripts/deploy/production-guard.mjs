import assert from 'node:assert/strict';
import { REPOSITORY_ID, OWNER_ID } from './preview-guard.mjs';
export function validateProductionRun(run, workflowId, mainSha) {
  assert.equal(run.repository.id, REPOSITORY_ID);
  assert.equal(run.repository.owner.id, OWNER_ID);
  assert.equal(run.head_repository.id, REPOSITORY_ID);
  assert.equal(run.event, 'push');
  assert.equal(run.head_branch, 'main');
  assert.equal(run.conclusion, 'success');
  assert.equal(run.status, 'completed');
  assert.equal(run.workflow_id, workflowId);
  assert.equal(run.path, '.github/workflows/ci.yml');
  assert.match(run.head_sha, /^[0-9a-f]{40}$/);
  assert.equal(run.head_sha, mainSha, 'Superseded main build');
  return run.head_sha;
}
