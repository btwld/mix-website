# Deployment record

For the current automation contract and activation status, see
[Deployment automation](../deployment-automation.md). The dated rollout notes
below are historical; their unverified/cutover statements describe those releases.

# Staging and review delivery

Updated 2026-11-04. The public branch and exact locked input archives are
published under owner authorization and existing notices. A fresh remote clone
of `70d679c69a7276beeacdc05d9a02363a55b3e413` downloaded the inputs and passed its
clean build and rendered audit. GitHub CI and hosted acceptance are recorded
separately in [verification](verification.md).

The owner-confirmed `bitwild-oss` project (416994480519) is active and billed.
Firebase authentication fails in this VM; the authenticated Mac performs Google
operations without copying credentials. The parent reports `fluttermix` created
in `us-east4`; its first local-source rollout completed and serves reviewed app
SHA `70d679c` at https://fluttermix--bitwild-oss.us-east4.hosted.app. The accidental
empty `my-web-app` backend was deleted; its web app was reused. Backend creation
alone does not establish full hosted acceptance. Provided source identity, all
input digests and the complete noindex rendered audit now pass there; hosted
interactive browser/Safari and returning-browser checks remain open.

## Publish the exact candidate inputs

Publication is complete. The owner authorized moving the recorded existing public
btwld material into public `btwld/mix-website` under existing notices; no new
blanket license was assigned. The prior publication hold is superseded.
[Draft website PR #1](https://github.com/btwld/mix-website/pull/1) preserves the
candidate and verification; protected `main` has not been merged or pushed.

| Release tag | Exact asset filename | Canonical source commit | Website producer commit |
| --- | --- | --- | --- |
| `site-input-mix-previews-23a73c6c0dda` | `mix-previews-23a73c6c0dda.tar.gz` | `btwld/mix-website@23a73c6c0ddad669f2feafa9ede2ba7b7351a4f7` | `23a73c6c0ddad669f2feafa9ede2ba7b7351a4f7` |
| `site-input-naked-ui-docs-99c6da876de4` | `naked-ui-docs-99c6da876de4.tar.gz` | `btwld/remix@99c6da876de43f54d039bdb097fe5c7b74dce709` | `4230ceeed0c0526dbc72769c35cf020b0e803015` |
| `site-input-remix-docs-ba450dc72223` | `remix-docs-ba450dc72223.tar.gz` | `btwld/remix@ba450dc72223d3ebacee0282b989d4ee2823828f` | `4230ceeed0c0526dbc72769c35cf020b0e803015` |

The exact `sources.lock.json` URLs, sizes, SHA-256 and source/producer/toolchain
provenance passed anonymous verification in the VM and on the Mac. Existing
archive bytes were uploaded without rebuild, repin or replacement. GitHub's
release API reports `immutable:false`; exact-byte lock verification rejects
changes, while GitHub-enforced release immutability remains a separate policy.
The policy endpoint returned 403 for this VM's GitHub integration.

Naked UI remains the reachable, **unmerged** head of draft
[Remix PR #381](https://github.com/btwld/remix/pull/381). Merge is not required to
consume this exact snapshot; upstream review remains open. Selecting a different
commit after merge/squash requires a new archive and reviewed pin. Mix source and
both website producer commits are reachable through the published website branch.

To reverify the published bytes without using an archive cache:

```sh
pnpm site-inputs:remote
```

Do not rerun release-creation commands or replace these assets. Future producer
runs record their actual producer SHA, publish new coordinates and advance the
lock only after anonymous verification. Retain prior assets for rollback.

## Mac local-source rollout and reviewed identity

Tracked `firebase.json` selects backend `fluttermix` with `rootDir: "."`;
`.firebaserc` defaults to `bitwild-oss`. The source ignore list excludes Git,
dependencies, local evidence, archive caches, generated snapshots/builds and
test reports. Prebuild must download verified inputs in the hosted builder.
This schema was checked against the official
[Firebase CLI 15.34.2 configuration schema](https://github.com/firebase/firebase-tools/blob/v15.34.2/schema/firebase-config.json).

The completed first Mac upload is based on reviewed application SHA
`70d679c69a7276beeacdc05d9a02363a55b3e413`. Since `.git` is excluded, the
parent's **local deployment overlay** adds
`SITE_COMMIT=70d679c69a7276beeacdc05d9a02363a55b3e413` at build/runtime.
That overlay is not part of the reviewed `apphosting.yaml`, which remains
unchanged. Record the source SHA, overlay, exact inputs and actual rollout ID
together. An identity supplied to an archive is a provenance assertion, not
proof that an arbitrary local tree matches Git; check the uploaded diff and
allow only the documented deployment settings. Future uploads must use the
actual reviewed candidate SHA, rather than inheriting this first-rollout value.

The first upload therefore cannot be described as an automatic protected-main
deployment or a byte-identical unmodified Git checkout. Inspect hosted
`/__site.json` for the expected source SHA, lock hash and all input digests.
Hosted verification must separately establish noindex/canonical behavior,
WASM/assets, search, examples and catalog readiness before acceptance.

## First App Hosting staging rollout

1. Input publication and clean local remote-input build are complete. Continue
   PR #1 CI to an actual result; no main-branch CI success is implied.
2. The parent completed the first Mac local-source rollout to
   `fluttermix` / `bitwild-oss` / `us-east4`. Its generated hostname, provided
   source identity/input digests and complete noindex rendered audit pass.
   Retain its build/runtime logs and rollout ID; interactive acceptance is open.
   Do not recreate a backend or alter IAM to work around VM authentication.
3. Preserve the managed Next adapter and pinned Node/pnpm versions; do not
   override `scripts.buildCommand`. Next 16.4.1 has local adapter evidence, while
   the last checked support table lists Next 15.2 as active. Actual hosted
   build/runtime compatibility remains the gate.
4. Check every rendered route, metadata, heading and image on the generated URL;
   run Chromium/WebKit and current Safari, WASM MIME/cache/noindex checks and
   returning-browser tests. Record hosted URL, rollout ID, source SHA, overlay
   and exact input digests. Backend creation or build completion alone is
   insufficient.
5. Set the staging origin to the actual generated hostname through a reviewed
   environment setting, retain noindex, billing alerts and bounded scaling.
   The prepared `apphosting.staging.yaml` is not proof it was selected by the
   first local-source deployment. The owner chose apex `fluttermix.com` canonical
   and a `www` redirect to `https://fluttermix.com`. The parent added domain
   verification TXT/certificate CNAME records; apex/www traffic still points to
   Vercel. Preserve MX/TXT and do not switch traffic before the cutover gate.
6. After review and authorized protected-main integration, configure the intended
   GitHub connection and native automatic rollout, then prove a follow-up main
   change and App Hosting check. A local-source rollout does not establish this.
   Commit-specific rollout commands apply to a backend with the appropriate
   source integration; do not silently substitute a local upload.

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

The owner selected canonical `https://fluttermix.com`; redirect `www` to that apex at cutover. Preserve MX/TXT records and record
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
are prepared and tested locally; no preview site, WIF binding or live channel is
claimed. The successful remote-input build is local evidence, distinct from
GitHub CI and the separately recorded Mac-initiated hosted rollout.

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
