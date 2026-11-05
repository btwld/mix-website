# Deployment automation

## Activation status — 2026-11-05

The production website is live on Firebase App Hosting. Migration PR #1 merged
as `e3550901d3ef191149f9f7d00cc77a3b85ef3d54` after full CI passed, activating
the workflows on main. The first automatic rollout and PR preview acceptance
checks are in progress; end-to-end deployment success is not yet claimed.
Cloud identities, GitHub variables/environments, the preview site and required
main-branch CI protection are now configured with owner approval. Production deployment remains gated on successful CI for the current main commit. No service-account keys
are used. Do not interpret a successful manual release as proof of automation.

## Production

`production.yml` reacts to a successful `CI` run caused by a push to `main`.
The deployment script independently checks the repository and owner IDs,
workflow ID/path, event, branch, conclusion and current main SHA. It archives
only committed source, injects the exact SHA and production indexing into a
temporary copy, then uploads it to the existing App Hosting source bucket.
Firebase builds with its Next.js adapter. Immediately before rollout the script
rechecks main; after rollout it verifies the public source SHA and input-lock
hash. A GitHub deployment records success only after that verification.

Production jobs are serialized and never canceled mid-rollout. A superseded CI
run fails closed. Rerun a successful current-main CI run to retry a deployment;
rolling back intentionally requires a revert PR and passing CI. Previous Firebase
rollouts remain available for emergency operator recovery.

## Review URLs

`preview.yml` uses a successful same-repository PR CI artifact as opaque static
data. It runs only trusted default-branch deployment code, never PR commands with
cloud credentials. It checks the artifact identity/input digests and current PR
head before release. Each PR receives its own `pr-N` channel on the dedicated
`mix-website-previews` Hosting site, a noindex URL and GitHub deployment status.
Fork PRs do not receive privileged previews. Closed PRs are removed by
`preview-cleanup.yml`; the daily sweep also cleans stale channels.

## Required identities and settings

Project: `bitwild-oss` (416994480519). Production backend: `fluttermix`,
`us-east4`. Production URL: https://fluttermix.com. Source bucket:
`firebaseapphosting-sources-416994480519-us-east4`.

The configured service accounts are `mix-preview-deploy@bitwild-oss.iam.gserviceaccount.com`
and `mix-production-deploy@bitwild-oss.iam.gserviceaccount.com`. OIDC providers
`preview` and `production` belong to pool `mix-website` in project 416994480519.
Each service account is bound to its **exact environment subject**, not a shared
repository-wide principal set. Providers must check numeric repository ID
1444465253, owner ID 83911646, environment subject, and allowed workflow refs
ending in `@refs/heads/main`. This repository uses immutable OIDC subjects:
`repo:btwld@83911646/mix-website@1444465253:environment:preview` and
`repo:btwld@83911646/mix-website@1444465253:environment:production`. Read the
repository OIDC API `sub_claim_prefix` when configuring a replacement; do not
assume the older name-only subject format. Production permits only `production.yml`; preview
permits only `preview.yml` and `preview-cleanup.yml`.

GitHub environments `preview` and `production` allow only branch `main`. Repository
variables: `PREVIEW_WORKLOAD_IDENTITY_PROVIDER`, `PREVIEW_DEPLOY_SERVICE_ACCOUNT`,
`PREVIEW_HOSTING_SITE`, `PRODUCTION_WORKLOAD_IDENTITY_PROVIDER`, and
`PRODUCTION_DEPLOY_SERVICE_ACCOUNT`.

The production custom role needs backend get, builds create/get, rollouts
create/get, operations get, and project get. Grant storage objectCreator only on
the source bucket, and serviceAccountUser only on the existing App Hosting runtime
account if required by the API.

Firebase documents that Hosting does not support custom roles. Preview activation
therefore requires the predefined Hosting Admin role at project scope (broader
than one preview site), or a separate preview-only Firebase project. This grant
was explicitly approved by the owner on 2026-11-05 and configured for the
preview service account. Hosting and App Hosting are different services; the
preview identity must receive no App Hosting deployment permission.

Protect main with the required `site` CI check, no force pushes or deletions, and
PR-based changes. Activation acceptance requires an actual successful main
rollout, a same-repository PR preview with verified identity, and channel cleanup
on PR closure. None of these should be marked complete from configuration alone.

References: [Firebase source deployment](https://firebase.google.com/docs/app-hosting/alt-deploy),
[Firebase Hosting permissions](https://firebase.google.com/docs/projects/iam/permissions).
