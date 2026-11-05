# Flutter Mix consolidation and deployment

The checklist below preserves the 2026-11-04 migration pilot and its gates.
Historical pilot logs and browser evidence remain outside the repository. The pilot began at `030cf83aa2c598a2b40ebedadbc96cb44780bee4`; those eleven commits are preserved.

One Next.js/Fumadocs application serves `/mix`, `/remix`, and `/naked-ui`, with project navigation, labeled search and isolated Flutter assets. Mix content and preview source belong here. Remix and Naked UI documentation belong in `btwld/remix`; this app consumes exact commits and verified archives. Package release workflows stay independent.

## Verified delivery status on 2026-11-05

[fluttermix.com](https://fluttermix.com) is live and indexed on Firebase App
Hosting, backend `fluttermix` in `bitwild-oss` / `us-east4`. The `www`
hostname redirects to the apex and preserves paths and query strings. The
separate production project described in the pilot was not used. The dark-only
release `de27d79` passed the local and public 120-route rendered audit. Its
[GitHub CI run](https://github.com/btwld/mix-website/actions/runs/42034857950)
finished cancelled after the build and rendered audit. Native automatic
rollouts and live PR preview activation still require delivery work.

## Historical delivery topology

| Target | Deployment | Trigger and gate |
| --- | --- | --- |
| PR | Firebase Hosting preview channel per trusted same-repository PR in `bitwild-oss` (prepared, not live) | Credential-free CI validates server and static representations. A protected-default-branch workflow verifies numeric repository IDs, successful run/artifact, open PR/current head and inputs before an OIDC-authenticated release. Forks receive checks. |
| Staging | Firebase App Hosting in `bitwild-oss` | Protected `main`, native automatic rollouts after the first hosted pilot succeeds. Noindex everywhere. |
| Production | Separate Firebase project and App Hosting backend | Promote the exact staging-verified SHA, reject superseded candidates, verify generated hostname; domain cutover is a separate final gate. |

`bitwild-oss` (416994480519, Bitwild OSS) is ACTIVE with billing enabled and Firebase/App Hosting APIs enabled. Authentication fails in this cloud VM; the parent uses the authenticated Mac without copying tokens. The initial empty backend list is historical: the parent has now created `fluttermix` in `us-east4` and completed its first local-source rollout at reviewed app SHA `70d679c`. The accidental empty `my-web-app` backend was deleted and its web app reused. PR previews and staging are distinct deployment paths; hosted identity and the complete noindex rendered audit pass, while interactive browser/Safari acceptance remains open.

## Historical checklist

- [x] Preserve and inspect pilot commits, worktree and source instructions.
- [x] Recount pinned source trees: 29 Mix MDX pages (the old inventory incorrectly reported 33), 53 Remix MDX pages, 18 archived Naked UI pages. Inventory preserves 235 legacy URL rows, 151 historical paths and five additional non-page pattern groups. Active Naked UI adds five previously undocumented widget pages.
- [x] Reconcile deployment addendum; replace machine-specific planning references with this durable plan.
- [x] Import remaining 27 Mix pages, images and preview authoring source; validate all 30 Mix preview references against 74 manifest entries.
- [x] Stage all 53 pinned Remix pages with real catalog/source panels and assets; preserve dashboard reachability.
- [x] Prepare isolated `btwld/remix` branch with canonical Naked UI docs, update archived examples for active APIs and document missing widgets; preserve existing docs/build/release contracts.
- [x] Consume Naked UI from a pinned verified upstream input; remove temporary website-owned copy.
- [x] Normalize navigation, metadata, MDX, cross-links, heading anchors and project-labeled search. Classify every inventoried URL and historical path with a destination or explicit reason.
- [x] Account for legacy Pages worker retirement and catalog fragment compatibility; prepare same-origin redirects without activating old-origin cutover.
- [x] Prepare repeatable producers, verified input fetching, an uncached remote-input gate, bounded trusted OIDC preview deploy/update/cleanup, App Hosting staging configuration and documented promotion.
- [x] Add production sitemap and verify rendered canonical/OG metadata on all 120 routes, including fallback indexes; noindex remains independent.
- [x] Explicitly account for every Naked Dart fence: 39 analyzed/frontend-compiled examples and 26 reasoned API references pinned to active source bytes (the reviewed 25 plus a restored Slider constructor reference).
- [x] Reconcile inventory by exact page/route sets, validate rendered links/anchors/images and complete exported search coverage.
- [x] Verify returning-browser digest isolation, catalog revalidation and an open tab across deployment, including source/snippet response failures.
- [x] Finish final integration checks after the last content pin: production and noindex rendered audits, source/inventory parity and focused browser checks. Historical browser evidence remains snapshot-scoped; fresh remote-input build evidence is recorded separately.
- [x] Fingerprint every authored Mix Flutter build input and pin the rebuilt canonical archive; reject registry/helper/asset/dependency/recipe drift, additions and deletions.
- [x] Complete the fresh desktop/mobile and dev/production runtime review; retain full-size after screenshots and table-scroll interaction evidence.
- [x] Verify a genuinely recompiled A/B demo and matching displayed source against the final test source; coordinate the page-global engine before accepting a changed bundle.
- [x] Reproduce and close the mounted open-source prop-update race with render-time request identity gating; verify code-only and live-preview fixtures plus focused preview smoke checks.
- [x] Distinguish cloud VM authentication failure from successful Mac access and record the DNS baseline and subsequent parent-initiated backend creation. Only verification/certificate records were added by the parent; no apex/www traffic switch occurred.
- [x] Record owner authorization to publish the existing public btwld Mix material under existing notices, without a new blanket license; retain all upstream provenance/notices.
- [x] Publish the three exact locked input archives and verify anonymous download, size, digest and provenance on VM and Mac.
- [x] Build fresh remote clone `70d679c` without restored input archives/generated outputs; pass 26 unit tests, typecheck, lint, source/inventory audits and the 120-route rendered audit with clean build identity.
- [ ] Complete PR #1 GitHub CI; record actual run conclusion separately from the successful clean local remote-input build.
- [x] Track local-source Firebase config for `fluttermix` / `bitwild-oss`; document the first Mac upload's `SITE_COMMIT` overlay separately from app SHA `70d679c`.
- [x] Complete the first Mac local-source rollout at `70d679c`; verify provided identity, lock/all input digests and the complete noindex rendered audit on the generated hostname.
- [ ] Complete hosted interactive browser/Safari and returning-browser checks; record rollout ID/logs and prove native protected-main rollout separately.
- [ ] Bootstrap trusted preview workflow definitions on reviewed default branch and configure preview-only WIF/Hosting site; no cloud resources or identities have been provisioned here.
- [ ] Prove two independent PR preview URLs, update/stale-run/fork/cleanup cases.
- [ ] Promote exact staging SHA to a separate production project and verify its generated hostname.
- [ ] Final owner checkpoint: production project and DNS traffic cutover (canonical apex selected). Preserve MX/TXT, prior origin, known-good rollout and DNS rollback.

## Historical delivery handoff

The prior candidate `487f11c2dec18de5faee163935b939ab03737d2d` and its evidence are preserved. The final runtime fix is `2c82828b3468608ba9d29eee273ecf54a4c4670d`; published candidate `70d679c69a7276beeacdc05d9a02363a55b3e413` adds its verification record. Branch `conductor/flutter-mix-website-migration` and [draft website PR #1](https://github.com/btwld/mix-website/pull/1) are public. Publication and clean remote-input build are complete; first hosted identity/rendered proof passes, while full hosted interactive acceptance remains open. Public `main` remains `971cb1ac4bbb1724c6fde171470b44fce69a9e60`. See [the publication record](deployment.md#publish-the-exact-candidate-inputs) for exact archives and source/producer commits. Naked UI still pins the unmerged source commit in Remix PR #381; upstream merge is not technically required and must not silently change the pin.

The owner chose canonical `https://fluttermix.com`, with `www` redirecting to the apex. The parent added Namecheap verification TXT/certificate CNAME records while preserving Vercel traffic records and email forwarding. The captured traffic baseline is apex A `76.76.21.21`, `www` CNAME `cname.vercel-dns.com`, Namecheap nameservers, and intact MX/SPF email forwarding. Preserve and recheck the full zone before a separately authorized cutover. Only verification/certificate records were added by the parent; no apex/www traffic switch occurred.

## Source and publication boundary

The 2026-11-03 inventory pins `btwld/website@509c4a9ddb698b86f26a51291fa6540087461614`, `btwld/remix@ba450dc72223d3ebacee0282b989d4ee2823828f`, and archived `btwld/naked_ui@90f8560c` (full hash in provenance). Refreshing source pins must be explicit; do not silently replace a reviewed snapshot with today's main.

Remix is BSD-3-Clause (Concepta); archived Naked UI is BSD-3-Clause (Leo Farias). Retain their full notices in copied source and distributed inputs. The website source has no root license. The owner explicitly authorized moving the recorded existing public btwld MDX, React preview code, Dart package and images to public `btwld/mix-website` under existing notices; no blanket license is assigned. This supersedes the earlier publication hold. Provenance and scope are recorded in `notices.md`; unrelated nonpublic material is outside that authorization.

## Historical verification and rollout gates

The historical pilot reported 21/21 Chromium and 21/21 WebKit tests and a local Firebase adapter pass. These are local evidence, not a live deployment. The release URLs in the pilot lock were backed by workspace cache, not proven published assets. A cache-only build cannot close the artifact-availability gate.

Official docs retrieved 2026-11-04 still state newer framework versions are preview until designated active. The pilot uses Next.js 16 and Node 24. Keep the adapter (`scripts.buildCommand` would disable it), test a real hosted build and runtime before claiming support. If it fails, fix the incompatibility or present a concrete container deployment proposal; do not silently change App Hosting staging/production.

Validate direct loads, real 404s, WASM MIME, noindex pages/assets, keyboard interaction, one Mix engine across multiple views, exact snippet bytes, Remix iframe readiness, search labels and all referenced images/headings. Keep failure traces outside commits. Service workers at old origins must remain reachable: forwarding their script URL can prevent retirement.

Production cutover remains separate from implementation. Do not change DNS, delete old deployments, broaden organization access or merge protected main. Record previous apex/www, MX and TXT records, validate generated production hostname, bind/migrate the domain, test old/new deep links and rehearse both rollout and DNS rollback. Only production at cutover enables indexing. Old major-version APIs require explicit archival treatment, not an assertion that current API docs are equivalent.

## References (checked 2026-11-04)

- [Framework support](https://firebase.google.com/docs/app-hosting/frameworks-tooling)
- [App Hosting configuration](https://firebase.google.com/docs/app-hosting/configure)
- [Environment configuration](https://firebase.google.com/docs/app-hosting/multiple-environments)
- [Commit rollouts and rollback](https://firebase.google.com/docs/app-hosting/rollouts)
- [Domain migration](https://firebase.google.com/docs/app-hosting/custom-domain)
- [Cloud Run deployments by digest](https://docs.cloud.google.com/run/docs/deploying)
- [GitHub OIDC federation and repository ID conditions](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines)
- [GitHub Actions security](https://docs.github.com/en/actions/reference/security/secure-use)

## Independent review follow-through

The read-only review at `53fd022` recommended keeping the single site and refining ownership, verification and delivery. Confirmed gates were producer ownership, obsolete pilot assertions, explicit Naked fence checks, unavailable inputs, sitemap/rendered canonicals and exact inventories. The content fixes, published-input verification and clean remote-input build now pass. Search already exports JSON at build time. Hosted delivery remains open; `decisions.md` records the rationale.

The canonical Naked UI source is reviewable in [Remix draft PR #381](https://github.com/btwld/remix/pull/381). It changes docs, documentation tooling and a README only; package implementation/release contracts are unchanged. The active package at refreshed upstream main is naked_ui 1.5.0, superseding the pilot’s 1.4.0 comparison.

The static PR representation has passed a full Firebase Hosting emulator rendered audit and Chromium 25/25 and WebKit 25/25; it preserves server redirects, directory indexes, asset headers, 404s, search and real Flutter demos. This evidence justifies preparing Hosting preview channels instead of the original Cloud Run proposal. Live two-PR deployment/update/cleanup remains an acceptance gate. See `deployment.md` and `verification.md` for precise limits.
