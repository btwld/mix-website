#!/usr/bin/env node
// Deploy only committed source approved by CI. Credentials never enter the archive.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { validateProductionRun } from './production-guard.mjs';
import { REPOSITORY } from './preview-guard.mjs';
const env = process.env;
const backend = 'projects/bitwild-oss/locations/us-east4/backends/fluttermix';
const api = 'https://firebaseapphosting.googleapis.com/v1beta/';
const origin = 'https://fluttermix.com';
async function request(url, token, method = 'GET', body, binary = false) {
  const response = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': binary ? 'application/zip' : 'application/json' }, ...(body === undefined ? {} : { body: binary ? body : JSON.stringify(body) }), signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`${method} ${new URL(url).pathname}: HTTP ${response.status}: ${(await response.text()).slice(0, 1000)}`);
  return response.status === 204 ? null : response.json();
}
const gh = (route, method, body) => request(`https://api.github.com/repos/${REPOSITORY}/${route}`, env.GH_TOKEN, method, body);
const cloud = (route, method, body) => request(api + route, env.GOOGLE_ACCESS_TOKEN, method, body);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function approved() {
  assert.match(env.WORKFLOW_RUN_ID ?? '', /^\d+$/);
  const [run, workflow, main] = await Promise.all([gh(`actions/runs/${env.WORKFLOW_RUN_ID}`), gh('actions/workflows/ci.yml'), gh('git/ref/heads/main')]);
  const sha = validateProductionRun(run, workflow.id, main.object.sha);
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), sha, 'Checkout must match approved CI');
  return sha;
}
async function waitOperation(operation) {
  assert.ok(operation.name.startsWith('projects/bitwild-oss/locations/us-east4/operations/'));
  for (let attempt = 0; attempt < 180; attempt++) {
    const result = await cloud(operation.name);
    if (result.error) throw new Error(JSON.stringify(result.error));
    if (result.done) return result.response;
    await sleep(10000);
  }
  throw new Error(`Timed out: ${operation.name}`);
}
let deployment;
let staging;
try {
  const sha = await approved();
  const lock = await readFile('sources.lock.json');
  const lockSha256 = createHash('sha256').update(lock).digest('hex');
  const id = `gh-${env.GITHUB_RUN_ID}-${env.GITHUB_RUN_ATTEMPT}`;
  assert.match(id, /^gh-\d+-\d+$/);
  staging = await mkdtemp(path.join(tmpdir(), 'mix-production-'));
  const tar = path.join(staging, 'source.tar');
  execFileSync('git', ['archive', '--format=tar', '--output', tar, sha]);
  execFileSync('tar', ['-xf', tar, '-C', staging]);
  await rm(tar);
  const yaml = await readFile(path.join(staging, 'apphosting.yaml'), 'utf8');
  assert.ok(!yaml.includes('variable: SITE_COMMIT') && !yaml.includes('variable: SITE_INDEXING'), 'Tracked config must remain environment-neutral');
  await writeFile(path.join(staging, 'apphosting.yaml'), yaml + `\n  - variable: SITE_COMMIT\n    value: ${sha}\n    availability: [BUILD, RUNTIME]\n  - variable: SITE_INDEXING\n    value: index\n    availability: [BUILD, RUNTIME]\n`);
  const zip = `${staging}.zip`;
  try {
    execFileSync('zip', ['-qr', zip, '.'], { cwd: staging });
    const bucket = 'firebaseapphosting-sources-416994480519-us-east4';
    const object = `github/${sha}/${id}.zip`;
    await request(`https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&ifGenerationMatch=0&name=${encodeURIComponent(object)}`, env.GOOGLE_ACCESS_TOKEN, 'POST', await readFile(zip), true);
    deployment = await gh('deployments', 'POST', { ref: sha, environment: 'production', auto_merge: false, required_contexts: [], production_environment: true, description: 'CI-approved Firebase App Hosting release' });
    const status = state => gh(`deployments/${deployment.id}/statuses`, 'POST', { state, environment_url: origin, log_url: `https://github.com/${REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}` });
    await status('in_progress');
    const build = await waitOperation(await cloud(`${backend}/builds?buildId=${id}`, 'POST', { source: { archive: { userStorageUri: `gs://${bucket}/${object}`, rootDirectory: '.' } } }));
    assert.equal(build.state, 'READY', 'App Hosting build is not ready');
    await approved(); // A slower, superseded CI run must not roll production back.
    await waitOperation(await cloud(`${backend}/rollouts?rolloutId=${id}`, 'POST', { build: build.name }));
    let verified = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        const response = await fetch(`${origin}/__site.json?release=${id}-${attempt}`, { signal: AbortSignal.timeout(15000) });
        const identity = await response.json();
        if (identity.commit === sha && identity.lockSha256 === lockSha256 && identity.dirty === false) { verified = true; break; }
      } catch { /* Propagation can briefly return the previous release. */ }
      await sleep(5000);
    }
    assert.ok(verified, 'Public origin did not serve the approved source and input lock');
    await status('success');
    console.log(`Verified ${origin}: ${sha}`);
  } finally { await rm(zip, { force: true }); }
} catch (error) {
  if (deployment) await gh(`deployments/${deployment.id}/statuses`, 'POST', { state: 'failure', description: String(error.message).slice(0, 140) }).catch(() => {});
  throw error;
} finally {
  if (staging) await rm(staging, { recursive: true, force: true });
}
