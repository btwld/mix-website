import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { deploy, cleanup } from '../../scripts/deploy/preview.mjs';
import { REPOSITORY_ID, OWNER_ID } from '../../scripts/deploy/preview-guard.mjs';

// These exercise the real upload/release orchestration with API responses.
// They prove local ordering/isolation, not a successful hosted deployment.
for (const scenario of ['success', 'stale-before-release', 'stale-after-release', 'cleanup-reopened']) {
  test(`preview lifecycle: ${scenario}`, async () => {
    const dir = await mkdtemp(path.join(tmpdir(),'preview-release-'));
    const oldEnv = { ...process.env };
    const oldFetch = globalThis.fetch;
    const sha = 'a'.repeat(40);
    const repo = { id: REPOSITORY_ID, owner: { id: OWNER_ID } };
    const site = 'mix-website-previews';
    const lockText = JSON.stringify({ inputs:{} });
    const identity = { commit:sha, dirty:false, lockSha256:createHash('sha256').update(lockText).digest('hex'), inputs:{} };
    const calls = [];
    let prReads = 0;
    const json = body => new Response(JSON.stringify(body), { headers:{'Content-Type':'application/json','X-Robots-Tag':'noindex, nofollow'} });
    Object.assign(process.env, { GOOGLE_CLOUD_PROJECT:'bitwild-oss', PREVIEW_HOSTING_SITE:site, PREVIEW_DIRECTORY:dir, PR_NUMBER:'17', PREVIEW_SHA:sha });
    delete process.env.GITHUB_OUTPUT;
    try {
      for (const file of ['index.html','404.html','mix/index.html','remix/catalog/index.html','naked-ui/index.html','__site.json']) {
        await mkdir(path.dirname(path.join(dir,file)),{recursive:true});
        await writeFile(path.join(dir,file),file === '__site.json' ? JSON.stringify(identity) : '<html>preview</html>');
      }
      globalThis.fetch = async (url, options = {}) => {
        url = new URL(url); const method = options.method ?? 'GET';
        calls.push(`${method} ${url.pathname}${url.search}`);
        if (url.hostname === 'api.github.com') {
          if (url.pathname.endsWith('/pulls/17')) {
            prReads++;
            const stale = scenario === 'stale-before-release' && prReads >= 2 || scenario === 'stale-after-release' && prReads >= 4;
            return json({ number:17, state:'open', head:{repo,sha:stale?'b'.repeat(40):sha}, base:{repo} });
          }
          if (url.pathname.endsWith('/contents/sources.lock.json')) return json({content:Buffer.from(lockText).toString('base64')});
          if (url.pathname.endsWith('/deployments')) return json({id:123});
          if (url.pathname.endsWith('/deployments/123/statuses')) return json({id:456});
        }
        if (url.hostname === 'firebasehosting.googleapis.com') {
          if (url.pathname.endsWith('/channels/pr-17') && method === 'GET') return json({release:{version:{name:`sites/${site}/versions/previous`}}});
          if (url.pathname.endsWith('/versions') && method === 'POST') {
            const body = JSON.parse(options.body);
            assert.equal(body.config.trailingSlashBehavior,'ADD');
            assert.equal(body.config.headers[0].headers['X-Robots-Tag'],'noindex, nofollow');
            return json({name:`sites/${site}/versions/candidate`});
          }
          if (url.pathname.endsWith(':populateFiles')) {
            return json({uploadRequiredHashes:[...new Set(Object.values(JSON.parse(options.body).files))],uploadUrl:`https://upload-firebasehosting.googleapis.com/upload/sites/${site}/versions/candidate/files`});
          }
          if (url.pathname.endsWith('/channels/pr-17') && method === 'PATCH') return json({url:`https://${site}--pr-17-example.web.app`});
          return json({});
        }
        if (url.hostname === 'upload-firebasehosting.googleapis.com') {
          assert.equal(url.pathname.split('/').pop(),createHash('sha256').update(options.body).digest('hex'));
          return new Response('');
        }
        if (url.hostname === `${site}--pr-17-example.web.app`) return json(identity);
        throw new Error('Unexpected request: '+url);
      };
      if (scenario === 'cleanup-reopened') {
        await cleanup(); assert.ok(!calls.some(call => call.startsWith('DELETE')));
      } else if (scenario.startsWith('stale')) {
        await assert.rejects(deploy(),/Superseded/);
        const releases = calls.filter(call => call.includes('/releases?'));
        if (scenario === 'stale-before-release') assert.equal(releases.length,0);
        else { assert.equal(releases.length,2); assert.ok(releases[1].includes('previous')); }
        assert.ok(!calls.some(call => /POST .*\/deployments$/.test(call)));
      } else {
        await deploy();
        assert.equal(calls.filter(call => call.includes('/releases?')).length,1);
        assert.ok(calls.some(call => /POST .*\/deployments$/.test(call)));
        assert.ok(!calls.some(call => /pr-(?!17\b)\d+/.test(call)), 'Another PR must remain untouched');
      }
    } finally {
      globalThis.fetch = oldFetch;
      for (const key of Object.keys(process.env)) if (!(key in oldEnv)) delete process.env[key];
      Object.assign(process.env,oldEnv);
      await rm(dir,{recursive:true});
    }
  });
}
