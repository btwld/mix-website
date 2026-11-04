# Staging and review delivery

Prepared configuration is not a live deployment. As of 2026-11-04, the Firebase
CLI fails authentication in this cloud VM, but the parent coordinator's Mac
successfully ran `firebase apphosting:backends:list --project bitwild-oss --json`
with `result: []`. Google access exists there; no backend exists. Use that
existing Mac identity without copying tokens into chat, this VM or the repo.
The locked GitHub input assets are not yet available remotely. The
owner-confirmed `bitwild-oss` project is active and billed. Do not recreate it
or broaden organization access.

## Publish the exact candidate inputs

These are instructions only, gated on resolving the Mix publication terms in
`notices.md`. No source push, release publication, merge or deployment was run
for this handoff. The validated code candidate remains
`487f11c2dec18de5faee163935b939ab03737d2d`; subsequent handoff changes are docs only.

| Release tag | Exact asset filename | Canonical source commit | Website producer commit |
| --- | --- | --- | --- |
| `site-input-mix-previews-07f167db8124` | `mix-previews-07f167db8124.tar.gz` | `btwld/mix-website@07f167db8124ce0870ad5736b54512506c0f0df2` | `07f167db8124ce0870ad5736b54512506c0f0df2` |
| `site-input-naked-ui-docs-99c6da876de4` | `naked-ui-docs-99c6da876de4.tar.gz` | `btwld/remix@99c6da876de43f54d039bdb097fe5c7b74dce709` | `4230ceeed0c0526dbc72769c35cf020b0e803015` |
| `site-input-remix-docs-ba450dc72223` | `remix-docs-ba450dc72223.tar.gz` | `btwld/remix@ba450dc72223d3ebacee0282b989d4ee2823828f` | `4230ceeed0c0526dbc72769c35cf020b0e803015` |

Naked UI's source is the **unmerged** head of draft
[Remix PR #381](https://github.com/btwld/remix/pull/381), confirmed open at this
handoff. It is already published/reachable in that repository. A merge is not
technically necessary to publish/build the pinned snapshot; its canonical source
changes still need upstream review. The Remix docs/catalog source commit is also
already reachable upstream. The Mix source and both producer commits become
reachable when the website branch is pushed. No protected-main merge is needed
for this publication step.

For the smallest handoff, publish the **existing verified bytes**, preserving
`sources.lock.json`. From this workspace, after publication terms are resolved:

```sh
git push -u origin conductor/flutter-mix-website-migration

# All three intended tags must be absent. Stop if this prints any matching tag;
# also stop on a network/authentication error before creating any release.
git ls-remote --tags origin 'refs/tags/site-input-mix-previews-07f167db8124' 'refs/tags/site-input-naked-ui-docs-99c6da876de4' 'refs/tags/site-input-remix-docs-ba450dc72223'

# Stage the exact locked cache bytes under their required release filenames.
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
const lock = JSON.parse(await readFile('sources.lock.json', 'utf8'));
await mkdir('.site-inputs/publish', { recursive: true });
for (const entry of Object.values(lock.inputs)) {
  const source = `.site-inputs/cache/${entry.artifact.sha256}.tar.gz`;
  const bytes = await readFile(source);
  assert.equal(bytes.length, entry.artifact.size);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.artifact.sha256);
  const filename = new URL(entry.artifact.url).pathname.split('/').at(-1);
  await copyFile(source, `.site-inputs/publish/${filename}`);
}
NODE

gh release create site-input-mix-previews-07f167db8124 .site-inputs/publish/mix-previews-07f167db8124.tar.gz --repo btwld/mix-website --target 07f167db8124ce0870ad5736b54512506c0f0df2 --latest=false --title 'Mix previews @ 07f167db8124' --notes 'Exact locked candidate archive; source and producer btwld/mix-website@07f167db8124ce0870ad5736b54512506c0f0df2.'
gh release create site-input-naked-ui-docs-99c6da876de4 .site-inputs/publish/naked-ui-docs-99c6da876de4.tar.gz --repo btwld/mix-website --target 4230ceeed0c0526dbc72769c35cf020b0e803015 --latest=false --title 'Naked UI docs @ 99c6da876de4' --notes 'Exact locked candidate archive; source btwld/remix@99c6da876de43f54d039bdb097fe5c7b74dce709, producer btwld/mix-website@4230ceeed0c0526dbc72769c35cf020b0e803015.'
gh release create site-input-remix-docs-ba450dc72223 .site-inputs/publish/remix-docs-ba450dc72223.tar.gz --repo btwld/mix-website --target 4230ceeed0c0526dbc72769c35cf020b0e803015 --latest=false --title 'Remix docs @ ba450dc72223' --notes 'Exact locked candidate archive; source btwld/remix@ba450dc72223d3ebacee0282b989d4ee2823828f, producer btwld/mix-website@4230ceeed0c0526dbc72769c35cf020b0e803015.'

# Anonymous remote download, size, digest and provenance verification; no cache.
pnpm site-inputs:remote
```

Do not reuse an existing tag or replace an asset. `gh release create` rejects an
existing release, but can reuse a tag without a release; the tag precheck above
is therefore required. If anything already exists, stop and investigate.
Rebuilding through today's
workflow records today's producer SHA and may change the archive digest even
when payload bytes match; that requires a reviewed lock update, never silently
uploading new bytes under these locked coordinates. Merging/squashing PR #381
and selecting a different source SHA likewise requires rebuilding and repinning.

After anonymous verification, open/review the website PR and prove clean CI
without restored archives/generated outputs. The workflow definitions must be
reviewed onto the default branch before relying on dispatch or privileged PR
preview automation. Hosted App Hosting staging proof is the next deployment
gate, using the Mac identity; these publication commands do not deploy it.

## First App Hosting staging rollout

1. Resolve the publication terms recorded in `notices.md`; publish the exact
   source commits and producer archives. `pnpm site-inputs:remote` must succeed
   without using a cache. A lock URL returning 404 is a failed delivery gate.
2. Land workflow definitions on protected main through review. The application
   branch remains unmerged until its checks are green; do not bypass protection.
3. Use the existing authenticated Mac identity and recheck
   `firebase apphosting:backends:list --project bitwild-oss --json`. Create the staging
   backend in a supported region (start with `us-central1` after checking current
   availability), connect only `btwld/mix-website`, and select the app root at its
   package manifest. Set environment name `staging`, replace the staging origin
   placeholder with its generated hostname, and retain noindex in build/runtime.
4. Use the managed Next adapter and pinned Node/pnpm versions. Do not override
   `scripts.buildCommand`. Trigger the reviewed SHA with
   `firebase apphosting:rollouts:create BACKEND --git-commit SHA --project bitwild-oss`.
   Official support still lists Next 15.2 as active; Next 16.4 must pass a hosted
   build and runtime gate. A local adapter pass does not establish support.
5. Inspect hosted build/runtime logs; audit every rendered route, canonical,
   image and heading. Run Chromium/WebKit and latest supported Safari against
   the generated URL, check WASM MIME/cache headers and returning browsers.
   Record URL, full source SHA, input digests and rollout ID in the staging
   GitHub environment. Only then enable native automatic rollouts on protected
   main and verify one follow-up rollout/check.
6. Set project billing alerts and retain the bounded scaling in
   `apphosting.staging.yaml`. No custom domain is attached at this stage.

## Review preview options

The app exports search JSON and performs queries in the browser. A static export
can serve the same docs, compiled Flutter runtime and catalog. A Firebase Hosting
preview channel can therefore be materially simpler than a Cloud Run container:
no per-PR runtime service, registry or runtime identity. It still needs proven
headers, exact redirects, directory indexes, real 404s, search and browser behavior.
`pnpm build:preview` prepares that representation and Hosting configuration.
Local HTTP/browser equivalence now passes in Chromium and WebKit; the prepared
channel workflow still requires live acceptance.
App Hosting remains the requested staging and production path.

If hosted static parity fails, use the same verified Next build in a bounded Cloud Run
container per PR. Restrict that implementation to build, deploy, update and
cleanup; no future routing layers or unrelated product backends are needed.

For either mechanism, CI builds without cloud credentials. A workflow sourced
from the protected default branch checks the successful run, numeric owner/repo
IDs, same-repo origin, open PR/current head and matching artifact identity before
OIDC authentication. The privileged job treats the downloaded build as data:
never execute PR source, build scripts or PR-supplied deploy configuration with
cloud credentials. Forks get checks; a maintainer may move reviewed code onto a
trusted branch. Serialize deploy/update/cleanup per PR, reject stale runs before
changing traffic, verify the served source SHA, and publish one GitHub deployment
with its URL. Expire preview resources and remove them on close; scheduled
cleanup must preserve channels/images still used by open PRs or rollback.

## Production promotion and rollback

Production uses a separate Firebase project selected by the owner when staging
passes. Use a separate GitHub environment/identity, record the staging-verified
SHA/input digests, reject superseded candidates and trigger that exact commit.
Verify the production generated hostname before domain binding. Leave indexing
disabled until the separate cutover checkpoint. `SITE_INDEXING=index` and the
canonical production origin must be set at build and runtime; prerendered pages
require a rebuild. The production sitemap lists actual site routes only.

The owner chooses apex versus www at cutover. Preserve MX/TXT records and record
prior DNS, original-origin redirects and known-good App Hosting rollout IDs.
Keep legacy origins and their worker-retirement scripts available. Roll back
application regressions to the known-good rollout; restore prior DNS/serving
rules if domain routing fails. No DNS or legacy deletion is authorized as an
ordinary implementation step.

## Prepared preview automation

The local static export passes the Hosting emulator's full rendered audit and
Chromium 25/25, including Flutter runtime, catalog, search, redirects, true 404s,
WASM/cache headers and worker scopes. This supports the smaller Hosting-channel
implementation for PRs. App Hosting remains staging/production. The workflows
are prepared and tested locally; no preview site, WIF binding, remote build or
live channel is claimed.

`.github/workflows/ci.yml` checks out the actual PR head and runs without cloud
credentials. It verifies remote input availability before using any archive
cache, checks server behavior and production metadata, then validates a static
export in the Hosting emulator. Only a completely successful PR run uploads
`site-preview-<full-head-sha>`.

`.github/workflows/preview.yml` is triggered through `workflow_run`, using code
from protected `main`. It checks numeric repository `1444465253`, owner
`83911646`, workflow identity, same-repo origin, successful completed run, open
PR/current head and the associated artifact. The privileged job installs no PR
dependencies and executes no PR code or configuration. It checks regular-file
paths, bounded artifact size, clean source identity, lock digest and input pins.
Its trusted Hosting policy supplies noindex, headers and redirects.

The REST deploy separates upload/finalization from traffic: after all uploads it
checks the current PR head again, then releases only to `pr-<number>`. It verifies
the public `__site.json` SHA/noindex before recording a transient GitHub
deployment URL. A PR changing during release/verification restores the previous
passing version. Deploy and cleanup serialize under one per-PR concurrency key.
The lifecycle unit tests simulate success, stale-before-release rejection,
stale-after-release rollback and a reopened-PR cleanup race. These tests do not
replace live API acceptance.

Enable only after the first real App Hosting staging proof:

1. Review/land trusted workflow/script definitions on the default branch. A
   first application PR cannot trigger a workflow absent from that branch.
2. Create a **dedicated preview-only Hosting site**, named
   `mix-website-previews` or `mix-website-previews-<suffix>`, in `bitwild-oss`.
   Do not attach a production domain or reuse another app's Hosting site.
3. Configure GitHub repository variables `PREVIEW_HOSTING_SITE`,
   `PREVIEW_WORKLOAD_IDENTITY_PROVIDER`, `PREVIEW_DEPLOY_SERVICE_ACCOUNT`, and
   the `preview` environment. Use a preview-only service account with Hosting
   deployment permissions in this nonproduction project. It needs no App
   Hosting administration, organization access, application secrets or runtime
   identity. Prefer an appropriate custom role after checking the current
   Hosting permission model; do not grant project Owner/Editor.
4. Restrict WIF by immutable numeric repository/owner IDs **and** default-branch
   workflow identity. Map `google.subject=assertion.sub` and the repository ID,
   owner ID and `workflow_ref` attributes. The provider condition must require
   repository ID `1444465253`, owner ID `83911646`, `ref=refs/heads/main`, and
   `workflow_ref` equal to one of:
   `btwld/mix-website/.github/workflows/preview.yml@refs/heads/main` or
   `btwld/mix-website/.github/workflows/preview-cleanup.yml@refs/heads/main`.
   Restrict events to `workflow_run`, `pull_request_target`, `schedule` and
   `workflow_dispatch`. Bind only this provider's matching repository principal
   set to the preview deploy account. No long-lived service-account key is used.
5. Prove two independent PR channels, same-URL updates, failed/stale-run
   rejection, fork checks without credentials, close/merge cleanup and a
   reopened-PR race. Check hosted headers and served SHA before marking this
   workflow delivered.

`preview-cleanup.yml` runs on close and daily from default-branch code, checks
fresh PR state and removes only closed `pr-N` channels on the dedicated site.
It preserves open PRs. Seven-day channel expiration bounds orphans; Firebase
schedules expired channels/releases/unshared versions for deletion within 24
hours. Updates refresh expiration; an inactive open PR needs a new passing run
if its channel expires. Keep three releases per active channel for immediate
preview rollback. Production rollbacks use App Hosting releases independently.

Official REST/deletion references checked 2026-11-04:
[version creation](https://firebase.google.com/docs/reference/hosting/rest/v1beta1/sites.versions/create),
[hashed uploads](https://firebase.google.com/docs/reference/hosting/rest/v1beta1/sites.versions/populateFiles),
[channel releases](https://firebase.google.com/docs/reference/hosting/rest/v1beta1/sites.channels.releases/create),
[channel lifetime](https://firebase.google.com/docs/hosting/manage-hosting-resources).
