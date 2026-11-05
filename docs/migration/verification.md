# Verification and delivery record

Recorded 2026-11-04. This is a published implementation candidate; the first
Mac-initiated App Hosting rollout now serves the reviewed candidate and passes
identity/input and noindex rendered checks. Hosted interactive acceptance remains open.
The [plan](plan.md) is the single status checklist; this record gives
its evidence and limits. Raw logs, failure traces, archives and screenshots
remain outside tracked source.

## Exact candidate inputs

`sources.lock.json` is authoritative for full URLs, source/producer revisions,
SDK revisions, sizes and SHA-256. All three exact archives are now published.
Anonymous download, size, SHA-256 and source/producer/toolchain verification
passed in the VM and on the Mac. The earlier 404/cache-only limitation is
historical and superseded by the clean remote-input build below.

| Input | Canonical source commit | Producer commit | Published archive bytes |
| --- | --- | --- | ---: |
| Mix previews | `mix-website@23a73c6c0ddad669f2feafa9ede2ba7b7351a4f7` | `23a73c6c0ddad669f2feafa9ede2ba7b7351a4f7` | 1,931,761 |
| Naked UI docs | `remix@99c6da876de43f54d039bdb097fe5c7b74dce709` | `4230ceeed0c0526dbc72769c35cf020b0e803015` | 40,353 |
| Remix docs/catalog | `remix@ba450dc72223d3ebacee0282b989d4ee2823828f` | `4230ceeed0c0526dbc72769c35cf020b0e803015` | 18,500,647 |

The isolated canonical Naked UI changes are published as draft
[Remix PR #381](https://github.com/btwld/remix/pull/381), at the Naked source SHA
above. They change documentation, tooling and a README, not package behavior.
Active naked_ui is 1.5.0. Remix's older reviewed snapshot stays explicitly pinned;
it is not silently replaced by current upstream main.

## Publication and clean remote-input build

The owner authorized publishing the recorded existing public btwld material
under existing notices, without a new blanket license. Branch
`conductor/flutter-mix-website-migration` was pushed at
`70d679c69a7276beeacdc05d9a02363a55b3e413` and the three existing verified
archive bytes were published without rebuilding, repinning or replacement.
GitHub's asset digests match the lock. Its releases report `immutable:false`;
the consumer rejects changed bytes, while GitHub-enforced immutability is not
claimed. The integration's policy endpoint returned 403.

A fresh remote clone of that exact SHA started with no `node_modules`, input
cache, generated snapshots, Next outputs or staged public bundles. A frozen
pnpm install reused the ordinary dependency package store; no site inputs or
generated outputs were restored. Prebuild anonymously downloaded all three
published archives. Node 24.22.1 / pnpm 11.5.3 passed lint, **26/26 unit tests**,
typecheck, input/source parity, exact inventory and the production build.
The resulting server identity reports the exact candidate SHA, `dirty:false`,
lock hash `0c3ecb0b62fdd0ba2e06ec4b9c179747d610f41dcdd7da90f4e46860eab9a649`
and all three pinned input digests. The noindex rendered audit passed **120
routes, 118 internal links, 2,172 heading targets, 216 archived heading targets
and 14 images**, with zero errors. This clean build is served on sandbox port
3300; the earlier runtime-review build/evidence remains preserved separately.

[Draft website PR #1](https://github.com/btwld/mix-website/pull/1) started actual
GitHub CI on this published candidate. Its
[initial run](https://github.com/btwld/mix-website/actions/runs/41928484889)
passed 57/60 browser tests and failed three WebKit responsive checks. The
failures reproduce locally: direct-load checks accumulated cancelled imports/
prefetch errors across forced document navigations, and Playwright rejects wheel
input in mobile WebKit. The corrected audit settles and checks each page before
closing it, retaining all active-page errors and failed requests. The table
wheel check uses the same narrow touch-capable viewport with supported desktop
emulation; actual mobile navigation remains covered separately. The corrected
responsive suite passes **5/5 Chromium and 5/5 WebKit**. Complete CI on the
corrected revision remains a separate gate from the clean local build. Protected `main` remains `971cb1ac4bbb1724c6fde171470b44fce69a9e60`;
no main-branch CI success or privileged preview deployment is implied.

The first hosted review found the Getting Started installation placeholder and
stale SDK minimums. The official pub.dev API on 2026-11-04 reports Mix 2.3.1,
`sdk: >=3.12.0 <4.0.0`, `flutter: >=3.44.0`. The page now pins `mix: ^2.3.1`,
states those constraints and describes Mix 2; the lint setup's current-project
prerequisites agree. Original import hashes are preserved in `SOURCES.json`,
with explicit update provenance. No remaining `{latest_version}` placeholders
were found. Production build, rendered installation/metadata assertions and the
actual Getting Started Flutter preview pass locally with no runtime/network
errors. No Flutter source, archive or lock pin changed for these MDX edits.

## Content and source checks

- Exact inventories account for **29 Mix + 53 Remix + 23 Naked UI = 105 MDX
  pages**, plus generated indexes and landings for **120 routes**.
- Every one of the **235 legacy URL rows** has a classification: 213 migrated,
  11 prepared redirects, eight intentional exclusions and three unresolved.
  The separate historical ledger accounts for **151 unique paths**: 99 prepared
  redirects, 51 unresolved version/archive decisions and one retained path,
  plus five non-page pattern groups. These are local decisions, not redirects
  activated at legacy origins. See [inventory](inventory.md) for exclusions and
  count reconciliation.
- All **30 used Mix preview IDs** resolve. Every one of the **74 manifest
  entries** has an authored source file matching the locked snippet bytes.
  A deterministic fingerprint covers the complete authored Flutter package,
  registry/helpers, dependency locks, web/assets and producer/toolchain recipe.
  Edits, additions or deletions make prebuild fail until a new input is built/pinned;
  generated caches/build outputs are excluded. An isolated source-edit experiment changed both compiled WASM
  and the exported snippet; see [ownership proof](source-ownership-check.md).
- Naked UI's canonical checker analyzes **39 complete Dart examples** and
  compiles them with the Flutter frontend against the active workspace package.
  The corrected AlertDialog example remains compiled. **26 reference fences**
  have explicit, reasoned excerpt markers and exact code/API-source hashes;
  this includes the restored Slider constructor reference. There are no
  opening-syntax exemptions or blanket relabeling of complete examples.
- The Remix producer runs the existing complete `docs:check` contract: **194
  analyzable examples** across docs/published skills, eight explicitly marked
  excerpts, tutorial asset/source receipts and existing theme/catalog checks.
  Preparation preserves expanded tutorial ZIP includes and actual catalog
  source panels. The rebuilt payload's 142 files match the pilot payload bytes;
  only archive provenance changed.
- Type checking, repository lint, input/source parity, exact inventory audit,
  **26 unit tests** and actionlint all pass locally. Digest mismatch, missing
  archives, wrong source/producer/toolchain and stale Mix snippets fail closed.
  Build identity treats uncommitted new authored files as dirty while excluding
  ignored generated outputs; an untracked page cannot masquerade as clean source.

## Rendered and browser checks

Before the fresh runtime review, a production-mode cached build passed the rendered audit for all
**120 routes**, including project landings, docs fallback indexes and real
pages: exact canonical and OG URLs, sitemap set and robots advertisement.
That noindex candidate also passed: no production canonical/OG URL,
noindex response headers and page metadata, disallowed robots and no advertised
sitemap. Both audits cover **117 distinct internal links, 2,172 heading targets,
216 archived Naked heading targets, 14 images**, every canonical search page
and its project label, and concrete local legacy destinations, with zero errors.
These counts concern targets actually inspected, not inferred coverage from
the page count.

The archived Naked heading ledger states its conventional Markdown slug basis.
Live legacy renderer probes returned 403 (docs.page) and 429 (Concepta), so
exact historical renderer equivalence is not claimed. Slider property aliases
and the preserved Switch heading resolve in the rendered candidate.

The expanded server browser suite passed **25/25 Chromium**. WebKit passed
24/25 initially; its debounced search assertion was corrected and the targeted
rerun passed. The equivalent static representation then passed **25/25 Chromium
and 25/25 WebKit** in the Firebase Hosting emulator. The suites check all 30
Mix preview IDs and all Remix component embeds, actual Flutter readiness,
animation interaction, shared engine reuse, exact snippet responses, keyboard
search/navigation, real 404s, asset MIME/cache/noindex headers, catalog base
href and service-worker scope. The final Naked reference/anchor update was
additionally checked by the full rendered audit and five targeted Chromium
cases; it does not change either compiled Flutter bundle.

The historical returning-browser check used a namespace-only fixture and did
not establish compiled runtime/source coherence. It is superseded by a real
recompiled Box fixture in the local runtime review below. Historical logs remain
available and are not counted as proof of the stronger contract.

Production keeps preview/catalog/search/identity endpoints noindex even when
docs are indexed; `__site.json` is no-store. Static PR builds force noindex even
if the invoking shell has production indexing enabled. A final static export
invoked with `SITE_INDEXING=index` passed the complete noindex rendered audit
and all five focused Chromium cases. Original-origin worker
retirement remains cutover work; no legacy deployment or DNS has changed.

## Prepared delivery and remaining proof

CI builds without Google credentials, checks remote availability before using
archive caches, and tests both the server and static representations. Trusted
default-branch workflows validate numeric repository identity, successful run,
current same-repository PR head and matching artifact/input identity before
OIDC deployment. Lifecycle unit tests cover independent channels, superseded
build rejection/rollback and reopened-PR cleanup. **They do not establish live
GitHub, OIDC or Hosting API behavior.** No preview resources have been created.

Full App Hosting staging acceptance remains open. The owner-confirmed
`bitwild-oss` project is active/billed with APIs enabled. This cloud VM lacks
Firebase authentication; the authenticated Mac now created `fluttermix` in
`us-east4` and completed its first local-source rollout at reviewed app `70d679c`. The initial empty backend
list is historical. The accidental empty `my-web-app` backend was deleted and
its web app reused. No credentials need to be copied into chat, this VM or source
control. Tracked Firebase source config selects `fluttermix` / root `.`. The Mac
upload's local overlay adds `SITE_COMMIT=70d679c69a7276beeacdc05d9a02363a55b3e413`
because `.git` is excluded; reviewed `apphosting.yaml` is unchanged. This is
reported deployment metadata, not a claim that an overlay is part of the
reviewed app tree. The hosted identity matches the provided app SHA, lock hash
and all three digests. The normalized-header rendered audit passes all 120
routes, 118 links, 2,172 heading targets, 216 archived heading targets and 14
images with zero errors at
https://fluttermix--bitwild-oss.us-east4.hosted.app. HTTP field names are
normalized on both success and error responses; local and hosted audits now
check identical targets, and zero heading coverage fails explicitly. See `deployment.md` for the identity contract.
Next 16.4.1 has local build/adapter evidence, but the freshly checked official
support table still lists Next 15.2 as active. The first hosted build/runtime serves the expected app; current Safari,
interactive examples and returning-browser behavior still need hosted verification.

Publication authorization, exact archives and the clean remote-input build are
complete. Continue corrected-revision PR CI and finish hosted interactive
acceptance of the first App Hosting rollout before activating preview automation. Then prove
two independent PR URLs, same-URL update, stale/fork rejection and cleanup.
Production project selection and domain cutover remain a separate final owner
checkpoint. See [deployment](deployment.md) for concrete preparation and rollback.

## Fresh local runtime and visual review

The full desktop/mobile review is scoped to product snapshot
`2d90f390423310e1c02b1748d1b8ba1b86e1ee1e`; the final narrow resolved-state fix is
`2c82828b3468608ba9d29eee273ecf54a4c4670d`. Documentation-only commits after that
snapshot do not change the tested product bytes. That review's server build
recorded the product SHA and honestly reported a dirty checkout while delivery
records were edited. The later clean published-candidate build above supersedes
that build for source-identity verification, without relabeling earlier browser
evidence as a new test run.

- Fresh production startup succeeded on sandbox port **3300**. The server was
  stopped before A/B rebuilds, restarted after canonical restoration, and rebuilt
  once for the final resolved-state fix. Its served input identity matches all
  three canonical lock digests and the lock SHA-256. The final server stays running
  for Conductor Forward ports; no public tunnel or deployed URL is implied.
- Fresh dev startup passed the home and representative Mix, Remix and Naked UI
  routes, actual Box source/preview, Remix Flutter readiness and the real Dialog
  anchor. A final Mix dev smoke exercises the resolved-state fix independently
  of the production server. The dev process is stopped after the check.
- **30/30 Chromium tests** passed on the full review snapshot, including desktop
  1440px and mobile 390px routes, project entry points/switching, sidebar order,
  labeled search, all used Mix IDs and all Remix component examples. A real
  horizontal wheel gesture reaches the comparison table's final column inside
  its local scrolling container; the document does not overflow.
- The full rendered audit passed **120 routes, 118 distinct internal links,
  2,172 heading targets, 216 archived heading targets and 14 images**, with zero
  errors. The extra distinct link versus earlier evidence comes from concise
  project entry navigation. All 105 docs remain reachable by navigation/search.
- **26 visits and 31 original after screenshots** cover the home, three landings,
  three docs indexes, long docs, actual Mix demo/source, ready Remix embed, Naked
  API/AlertDialog anchor, project search and mobile sidebar. No console, page,
  network or document-overflow errors were found. The guessed AlertDialog page
  is an expected 404; the inventoried route is Dialog with
  `#shownakedalertdialog`. Final source/catalog captures additionally show the
  canonical Box disclosure, actual Remix source panel and direct Flutter catalog.
  The parent independently approved the after contact sheet; no theme/layout
  redesign was needed. Full-size captures remain in local evidence.
- The final frozen returning-browser script (SHA-256
  `e3d3a92432f6626b38abca1a778cc6026e46fb4465d3ee1d3015cadaac021365`)
  passed against a **genuinely recompiled** Box fixture from source
  `de92644a5829b72558a0aacd9854b0b0aa1d06ba`. Baseline bundle
  `ba0a0926fab14633` visibly renders “Hello Mix”; fixture bundle
  `2e7a4f0245a97ba5` visibly renders “Hello Mix B”. Compiled WASM bytes differ,
  their displayed sources match, and screenshots preserve both. Before navigation
  the retained tab remains coherently A. Requesting B reloads the page-global A
  engine before rendering B, leaving five ready animation views and no failed
  asset/snippet responses. The original lock/source/build were restored.
  This run covers navigation on the full review snapshot; it does not claim to
  cover the later same-instance refresh race.
- The reviewer’s **same-instance open-source race was reproduced** with the saved
  pre-fix component: a B source fetch preceded document reload. Final code stores
  an atomic entry/request identity containing preview ID, preview base and source
  base; it renders children only for matching props. The intercepted standalone
  browser fixture bundles the actual React components using existing esbuild.
  Both code-only and actual Flutter preview/disclosure modes pass: no B manifest
  or source fetch before reload, and preview-ID/source-only updates resolve while
  preserving disclosure state. This ordering fixture uses the same verified
  payload under two namespaces; the separate compiled A/B test above establishes
  observable version differences. No public test route or product debug API was
  added. CI now runs the focused component check.
- After the final fix, type checking, **26 unit tests**, actionlint, the production
  build and **3/3 focused Chromium preview tests** pass. Those tests cover all five
  animation interactions, same-bundle singleton reuse/view cleanup across
  navigation, and locked snippet parity. The earlier full-corpus/30-test evidence
  is retained with its snapshot scope, rather than relabeled as a new full run.

All confirmed local review findings are closed: producer ownership/fingerprint,
obsolete pilot assertions, Naked example/reference accounting, page/URL counts,
sitemap/rendered metadata, concise navigation, source access, mobile table
scrolling, real compiled A/B coherence and the same-instance race. The explicit
legacy exclusions/unresolved archival decisions in `inventory.md` remain.

The review initially ended with all three locked assets returning 404; the
subsequent authorized publication and clean remote-input build above close
that limitation. Complete corrected-revision CI, hosted interactive/Safari checks and live two-PR
preview/update/cleanup remain delivery gates. No protected-main merge or DNS
change occurred here. Remix draft PR #381 and source ownership are unchanged.

The parent independently cloned exact `70d679c` on the Mac and verified all
three anonymous inputs. Direct Mac browser acceptance is not recorded here.
The VM exposes no native Mac command or sync-inspection tool; an exact clone
does not imply that Conductor file sync is enabled. Sandbox port 3300 remains
available through Conductor's actual assigned forwarded port.
