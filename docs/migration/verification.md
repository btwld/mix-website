# Verification and delivery record

Recorded 2026-11-04. This is a local implementation candidate, not a hosted
release. The [plan](plan.md) is the single status checklist; this record gives
its evidence and limits. Raw logs, failure traces, archives and screenshots
remain outside tracked source.

## Exact candidate inputs

`sources.lock.json` is authoritative for full URLs, source/producer revisions,
SDK revisions, sizes and SHA-256. Each archive has been built and verified
locally, but **all three locked public release URLs return HTTP 404** in the
uncached availability check. No clean remote rebuild or successful CI run is
claimed.

| Input | Canonical source commit | Producer commit | Local archive bytes |
| --- | --- | --- | ---: |
| Mix previews | `mix-website@07f167db8124ce0870ad5736b54512506c0f0df2` | `07f167db8124ce0870ad5736b54512506c0f0df2` | 1,922,921 |
| Naked UI docs | `remix@99c6da876de43f54d039bdb097fe5c7b74dce709` | `4230ceeed0c0526dbc72769c35cf020b0e803015` | 40,353 |
| Remix docs/catalog | `remix@ba450dc72223d3ebacee0282b989d4ee2823828f` | `4230ceeed0c0526dbc72769c35cf020b0e803015` | 18,500,647 |

The isolated canonical Naked UI changes are published as draft
[Remix PR #381](https://github.com/btwld/remix/pull/381), at the Naked source SHA
above. They change documentation, tooling and a README, not package behavior.
Active naked_ui is 1.5.0. Remix's older reviewed snapshot stays explicitly pinned;
it is not silently replaced by current upstream main.

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
  A changed canonical Dart source makes prebuild fail until its new input is
  built/pinned. An isolated source-edit experiment changed both compiled WASM
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
  **24 unit tests** and actionlint all pass locally. Digest mismatch, missing
  archives, wrong source/producer/toolchain and stale Mix snippets fail closed.
  Build identity treats uncommitted new authored files as dirty while excluding
  ignored generated outputs; an untracked page cannot masquerade as clean source.

## Rendered and browser checks

The latest production-mode cached build passes the rendered audit for all
**120 routes**, including project landings, docs fallback indexes and real
pages: exact canonical and OG URLs, sitemap set and robots advertisement.
The latest noindex candidate also passes: no production canonical/OG URL,
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

The returning-browser test passed fresh and retained-tab cases across a lock
update: only the new Mix digest after navigation, no retired namespace requests,
no failed asset/snippet responses, fixed catalog filenames revalidated, and all
five animation previews ready in an already-open tab. It restored the original
lock and rebuilt. That run predates the final Naked prose/anchor pin; the Mix
and Remix payloads it exercises are unchanged. Earlier failed attempts remain
in local evidence and are not counted as passes.

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

App Hosting staging remains the next hosted proof. The owner-confirmed
`bitwild-oss` project is active/billed with APIs enabled; the last verified backend
count was zero. The CLI backend-list attempt here failed authentication.
Next 16.4.1 has local build/adapter evidence, but the freshly checked official
support table still lists Next 15.2 as active. Hosted compatibility and current
Safari must be verified on the actual generated hostname.

Before remote delivery: settle the narrow Mix publication terms in
[notices](notices.md), publish the source and approved archives, verify anonymous
download/size/digest, then run CI without restored archives/generated outputs.
Authenticate to Google using an appropriate existing identity and prove one
App Hosting staging rollout before activating preview automation. Then prove
two independent PR URLs, same-URL update, stale/fork rejection and cleanup.
Production project selection and domain cutover remain a separate final owner
checkpoint. See [deployment](deployment.md) for concrete preparation and rollback.
