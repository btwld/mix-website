import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { validateRun, validatePullRequest, inspectFiles, channelFor, REPOSITORY_ID, OWNER_ID } from '../../scripts/deploy/preview-guard.mjs';
const sha = 'a'.repeat(40);
const repo = { id: REPOSITORY_ID, owner: { id: OWNER_ID } };
const run = { repository: repo, head_repository: repo, event: 'pull_request', conclusion: 'success', status: 'completed', workflow_id: 42, path: '.github/workflows/ci.yml', head_sha: sha, pull_requests: [{ number: 3 }] };
const pr = { number: 3, state: 'open', head: { repo, sha }, base: { repo } };
test('only current successful same-repository runs can deploy', () => {
  assert.deepEqual(validateRun(run,42), { pr:3, sha });
  validatePullRequest(pr,3,sha);
  for (const bad of [{ conclusion:'failure' }, { event:'push' }, { head_repository: { id: 5 } }, { workflow_id:43 }, { pull_requests:[] }, { repository: { ...repo, owner:{id:1} } }]) assert.throws(() => validateRun({...run,...bad},42));
  for (const bad of [{state:'closed'}, {head:{...pr.head,sha:'b'.repeat(40)}}, {head:{...pr.head,repo:{id:5}}}]) assert.throws(() => validatePullRequest({...pr,...bad},3,sha));
  assert.equal(channelFor(3),'pr-3');
  assert.throws(() => channelFor('live'));
});
test('downloaded artifacts cannot introduce executable links into a privileged job', async () => {
  const dir=await mkdtemp(path.join(tmpdir(),'preview-data-'));
  try {
    for (const file of ['index.html','404.html','__site.json','mix/index.html','remix/catalog/index.html','naked-ui/index.html']) {
      await mkdir(path.dirname(path.join(dir,file)),{recursive:true}); await writeFile(path.join(dir,file),'data');
    }
    assert.equal((await inspectFiles(dir)).length,6);
    await symlink('/etc/passwd',path.join(dir,'link'));
    await assert.rejects(inspectFiles(dir),/symlinks/);
  } finally { await rm(dir,{recursive:true}); }
});
