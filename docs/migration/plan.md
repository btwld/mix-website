# Flutter Mix consolidation and deployment

Updated 2026-11-04. This is the authoritative checklist. Historical pilot logs and browser evidence remain outside the repository. Work continues from pilot commit `030cf83aa2c598a2b40ebedadbc96cb44780bee4`; those eleven commits are preserved.

One Next.js/Fumadocs application serves `/mix`, `/remix`, and `/naked-ui`, with project navigation, labeled search and isolated Flutter assets. Mix content and preview source belong here. Remix and Naked UI documentation belong in `btwld/remix`; this app consumes exact commits and verified archives. Package release workflows stay independent.

## Delivery topology

| Target | Deployment | Trigger and gate |
| --- | --- | --- |
| PR | Firebase Hosting preview channel per trusted same-repository PR in `bitwild-oss` (prepared, not live) | Credential-free CI validates server and static representations. A protected-default-branch workflow verifies numeric repository IDs, successful run/artifact, open PR/current head and inputs before an OIDC-authenticated release. Forks receive checks. |
| Staging | Firebase App Hosting in `bitwild-oss` | Protected `main`, native automatic rollouts after the first hosted pilot succeeds. Noindex everywhere. |
| Production | Separate Firebase project and App Hosting backend | Promote the exact staging-verified SHA, reject superseded candidates, verify generated hostname; domain cutover is a separate final gate. |

`bitwild-oss` (416994480519, Bitwild OSS) is ACTIVE with billing enabled and Firebase/App Hosting APIs enabled, per the owner's latest verified state. The prior “project/billing pending” entries are stale. Last backend count: zero; no hosted rollout is established by local tests. PR previews and staging are distinct deployment paths. Firebase CLI backend-list verification on 2026-11-04 failed authentication in this VM; no live provisioning is implied.

## Checklist

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
- [x] Finish final integration checks after the last content pin: production and noindex rendered audits, source/inventory parity and focused browser checks. Local builds and browser results are cache-backed; clean remote CI remains open.
- [ ] Resolve redistribution terms for the imported Mix MDX, preview code and images; the other upstream notices are accounted for.
- [ ] Publish approved input archives and verify anonymous download/digests; prove clean CI without workspace cache.
- [ ] Prove App Hosting staging on its generated hostname, then native protected-main rollout; hosted Safari and returning-browser checks.
- [ ] Bootstrap trusted preview workflow definitions on reviewed default branch and configure preview-only WIF/Hosting site; no cloud resources or identities have been provisioned here.
- [ ] Prove two independent PR preview URLs, update/stale-run/fork/cleanup cases.
- [ ] Promote exact staging SHA to a separate production project and verify its generated hostname.
- [ ] Final owner checkpoint: production project, canonical apex/www and DNS cutover. Preserve MX/TXT, prior origin, known-good rollout and DNS rollback.

## Source and publication boundary

The 2026-11-03 inventory pins `btwld/website@509c4a9ddb698b86f26a51291fa6540087461614`, `btwld/remix@ba450dc72223d3ebacee0282b989d4ee2823828f`, and archived `btwld/naked_ui@90f8560c` (full hash in provenance). Refreshing source pins must be explicit; do not silently replace a reviewed snapshot with today's main.

Remix is BSD-3-Clause (Concepta); archived Naked UI is BSD-3-Clause (Leo Farias). Retain their full notices in copied source and distributed inputs. The website source has no root license; public availability alone does not grant a license. Migration and local preparation are authorized. Narrow publication review to the copied website MDX, React preview code, Dart package and images; do not apply a guessed blanket license. Record provenance and remaining approval in `notices.md`. This does not block local content migration or private validation.

## Verification and rollout gates

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

The read-only review at `53fd022` recommended keeping the single site and refining ownership, verification and delivery. Confirmed gates: make the local Mix source drive artifact production; replace obsolete pilot fallback assertions; explicitly verify every Naked Dart fence; keep remote 404s visible; verify production sitemap and rendered canonicals; reconcile actual page/URL counts. Search already exports JSON at build time, so it does not require a dynamic server. Local implementation checks now pass those content gates; remote availability and hosted delivery remain open. `decisions.md` records the rationale.

The canonical Naked UI source is reviewable in [Remix draft PR #381](https://github.com/btwld/remix/pull/381). It changes docs, documentation tooling and a README only; package implementation/release contracts are unchanged. The active package at refreshed upstream main is naked_ui 1.5.0, superseding the pilot’s 1.4.0 comparison.

The static PR representation has passed a full Firebase Hosting emulator rendered audit and Chromium 25/25 and WebKit 25/25; it preserves server redirects, directory indexes, asset headers, 404s, search and real Flutter demos. This evidence justifies preparing Hosting preview channels instead of the original Cloud Run proposal. Live two-PR deployment/update/cleanup remains an acceptance gate. See `deployment.md` and `verification.md` for precise limits.
