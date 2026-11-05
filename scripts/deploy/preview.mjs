#!/usr/bin/env node
// Executed only from protected default-branch checkout. Downloaded PR files are
// opaque static data; no dependency installation or PR command runs here.
import assert from 'node:assert/strict';
import { appendFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { channelFor, validateRun, validatePullRequest, validateArtifact, REPOSITORY, REPOSITORY_ID, OWNER_ID } from './preview-guard.mjs';
import { hostingVersionConfig } from './hosting-config.mjs';

const env = process.env;
const gh = async (route, method = 'GET', body) => {
  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}${route ? `/${route}` : ''}`, {
    method, headers: { Authorization: `Bearer ${env.GH_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new Error(`GitHub ${route}: HTTP ${response.status}`);
  return response.status === 204 ? null : response.json();
};
const output = async (key, value) => {
  assert.ok(!/[\r\n]/.test(String(value)));
  if (env.GITHUB_OUTPUT) await appendFile(env.GITHUB_OUTPUT, `${key}=${value}\n`);
};
async function current(number = env.PR_NUMBER, sha = env.PREVIEW_SHA) {
  const pr = await gh(`pulls/${Number(number)}`);
  validatePullRequest(pr, number, sha);
  return pr;
}
async function inspectRun() {
  assert.match(env.WORKFLOW_RUN_ID ?? '', /^\d+$/);
  const [run, workflow] = await Promise.all([gh(`actions/runs/${env.WORKFLOW_RUN_ID}`), gh('actions/workflows/ci.yml')]);
  const { pr, sha } = validateRun(run, workflow.id);
  await current(pr, sha);
  const artifacts = await gh(`actions/runs/${run.id}/artifacts?per_page=100`);
  const matches = artifacts.artifacts.filter(a => a.name === `site-preview-${sha}` && !a.expired);
  assert.equal(matches.length, 1, 'Missing or ambiguous preview artifact');
  assert.equal(matches[0].workflow_run.id, run.id);
  assert.equal(matches[0].workflow_run.head_sha, sha);
  await output('pr', pr); await output('sha', sha); await output('artifact', matches[0].id);
}
function siteName() {
  assert.equal(env.GOOGLE_CLOUD_PROJECT, 'bitwild-oss');
  assert.match(env.PREVIEW_HOSTING_SITE ?? '', /^mix-website-previews(?:-[a-z0-9]+)?$/, 'Use the dedicated preview-only Hosting site');
  return env.PREVIEW_HOSTING_SITE;
}
const apiRoot = 'https://firebasehosting.googleapis.com/v1beta1/';
async function cloud(route, method = 'GET', body, allowMissing = false) {
  const response = await fetch(apiRoot + route, {
    method, headers: { Authorization: `Bearer ${env.GOOGLE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (allowMissing && response.status === 404) return null;
  if (!response.ok) throw new Error(`Hosting ${method} ${route}: HTTP ${response.status}`);
  return response.status === 204 ? null : response.json();
}
async function deploy() {
  const site = siteName();
  const channel = channelFor(env.PR_NUMBER);
  const parent = `sites/${site}/channels/${channel}`;
  await current();
  const lockFile = await gh(`contents/sources.lock.json?ref=${env.PREVIEW_SHA}`);
  const lockText = Buffer.from(lockFile.content, 'base64').toString('utf8');
  const directory = path.resolve(env.PREVIEW_DIRECTORY ?? 'preview-data');
  const files = await validateArtifact(directory, env.PREVIEW_SHA, lockText);
  const content = new Map();
  const hashes = {};
  for (const file of files) {
    const bytes = gzipSync(await readFile(path.join(directory, file)), { level: 9 });
    const hash = createHash('sha256').update(bytes).digest('hex');
    hashes['/' + file] = hash;
    content.set(hash, bytes);
  }
  let version;
  let released = false;
  const previous = await cloud(parent, 'GET', undefined, true);
  const previousVersion = previous?.release?.version?.name;
  try {
    version = await cloud(`sites/${site}/versions`, 'POST', { config: hostingVersionConfig(), labels: { 'preview-pr': String(Number(env.PR_NUMBER)), 'source-sha': env.PREVIEW_SHA } });
    assert.match(version.name, new RegExp(`^sites/${site}/versions/[a-zA-Z0-9-]+$`));
    const populated = await cloud(`${version.name}:populateFiles`, 'POST', { files: hashes });
    const expectedUpload = `https://upload-firebasehosting.googleapis.com/upload/${version.name}/files`;
    assert.equal(populated.uploadUrl, expectedUpload);
    // Bounded parallel uploads; credentials never enter uploaded files.
    const pending = [...(populated.uploadRequiredHashes ?? [])];
    await Promise.all(Array.from({ length: 8 }, async () => {
      while (pending.length) {
        const hash = pending.pop();
        assert.ok(content.has(hash), 'Server requested an unknown file digest');
        const response = await fetch(`${expectedUpload}/${hash}`, { method: 'POST', headers: { Authorization: `Bearer ${env.GOOGLE_ACCESS_TOKEN}`, 'Content-Type': 'application/octet-stream' }, body: content.get(hash) });
        if (!response.ok) throw new Error(`Preview upload: HTTP ${response.status}`);
      }
    }));
    await cloud(`${version.name}?updateMask=status`, 'PATCH', { status: 'FINALIZED' });
    // No traffic changes before the final fresh PR-head check, after all uploads.
    await current();
    const destination = previous
      ? await cloud(`${parent}?updateMask=ttl`, 'PATCH', { ttl: '604800s' })
      : await cloud(`sites/${site}/channels?channelId=${channel}`, 'POST', { ttl: '604800s', retainedReleaseCount: 3 });
    await current();
    await cloud(`${parent}/releases?versionName=${encodeURIComponent(version.name)}`, 'POST', { message: `PR ${Number(env.PR_NUMBER)} @ ${env.PREVIEW_SHA}` });
    released = true;
    const url = new URL(destination.url);
    assert.equal(url.protocol, 'https:'); assert.ok(url.hostname.endsWith('.web.app'));
    let served = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      const response = await fetch(new URL(`/__site.json?run=${env.GITHUB_RUN_ID}-${attempt}`, url), { cache: 'no-store' });
      if (response.ok && /noindex/.test(response.headers.get('x-robots-tag') ?? '')) {
        const identity = await response.json();
        if (identity.commit === env.PREVIEW_SHA && !identity.dirty) { served = true; break; }
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    assert.ok(served, 'Preview did not serve the verified source SHA with noindex');
    await current();
    const deployment = await gh('deployments', 'POST', { ref: env.PREVIEW_SHA, environment: `preview/pr-${Number(env.PR_NUMBER)}`, auto_merge: false, required_contexts: [], transient_environment: true, production_environment: false, description: 'Verified static site preview' });
    await gh(`deployments/${deployment.id}/statuses`, 'POST', { state: 'success', environment_url: url.href, auto_inactive: true, log_url: `https://github.com/${REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}` });
    await output('url', url.href);
    console.log(`Verified PR ${Number(env.PR_NUMBER)} preview: ${url.href} @ ${env.PREVIEW_SHA}`);
  } catch (error) {
    // If the PR changed during the release/verification window, restore the
    // previous passing preview. Serialization prevents overwriting a newer job.
    if (released) {
      if (previousVersion) await cloud(`${parent}/releases?versionName=${encodeURIComponent(previousVersion)}`, 'POST', { message: 'Restore previous verified preview after failed or superseded deployment' });
      else await cloud(parent, 'DELETE', undefined, true);
    }
    if (version && !released) await cloud(version.name, 'DELETE', undefined, true);
    throw error;
  }
}
async function cleanupPlan() {
  const site = siteName();
  const numbers = [];
  let token = '';
  do {
    const data = await cloud(`sites/${site}/channels?pageSize=100${token ? `&pageToken=${encodeURIComponent(token)}` : ''}`);
    for (const row of data.channels ?? []) {
      const match = /\/channels\/pr-([1-9][0-9]*)$/.exec(row.name);
      if (match && (await gh(`pulls/${match[1]}`)).state === 'closed') numbers.push(Number(match[1]));
    }
    token = data.nextPageToken;
  } while (token);
  await output('numbers', JSON.stringify(numbers));
}
async function cleanup() {
  const site = siteName();
  const channel = channelFor(env.PR_NUMBER);
  const pr = await gh(`pulls/${Number(env.PR_NUMBER)}`);
  if (pr.state !== 'closed') { console.log('PR is open; preserving its preview.'); return; }
  await cloud(`sites/${site}/channels/${channel}`, 'DELETE', undefined, true);
  const deployments = await gh(`deployments?environment=${encodeURIComponent(`preview/${channel}`)}&per_page=100`);
  for (const d of deployments) await gh(`deployments/${d.id}/statuses`, 'POST', { state: 'inactive' });
  console.log(`Removed ${channel}; Hosting expiration also bounds orphan lifetime to seven days.`);
}
export { deploy, cleanup };
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const repository = await gh('');
  assert.equal(repository.id, REPOSITORY_ID); assert.equal(repository.owner.id, OWNER_ID);
  const command = { inspect: inspectRun, deploy, 'cleanup-plan': cleanupPlan, cleanup }[process.argv[2]];
  assert.ok(command, 'Expected inspect, deploy, cleanup-plan or cleanup');
  await command();
}
